import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { ArrowLeft, CheckCircle2, Lock, Smartphone, Banknote, QrCode, Copy, Check } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/hooks/use-cart";
import { useCreateOrder } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const STORE_UPI_ID = "surestore@paytm";
const STORE_NAME   = "Sure Store";

function buildUpiUrl(upiId: string, name: string, amount: number) {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR`;
}

function buildQrUrl(data: string, size = 220) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&bgcolor=ffffff&color=000000&margin=10`;
}

function UpiQrPanel({ totalPrice, upiId, sellerName, onPaid }: {
  totalPrice: number;
  upiId: string;
  sellerName?: string;
  onPaid: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const upiUrl = buildUpiUrl(upiId, sellerName || STORE_NAME, totalPrice);
  const qrUrl  = buildQrUrl(upiUrl);

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-6 overflow-hidden"
    >
      <div className="bg-card border border-primary/30 rounded-2xl p-6 text-center shadow-sm">
        <div className="flex items-center justify-center gap-2 mb-4">
          <QrCode className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Scan & Pay via UPI</h3>
        </div>

        {/* QR Code */}
        <div className="inline-block p-3 bg-white rounded-2xl shadow-md mb-4 border border-border">
          <img
            src={qrUrl}
            alt="UPI Payment QR"
            width={200}
            height={200}
            className="rounded-xl block"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </div>

        {/* UPI ID row */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="font-mono text-sm font-bold bg-muted px-4 py-2 rounded-full text-foreground border border-border">
            {upiId}
          </span>
          <button
            onClick={handleCopy}
            className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Copy UPI ID"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-2">
          Amount: <strong className="text-primary text-base">{formatCurrency(totalPrice)}</strong>
        </p>
        <p className="text-xs text-muted-foreground mb-5 max-w-xs mx-auto">
          Open any UPI app (GPay, PhonePe, Paytm) → Scan QR → Confirm payment → Click "I've Paid" below.
        </p>

        {/* Direct open UPI */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
          <a
            href={`https://pay.google.com/gp/v/send/${upiId}?am=${totalPrice.toFixed(2)}&cu=INR`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white border border-border text-sm font-semibold hover:border-primary/50 hover:shadow-md transition-all text-foreground"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Google_Pay_Logo.svg/512px-Google_Pay_Logo.svg.png" alt="GPay" className="h-4" />
            GPay
          </a>
          <a
            href={`phonepe://pay?pa=${upiId}&am=${totalPrice.toFixed(2)}&cu=INR&tn=SureStore`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white border border-border text-sm font-semibold hover:border-primary/50 hover:shadow-md transition-all text-foreground"
          >
            <span className="font-bold text-indigo-600 text-xs">PE</span>
            PhonePe
          </a>
          <a
            href={`paytmmp://pay?pa=${upiId}&am=${totalPrice.toFixed(2)}&cu=INR`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white border border-border text-sm font-semibold hover:border-primary/50 hover:shadow-md transition-all text-foreground"
          >
            <span className="font-bold text-blue-500 text-xs">PT</span>
            Paytm
          </a>
        </div>

        <Button
          onClick={onPaid}
          className="w-full rounded-xl h-12 font-semibold shadow-md shadow-primary/20"
        >
          <Check className="w-4 h-4 mr-2" />
          I've Paid — Place Order
        </Button>
      </div>
    </motion.div>
  );
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, totalPrice, clearCart } = useCart();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const createOrder = useCreateOrder();

  const [formData, setFormData] = useState({
    name: "", address: "", city: "", zip: "", phone: "", paymentMethod: "COD" as "COD" | "UPI"
  });

  const [codStep, setCodStep] = useState<"details" | "otp">("details");
  const [otpValue, setOtpValue] = useState("");
  const [generatedOtp] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (items.length === 0 && !createOrder.isSuccess) {
      setLocation("/products");
    }
  }, [items.length, createOrder.isSuccess, setLocation]);

  const handlePlaceOrder = () => {
    const orderItems = items.map(item => ({
      productId: item.product.id,
      quantity: item.quantity
    }));

    createOrder.mutate({ 
      items: orderItems,
      paymentMethod: formData.paymentMethod,
      address: `${formData.address}, ${formData.city}, ${formData.zip}`,
      phone: formData.phone
    }, {
      onSuccess: () => { clearCart(); }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.paymentMethod === "COD" && codStep === "details") {
      if (!formData.phone || formData.phone.length < 10) {
        alert("Please enter a valid 10-digit mobile number");
        return;
      }
      setCodStep("otp");
      return;
    }

    if (formData.paymentMethod === "COD" && codStep === "otp") {
      if (otpValue === generatedOtp) {
        handlePlaceOrder();
      } else {
        alert("Invalid OTP. Please try again.");
      }
      return;
    }

    handlePlaceOrder();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Detect if any cart item has a seller UPI
  const sellerUpiItem = items.find(i => (i.product as any).sellerUpiId);
  const activeUpiId   = sellerUpiItem ? (sellerUpiItem.product as any).sellerUpiId : STORE_UPI_ID;
  const activeSellerName = sellerUpiItem ? (sellerUpiItem.product as any).submitterName : STORE_NAME;

  const isFormFilled = formData.name && formData.address && formData.city && formData.zip && formData.phone;

  if (authLoading || !isAuthenticated) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center py-32">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (createOrder.isSuccess) {
    const orderData = createOrder.data;
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center py-32 px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-card p-10 rounded-[2.5rem] shadow-2xl border border-border text-center"
          >
            <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h1 className="text-4xl font-display font-bold mb-2 text-foreground">Order Confirmed!</h1>
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold block mb-1">Your Order ID</span>
              <span className="text-2xl font-mono font-bold text-primary tracking-widest">#ORD-{orderData.id.toString().padStart(6, '0')}</span>
            </div>
            <p className="text-muted-foreground text-lg mb-8">
              Thank you for your purchase! Use the Order ID above to track your delivery.
            </p>
            <div className="space-y-4">
              <Button asChild className="w-full rounded-full h-14 text-lg shadow-lg shadow-primary/20">
                <Link href={`/track?id=#ORD-${orderData.id.toString().padStart(6, '0')}`}>Track Order Now</Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full h-14 text-lg">
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-muted/50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button onClick={() => setLocation("/products")} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Shop
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-8">Secure Checkout</h1>

        <div className="grid lg:grid-cols-12 gap-10 items-start">

          {/* Left: Form */}
          <div className="lg:col-span-7 space-y-8">
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-8">
              <AnimatePresence mode="wait">
                {codStep === "details" ? (
                  <motion.div 
                    key="details"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-8"
                  >
                    {/* Shipping */}
                    <div className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm">
                      <h2 className="text-xl font-display font-semibold mb-6 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
                        Shipping Details
                      </h2>
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" name="name" required value={formData.name} onChange={handleChange} className="h-12 rounded-xl bg-background" placeholder="Rahul Sharma" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Mobile Number</Label>
                          <Input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleChange} className="h-12 rounded-xl bg-background" placeholder="9876543210" maxLength={10} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Street Address</Label>
                          <Input id="address" name="address" required value={formData.address} onChange={handleChange} className="h-12 rounded-xl bg-background" placeholder="123 MG Road, Flat 4B" />
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input id="city" name="city" required value={formData.city} onChange={handleChange} className="h-12 rounded-xl bg-background" placeholder="Mumbai" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="zip">PIN Code</Label>
                            <Input id="zip" name="zip" required value={formData.zip} onChange={handleChange} className="h-12 rounded-xl bg-background" placeholder="400001" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment */}
                    <div className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm">
                      <h2 className="text-xl font-display font-semibold mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</span>
                          Payment Method
                        </div>
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      </h2>

                      <RadioGroup 
                        value={formData.paymentMethod} 
                        onValueChange={(val: "COD" | "UPI") => setFormData(prev => ({ ...prev, paymentMethod: val }))}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      >
                        <Label
                          htmlFor="upi"
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            formData.paymentMethod === 'UPI' ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${formData.paymentMethod === 'UPI' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                              <QrCode className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-foreground">UPI / QR Pay</div>
                              <div className="text-xs text-muted-foreground">GPay, PhonePe, Paytm</div>
                            </div>
                          </div>
                          <RadioGroupItem value="UPI" id="upi" className="sr-only" />
                          {formData.paymentMethod === 'UPI' && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                        </Label>

                        <Label
                          htmlFor="cod"
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            formData.paymentMethod === 'COD' ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${formData.paymentMethod === 'COD' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                              <Banknote className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-foreground">Cash on Delivery</div>
                              <div className="text-xs text-muted-foreground">Pay when delivered</div>
                            </div>
                          </div>
                          <RadioGroupItem value="COD" id="cod" className="sr-only" />
                          {formData.paymentMethod === 'COD' && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                        </Label>
                      </RadioGroup>

                      {/* UPI QR Panel */}
                      <AnimatePresence>
                        {formData.paymentMethod === 'UPI' && isFormFilled && (
                          <UpiQrPanel
                            totalPrice={totalPrice}
                            upiId={activeUpiId}
                            sellerName={activeSellerName}
                            onPaid={handlePlaceOrder}
                          />
                        )}
                        {formData.paymentMethod === 'UPI' && !isFormFilled && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-5 p-4 bg-muted rounded-2xl border border-border text-center text-sm text-muted-foreground"
                          >
                            <Smartphone className="w-5 h-5 mx-auto mb-2 text-primary" />
                            Fill in your shipping details above to reveal the UPI QR code.
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ) : (
                  /* OTP Step for COD */
                  <motion.div 
                    key="otp"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm text-center"
                  >
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                      <Smartphone className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-display font-bold mb-2 text-foreground">Verify COD Order</h2>
                    <p className="text-muted-foreground mb-8">
                      Enter the 6-digit OTP sent to <span className="font-bold text-foreground">{formData.phone}</span>
                    </p>

                    <div className="max-w-xs mx-auto space-y-4">
                      <Input 
                        type="text" 
                        maxLength={6} 
                        className="h-14 text-center text-3xl font-mono tracking-widest rounded-2xl bg-background" 
                        placeholder="000000"
                        value={otpValue}
                        onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                        autoFocus
                      />
                      <div className="text-sm text-muted-foreground">
                        Didn't receive code?{" "}
                        <button type="button" className="text-primary font-bold hover:underline">Resend OTP</button>
                      </div>
                    </div>

                    <div className="mt-10 flex gap-4">
                      <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setCodStep("details")}>Back</Button>
                      <Button className="flex-1 h-12 rounded-xl" type="submit" disabled={otpValue.length !== 6}>
                        Verify & Confirm
                      </Button>
                    </div>

                    <div className="mt-4 p-3 bg-muted rounded-xl text-xs text-muted-foreground border border-border">
                      Demo OTP: <span className="font-bold text-primary font-mono text-sm">{generatedOtp}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 bg-card p-7 rounded-3xl border border-border shadow-sm">
              <h3 className="font-display text-xl font-bold mb-6 text-foreground">Order Summary</h3>

              <div className="space-y-4 max-h-[38vh] overflow-y-auto pr-1 mb-6">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-xl bg-muted border border-border/50 overflow-hidden flex-shrink-0">
                      <img
                        src={item.product.imageUrl || `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80`}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate text-foreground">{item.product.name}</h4>
                      <div className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-bold text-sm text-foreground">
                      {formatCurrency(Number(item.product.price) * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-5 border-t border-border/50 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="text-emerald-500 font-semibold">Free</span>
                </div>
                <div className="flex justify-between items-center pt-4 mt-2 border-t border-border font-bold">
                  <span className="text-base text-foreground">Total</span>
                  <span className="text-3xl font-display text-primary">{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              {/* Show COD submit button only when on details step and COD selected */}
              {codStep === "details" && formData.paymentMethod === "COD" && (
                <Button 
                  type="submit" 
                  form="checkout-form"
                  disabled={createOrder.isPending}
                  className="w-full h-14 rounded-2xl text-lg mt-7 shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all"
                >
                  {createOrder.isPending ? "Processing..." : "Continue to OTP Verify"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
