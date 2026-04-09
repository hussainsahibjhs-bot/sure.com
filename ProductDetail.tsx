import { useState } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Check, Minus, Plus, ShoppingBag, Star, Truck, Shield } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProduct } from "@/hooks/use-products";
import { useCart } from "@/hooks/use-cart";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";

export default function ProductDetail() {
  const { id } = useParams();
  const productId = parseInt(id || "0", 10);
  const { data: product, isLoading, error } = useProduct(productId);
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square w-full rounded-[2.5rem]" />
            <div className="space-y-6 pt-8">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-24 w-full mt-8" />
              <Skeleton className="h-14 w-full rounded-2xl mt-8" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-32 text-center">
          <h1 className="text-3xl font-display font-bold mb-4">Product not found</h1>
          <p className="text-muted-foreground mb-8">The product you're looking for doesn't exist or has been removed.</p>
          <Button asChild className="rounded-full"><Link href="/products">Back to Shop</Link></Button>
        </div>
      </Layout>
    );
  }

  const fallbackImage = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&q=80";
  const inStock = product.stock > 0;

  return (
    <Layout>
      <div className="bg-zinc-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/products" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          
          {/* Images */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[2.5rem] overflow-hidden bg-zinc-100 border border-border/50 aspect-square flex items-center justify-center p-8 relative"
          >
            {product.isFeatured && (
              <div className="absolute top-6 left-6 z-10 bg-background/90 backdrop-blur-md px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-sm">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                Featured
              </div>
            )}
            <img 
              src={product.imageUrl || fallbackImage} 
              alt={product.name}
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </motion.div>

          {/* Details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col pt-4 lg:pt-8"
          >
            <div className="text-sm font-bold text-primary tracking-widest uppercase mb-3">
              {product.category}
            </div>
            <h1 className="text-4xl lg:text-5xl font-display font-extrabold text-foreground leading-[1.1] mb-4">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/50">
              <span className="text-3xl font-display font-bold text-foreground">
                {formatCurrency(Number(product.price))}
              </span>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${inStock ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/10 text-destructive'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-destructive'}`} />
                {inStock ? `${product.stock} in stock` : 'Out of stock'}
              </div>
            </div>

            <div className="prose prose-zinc mb-8 text-muted-foreground leading-relaxed">
              <p>{product.description}</p>
            </div>

            {inStock && (
              <div className="mb-8 p-6 bg-zinc-50 rounded-2xl border border-border/50">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="flex items-center bg-background rounded-full border border-border shadow-sm p-1 w-full sm:w-auto h-14">
                    <button 
                      className="w-12 h-12 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors disabled:opacity-50"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-medium text-lg">{quantity}</span>
                    <button 
                      className="w-12 h-12 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors disabled:opacity-50"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="flex-1 w-full h-14 rounded-full text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
                    onClick={() => addItem(product, quantity)}
                  >
                    <ShoppingBag className="mr-2 w-5 h-5" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-4 mt-auto pt-8">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-medium text-foreground block">Free Shipping</span>
                  Dispatches within 24 hours
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-medium text-foreground block">2 Year Warranty</span>
                  Quality guaranteed on all purchases
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
