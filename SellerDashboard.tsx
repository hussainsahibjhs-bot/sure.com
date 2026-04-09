import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Package, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

const CATEGORIES = [
  "Electronics", "Fashion", "Grocery", "Beauty & Personal Care",
  "Home & Kitchen", "Furniture", "Sports & Fitness", "Books",
  "Toys", "Automotive", "Health Products", "Footwear", "Accessories", "Other"
];

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending:  { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",    icon: <Clock className="w-3 h-3" />,       label: "Under Review" },
  approved: { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon: <CheckCircle2 className="w-3 h-3" />, label: "Approved" },
  rejected: { color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",            icon: <XCircle className="w-3 h-3" />,     label: "Rejected" },
};

export default function SellerDashboard() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", price: "", imageUrl: "", category: "", stock: "1", submitterName: "", upiId: ""
  });

  const { data: submissions = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/submissions"],
    queryFn: async () => {
      const res = await fetch("/api/submissions");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      return apiRequest("POST", "/api/submissions", {
        ...data,
        price: data.price,
        stock: parseInt(data.stock) || 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      setForm({ name: "", description: "", price: "", imageUrl: "", category: "", stock: "1", submitterName: "", upiId: "" });
      setShowForm(false);
      toast({ title: "Submission sent!", description: "Your product is under admin review." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit product.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.price || !form.category) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    submitMutation.mutate(form);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-32">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto py-32 px-4 text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-3xl font-display font-bold mb-3">Seller Dashboard</h1>
          <p className="text-muted-foreground mb-8">Sign in to submit your products for review.</p>
          <Button asChild size="lg" className="rounded-full">
            <a href="/api/login">Sign In to Continue</a>
          </Button>
        </div>
      </Layout>
    );
  }

  const pending  = submissions.filter((s: any) => s.status === 'pending').length;
  const approved = submissions.filter((s: any) => s.status === 'approved').length;
  const rejected = submissions.filter((s: any) => s.status === 'rejected').length;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-display font-bold text-foreground">Seller Dashboard</h1>
            <p className="text-muted-foreground mt-1">Submit products for review and track their status.</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="rounded-full gap-2 shadow-lg shadow-primary/20"
          >
            <PlusCircle className="w-4 h-4" />
            {showForm ? "Cancel" : "Submit New Product"}
            {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Under Review", value: pending,  color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-900/20" },
            { label: "Approved",     value: approved, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Rejected",     value: rejected, color: "text-red-600",     bg: "bg-red-50 dark:bg-red-900/20" },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-3xl p-6 text-center border border-border/50`}>
              <div className={`text-3xl font-bold font-display ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Submit Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-10"
            >
              <Card className="rounded-[2rem] border-primary/20 shadow-lg bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-2xl text-foreground">Product Details</CardTitle>
                  <p className="text-muted-foreground text-sm">All submitted products are reviewed before going live on the store.</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="sub-name">Product Name *</Label>
                        <Input id="sub-name" placeholder="e.g. Handmade Leather Wallet" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="h-11 rounded-xl" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sub-submitterName">Your Name / Brand</Label>
                        <Input id="sub-submitterName" placeholder="e.g. Artisan Crafts Co." value={form.submitterName} onChange={e => setForm(p => ({ ...p, submitterName: e.target.value }))} className="h-11 rounded-xl" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sub-desc">Description *</Label>
                      <Textarea id="sub-desc" placeholder="Describe your product in detail..." rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="rounded-xl resize-none" required />
                    </div>

                    <div className="grid sm:grid-cols-3 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="sub-price">Price (₹) *</Label>
                        <Input id="sub-price" type="number" step="0.01" min="0" placeholder="499.00" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className="h-11 rounded-xl" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sub-stock">Stock Quantity *</Label>
                        <Input id="sub-stock" type="number" min="1" placeholder="10" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} className="h-11 rounded-xl" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sub-category">Category *</Label>
                        <select
                          id="sub-category"
                          value={form.category}
                          onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                          className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                          required
                        >
                          <option value="">Select category</option>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sub-image">Product Image URL</Label>
                      <Input id="sub-image" type="url" placeholder="https://example.com/image.jpg" value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} className="h-11 rounded-xl" />
                    </div>

                    {/* UPI ID for direct payment */}
                    <div className="space-y-2">
                      <Label htmlFor="sub-upi" className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-primary" />
                        Your UPI ID <span className="text-muted-foreground font-normal text-xs">(optional — for direct payment at checkout)</span>
                      </Label>
                      <Input
                        id="sub-upi"
                        placeholder="yourname@paytm or yourname@upi"
                        value={form.upiId}
                        onChange={e => setForm(p => ({ ...p, upiId: e.target.value }))}
                        className="h-11 rounded-xl font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        If provided, buyers will see a QR code to pay directly to you at checkout.
                      </p>
                    </div>

                    {form.imageUrl && (
                      <div className="rounded-2xl overflow-hidden h-40 bg-muted border border-border">
                        <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <Button type="button" variant="outline" className="rounded-full" onClick={() => setShowForm(false)}>Cancel</Button>
                      <Button type="submit" className="rounded-full px-8 shadow-lg shadow-primary/20" disabled={submitMutation.isPending}>
                        {submitMutation.isPending ? "Submitting..." : "Submit for Review"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submissions List */}
        <div>
          <h2 className="text-xl font-display font-bold mb-6 text-foreground">Your Submissions</h2>

          {isLoading && (
            <div className="text-center py-12 text-muted-foreground">Loading your submissions...</div>
          )}

          {!isLoading && submissions.length === 0 && (
            <div className="text-center py-16 bg-muted/30 rounded-3xl border border-dashed border-border">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No submissions yet. Submit your first product!</p>
            </div>
          )}

          <div className="space-y-4">
            {submissions.map((s: any) => {
              const cfg = statusConfig[s.status] || statusConfig.pending;
              return (
                <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="rounded-3xl border-border/60 hover:shadow-md transition-shadow bg-card">
                    <CardContent className="p-6">
                      <div className="flex gap-5 items-start">
                        {s.imageUrl && (
                          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted border border-border flex-shrink-0">
                            <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-lg leading-tight text-foreground">{s.name}</h3>
                            <Badge className={`${cfg.color} border-0 gap-1 rounded-full font-semibold text-xs`}>
                              {cfg.icon} {cfg.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{s.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span className="font-bold text-primary text-base">{formatCurrency(Number(s.price))}</span>
                            <span className="text-muted-foreground">Category: <strong className="text-foreground">{s.category}</strong></span>
                            <span className="text-muted-foreground">Stock: <strong className="text-foreground">{s.stock}</strong></span>
                            {s.upiId && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <QrCode className="w-3 h-3 text-primary" />
                                UPI: <strong className="text-foreground font-mono text-xs">{s.upiId}</strong>
                              </span>
                            )}
                          </div>
                          {s.adminNotes && (
                            <div className={`mt-3 p-3 rounded-xl text-sm ${s.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'}`}>
                              <strong>Admin Note:</strong> {s.adminNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
