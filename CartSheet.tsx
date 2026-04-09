import { useCart } from "@/hooks/use-cart";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingBag, X, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

export function CartSheet() {
  const { items, removeItem, updateQuantity, totalPrice, isCartOpen, setIsCartOpen } = useCart();
  const [, setLocation] = useLocation();

  const handleCheckout = () => {
    setIsCartOpen(false);
    setLocation("/checkout");
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 bg-background border-l border-border shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-border bg-background">
          <SheetHeader className="flex flex-row items-center justify-between space-y-0">
            <SheetTitle className="font-display text-2xl flex items-center gap-2 text-foreground">
              <ShoppingBag className="w-6 h-6 text-primary" />
              Your Cart
              {items.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-bold">
                  {items.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              )}
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 bg-secondary/30 dark:bg-zinc-900/60 space-y-3">
          <AnimatePresence initial={false}>
            {items.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full text-center space-y-6 py-20"
              >
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary/50">
                  <ShoppingBag className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-semibold text-foreground">Your cart is empty</h3>
                  <p className="text-muted-foreground mt-2 max-w-[200px] mx-auto">Looks like you haven't added anything yet.</p>
                </div>
                <Button 
                  onClick={() => { setIsCartOpen(false); setLocation("/products"); }}
                  className="rounded-full px-8"
                >
                  Start Shopping
                </Button>
              </motion.div>
            ) : (
              items.map((item) => (
                <motion.div 
                  key={item.product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
                  className="flex gap-4 bg-card dark:bg-zinc-800 p-4 rounded-2xl shadow-sm border border-border group"
                >
                  {/* Product image */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                    <img 
                      src={item.product.imageUrl || `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80`} 
                      alt={item.product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>

                  <div className="flex flex-col flex-1 py-0.5 justify-between min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-0.5">{item.product.category}</p>
                        <h4 className="font-semibold text-foreground line-clamp-1 leading-tight text-sm">
                          {item.product.name}
                        </h4>
                      </div>
                      <button 
                        onClick={() => removeItem(item.product.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-full hover:bg-destructive/10 flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-primary text-base">
                        {formatCurrency(Number(item.product.price) * item.quantity)}
                      </span>
                      
                      <div className="flex items-center bg-background dark:bg-zinc-900 rounded-full border border-border p-0.5 shadow-sm">
                        <button 
                          className="w-7 h-7 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-all disabled:opacity-40"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-sm font-bold text-foreground">{item.quantity}</span>
                        <button 
                          className="w-7 h-7 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-all disabled:opacity-40"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 bg-background border-t border-border">
            <div className="space-y-2 mb-5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium text-foreground">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="text-emerald-500 font-medium">Free</span>
              </div>
              <div className="flex justify-between items-center pt-3 mt-3 border-t border-border">
                <span className="font-bold text-foreground text-base">Total</span>
                <span className="font-display font-bold text-2xl text-primary">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>
            <Button 
              className="w-full rounded-2xl h-13 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5 group"
              onClick={handleCheckout}
            >
              Checkout Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
