import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Search, Package, Clock, CheckCircle2, Truck, Box } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const stages = [
  "Order Placed",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered"
];

const getStageIcon = (stage: string) => {
  switch (stage) {
    case "Order Placed": return <Clock className="w-6 h-6" />;
    case "Confirmed": return <CheckCircle2 className="w-6 h-6" />;
    case "Packed": return <Box className="w-6 h-6" />;
    case "Shipped": return <Truck className="w-6 h-6" />;
    case "Out for Delivery": return <Package className="w-6 h-6" />;
    case "Delivered": return <CheckCircle2 className="w-6 h-6" />;
    default: return <Clock className="w-6 h-6" />;
  }
};

export default function Tracker() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const initialId = searchParams.get('id') || "";

  const [searchInput, setSearchInput] = useState(initialId);
  const [searchQuery, setSearchQuery] = useState<string | null>(initialId || null);

  useEffect(() => {
    if (initialId) {
      setSearchInput(initialId);
      setSearchQuery(initialId);
    }
  }, [initialId]);

  const { data: results, isLoading, error } = useQuery({
    queryKey: ["/api/orders/track", searchQuery],
    queryFn: async () => {
      if (!searchQuery) return null;

      let url = "";
      if (/^\d{10}$/.test(searchQuery)) {
        url = `/api/orders?phone=${searchQuery}`;
      } else {
        const idStr = searchQuery.startsWith("#ORD-") ? searchQuery.replace("#ORD-", "") : searchQuery;
        const id = parseInt(idStr);
        if (isNaN(id)) throw new Error("Invalid Search Input");
        url = `/api/orders/${id}`;
      }

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Order not found");
        throw new Error("Failed to fetch order");
      }

      const data = await res.json();
      return Array.isArray(data) ? data : [data];
    },
    enabled: !!searchQuery
  });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-display font-bold mb-8 text-center"
        >
          Track Your Order
        </motion.h1>

        <div className="flex gap-4 mb-12 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              placeholder="Enter Order ID or Mobile Number" 
              className="h-14 pl-12 rounded-2xl text-lg border-muted/50 focus:border-primary focus:ring-primary/20 transition-all"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setSearchQuery(searchInput)}
            />
          </div>
          <Button 
            size="lg" 
            className="h-14 rounded-2xl px-8 bg-primary hover:bg-primary/90 transition-all duration-300 shadow-[0_5px_15px_rgba(139,92,246,0.3)] hover:shadow-[0_8px_25px_rgba(139,92,246,0.5)] active:scale-95"
            onClick={() => setSearchQuery(searchInput)}
          >
            Track Now
          </Button>
        </div>

        {isLoading && <div className="text-center py-12 text-muted-foreground animate-pulse">Searching for your orders...</div>}

        {error && (
          <Card className="border-destructive/20 bg-destructive/5 max-w-2xl mx-auto rounded-3xl">
            <CardContent className="py-8 text-center text-destructive font-medium">
              We couldn't find any orders matching that ID or mobile number.
            </CardContent>
          </Card>
        )}

        <div className="space-y-12">
          <AnimatePresence>
            {results?.map((order: any) => {
              const currentStageIndex = stages.indexOf(order.status);
              return (
                <motion.div 
                  key={order.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <Card className="rounded-[2.5rem] border-border overflow-hidden shadow-lg backdrop-blur-sm bg-white/90">
                    <CardHeader className="bg-zinc-50/50 border-b border-border/50 p-8">
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div>
                          <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Order Details</span>
                          <h2 className="text-2xl font-display font-bold">#ORD-{order.id.toString().padStart(6, '0')}</h2>
                          <p className="text-sm text-muted-foreground mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Current Status</span>
                          <motion.div 
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="text-xl font-bold text-primary uppercase tracking-tight"
                          >
                            {order.status}
                          </motion.div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-8">
                      <div className="relative pb-12 overflow-x-auto">
                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-zinc-100 md:left-0 md:right-0 md:top-8 md:bottom-auto md:h-0.5 md:w-full">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
                            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                            className="absolute top-0 left-0 h-full bg-primary shadow-[0_0_15px_#8b5cf6]"
                          />
                        </div>

                        <div className="relative flex flex-col md:flex-row justify-between gap-8 min-w-[600px] md:min-w-0">
                          {stages.map((stage, index) => {
                            const isCompleted = index <= currentStageIndex;
                            const isCurrent = index === currentStageIndex;

                            return (
                              <div key={stage} className="flex md:flex-col items-center gap-4 text-center flex-1">
                                <motion.div 
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ delay: index * 0.1 + 0.5, type: "spring", stiffness: 100 }}
                                  className={`relative z-10 w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-500 ${
                                    isCompleted ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-white border-2 border-zinc-100 text-zinc-300'
                                  }`}
                                >
                                  {getStageIcon(stage)}
                                  {isCurrent && (
                                    <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                                  )}
                                </motion.div>
                                <div className="flex flex-col md:items-center text-left md:text-center">
                                  <span className={`text-[10px] uppercase tracking-widest font-bold leading-tight ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {stage}
                                  </span>
                                  {isCurrent && (
                                    <motion.span 
                                      animate={{ opacity: [1, 0.5, 1] }}
                                      transition={{ repeat: Infinity, duration: 1.5 }}
                                      className="text-[10px] text-primary font-extrabold mt-1 tracking-tighter"
                                    >
                                      ● LATEST UPDATE
                                    </motion.span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-12 pt-8 border-t border-border/50 grid sm:grid-cols-2 gap-12">
                        <div>
                          <h4 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-4">Delivery Address</h4>
                          <p className="text-foreground font-medium leading-relaxed">
                            {order.address || "No address provided"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">Mobile: {order.phone}</p>
                        </div>
                        <div className="bg-zinc-50/50 rounded-3xl p-6 border border-border/50">
                          <h4 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-4">Order Summary</h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Payment Method</span>
                              <span className="font-bold uppercase text-zinc-700">{order.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Payment Status</span>
                              <span className={`font-bold uppercase ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{order.paymentStatus}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t border-border/50 pt-3 mt-3">
                              <span>Total Paid</span>
                              <span className="text-primary font-extrabold">{formatCurrency(Number(order.totalAmount))}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}