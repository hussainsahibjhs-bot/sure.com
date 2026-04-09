import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/product/ProductCard";
import { useProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = [
  "All",
  "Electronics",
  "Fashion",
  "Grocery",
  "Home & Kitchen",
  "Beauty & Personal Care",
  "Sports & Fitness",
  "Footwear",
  "Furniture",
  "Books",
  "Toys",
  "Automotive",
  "Health Products",
  "Accessories",
];

export default function Products() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const cat = searchParams.get("category") || "";
    setCategory(cat);
  }, [searchString]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: products, isLoading } = useProducts({
    search: debouncedSearch || undefined,
    category: category || undefined,
  });

  return (
    <Layout>
      {/* Page Header */}
      <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-zinc-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-3 tracking-tight text-foreground">
            {category && category !== "All" ? category : "All Products"}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            Explore our complete collection of premium items, carefully curated for design and durability.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Filters Sidebar */}
          <div className="w-full md:w-56 shrink-0 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4 font-display font-bold text-lg border-b border-border pb-2">
                <SlidersHorizontal className="w-5 h-5" />
                Filters
              </div>
              
              <div className="space-y-5">
                <div>
                  <h3 className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-widest">Search</h3>
                  <div className="relative">
                    <Input 
                      placeholder="Search products..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-background rounded-xl border-border/50 focus-visible:ring-primary/20"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-widest">Category</h3>
                  <div className="space-y-1">
                    {CATEGORIES.map(c => (
                      <button
                        key={c}
                        onClick={() => setCategory(c === "All" ? "" : c)}
                        className={`block w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                          (category === c || (!category && c === "All"))
                            ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/20"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 w-full">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-8 bg-background p-4 rounded-2xl border border-border/50 shadow-sm">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{products?.length || 0}</span> products
                {category && <span className="text-primary font-semibold"> in {category}</span>}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Sort by:</span>
                <select className="bg-transparent font-medium text-foreground outline-none cursor-pointer">
                  <option>Featured</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Newest</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex flex-col space-y-4">
                    <Skeleton className="h-64 w-full rounded-3xl" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                ))}
              </div>
            ) : products?.length === 0 ? (
              <div className="text-center py-24 bg-zinc-50 rounded-3xl border border-dashed border-border">
                <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-display font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                  We couldn't find anything matching your current filters. Try adjusting your search.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => { setSearchQuery(""); setCategory(""); }}
                  className="rounded-full"
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products?.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
