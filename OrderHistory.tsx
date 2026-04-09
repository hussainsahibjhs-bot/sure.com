import { useEffect } from "react";
import { Link } from "wouter";
import { Package, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/hooks/use-orders";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function OrderHistory() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: orders, isLoading: ordersLoading } = useOrders();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/api/login";
    }
  }, [isAuthenticated, authLoading]);

  const formatDate = (dateString: Date | string | null) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-emerald-100 text-emerald-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'processing': return 'bg-amber-100 text-amber-700';
      default: return 'bg-zinc-100 text-zinc-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return <CheckCircle2 className="w-4 h-4 mr-1.5" />;
      case 'shipped': return <Truck className="w-4 h-4 mr-1.5" />; // Assume imported
      default: return <Clock className="w-4 h-4 mr-1.5" />;
    }
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <Layout>
      <div className="bg-zinc-50 border-b border-border py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Order History
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Track your recent purchases, view order details, and manage returns.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {ordersLoading ? (
          <div className="space-y-6 max-w-4xl mx-auto">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 w-full rounded-3xl" />
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-[2.5rem] border border-border border-dashed max-w-3xl mx-auto">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-display font-semibold mb-3">No orders yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-8">
              When you place an order, it will appear here for you to track and manage.
            </p>
            <Button asChild size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">
              <Link href="/products">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {orders.map((order, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={order.id} 
                className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="bg-zinc-50 border-b border-border/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Order Placed</span>
                      <span className="font-medium text-foreground">{formatDate(order.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Payment</span>
                      <span className="font-medium text-foreground uppercase">{order.paymentMethod} - {order.paymentStatus}</span>
                    </div>
                    {order.otp && (
                      <div>
                        <span className="text-muted-foreground block mb-0.5">Tracking OTP</span>
                        <span className="font-mono font-bold text-primary">{order.otp}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Order ID</span>
                      <span className="font-medium text-foreground uppercase">#ORD-{order.id.toString().padStart(6, '0')}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="uppercase tracking-wider">{order.status}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="p-6">
                  <div className="space-y-4">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden shrink-0 border border-border/50">
                          <img 
                            src={item.product.imageUrl || `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80`} 
                            alt={item.product.name} 
                            className="w-full h-full object-cover mix-blend-multiply" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground text-sm sm:text-base line-clamp-1">
                            {item.product.name}
                          </h4>
                          <p className="text-muted-foreground text-sm mt-1">
                            Qty: {item.quantity} × {formatCurrency(Number(item.price))}
                          </p>
                        </div>
                        <div className="font-semibold text-right">
                          {formatCurrency(Number(item.price) * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-border/50 flex justify-end">
                    <Button variant="outline" className="rounded-full h-10 group">
                      Order Details 
                      <ChevronRight className="w-4 h-4 ml-1 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
