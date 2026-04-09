import { Link } from "wouter";
import { ArrowRight, Zap, Shield, Truck, Smartphone, BookOpen, Dumbbell, Car, Sofa, Sparkles, ShoppingBasket, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/product/ProductCard";
import { useProducts } from "@/hooks/use-products";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const categories = [
  { label: "Electronics",            href: "/products?category=Electronics",            icon: <Zap className="w-7 h-7" /> },
  { label: "Fashion",                href: "/products?category=Fashion",                icon: <Shirt className="w-7 h-7" /> },
  { label: "Grocery",                href: "/products?category=Grocery",                icon: <ShoppingBasket className="w-7 h-7" /> },
  { label: "Home & Kitchen",         href: "/products?category=Home & Kitchen",         icon: <Sparkles className="w-7 h-7" /> },
  { label: "Beauty",                 href: "/products?category=Beauty & Personal Care", icon: <Shield className="w-7 h-7" /> },
  { label: "Sports & Fitness",       href: "/products?category=Sports & Fitness",       icon: <Dumbbell className="w-7 h-7" /> },
  { label: "Books",                  href: "/products?category=Books",                  icon: <BookOpen className="w-7 h-7" /> },
  { label: "Footwear",               href: "/products?category=Footwear",               icon: <Truck className="w-7 h-7" /> },
  { label: "Furniture",              href: "/products?category=Furniture",              icon: <Sofa className="w-7 h-7" /> },
  { label: "Automotive",             href: "/products?category=Automotive",             icon: <Car className="w-7 h-7" /> },
  { label: "Health",                 href: "/products?category=Health Products",        icon: <Shield className="w-7 h-7" /> },
  { label: "Digital",                href: "/products?category=Digital Products",       icon: <Smartphone className="w-7 h-7" /> },
];

export default function Home() {
  const { data: featuredProducts, isLoading } = useProducts({ isFeatured: true });
  const displayProducts = featuredProducts?.slice(0, 4) || [];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-zinc-50 pt-16 pb-24 md:pt-24 md:pb-32 lg:pt-32 lg:pb-40">
        <div className="absolute inset-0 bg-grid-zinc-200/[0.2] bg-[size:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-50" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                New Collection Arrival
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold text-foreground leading-[1.1] mb-6 tracking-tight text-balance">
                Elevate your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-foreground">everyday</span> lifestyle.
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed max-w-lg">
                Discover our curated selection of premium products designed to bring unparalleled quality and aesthetics into your life.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="rounded-full h-14 px-8 text-lg shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all">
                  <Link href="/products">Shop the Collection</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full h-14 px-8 text-lg bg-background/50 backdrop-blur-sm border-border hover:bg-muted transition-all">
                  <Link href="/track">Track Order</Link>
                </Button>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative lg:h-[600px] flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-[3rem] transform rotate-3 scale-105 -z-10 blur-3xl" />
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/50 w-full h-full max-h-[500px] lg:max-h-full">
                <img 
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80" 
                  alt="Premium headphones on desk" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8">
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl w-full">
                    <div className="text-white/80 text-sm font-medium mb-1">Featured Product</div>
                    <div className="text-white font-display text-2xl font-bold">Wireless Headphones</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-background border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="flex items-center justify-center gap-4 pt-4 sm:pt-0">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Free Delivery</h4>
                <p className="text-sm text-muted-foreground">On all orders above ₹999</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 pt-4 sm:pt-0">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Secure Payments</h4>
                <p className="text-sm text-muted-foreground">UPI & Cash on Delivery</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 pt-4 sm:pt-0">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Fast Delivery</h4>
                <p className="text-sm text-muted-foreground">2–4 business days</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">Trending Now</h2>
              <p className="text-muted-foreground max-w-xl">Our most sought-after pieces, handpicked for quality and exceptional design.</p>
            </div>
            <Button asChild variant="ghost" className="hidden sm:flex group text-primary hover:text-primary hover:bg-primary/5">
              <Link href="/products">
                View All <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col space-y-4">
                  <Skeleton className="h-64 w-full rounded-3xl" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-6 w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
          
          <div className="mt-8 text-center sm:hidden">
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href="/products">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Categories Grid */}
      <section className="py-20 bg-zinc-50 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">Shop by Category</h2>
            <p className="text-muted-foreground">Find exactly what you're looking for across our diverse collections.</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="group flex flex-col items-center gap-3 p-5 rounded-3xl bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                  {cat.icon}
                </div>
                <span className="font-semibold text-xs uppercase tracking-wider text-center leading-tight">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-accent-foreground text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Want to sell your products?</h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Join our marketplace as a seller. Submit your products and reach thousands of customers after admin approval.
          </p>
          <Button asChild size="lg" variant="secondary" className="rounded-full h-14 px-10 text-lg font-bold shadow-2xl">
            <Link href="/seller">Start Selling Today</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
