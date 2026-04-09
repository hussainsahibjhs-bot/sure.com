import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Store, Package, ShoppingBag, ClipboardList, Settings, LogOut,
  Edit3, Trash2, Plus, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp,
  Copy, Phone, MapPin, CreditCard, TrendingUp, Eye, EyeOff
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const CATEGORIES = [
  "Electronics", "Fashion", "Grocery", "Beauty & Personal Care",
  "Home & Kitchen", "Furniture", "Sports & Fitness", "Books",
  "Toys", "Automotive", "Health Products", "Footwear", "Accessories", "Other"
];

const statusBadge: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const ORDER_STAGES = ["Order Placed","Confirmed","Packed","Shipped","Out for Delivery","Delivered"];

export default function RetailerPanel() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: me, isLoading: meLoading, error: meError } = useQuery<any>({
    queryKey: ["/api/retailer/me"],
    queryFn: async () => {
      const res = await fetch("/api/retailer/me");
      if (!res.ok) throw new Error("Not authenticated");
      return res.json();
    },
    retry: false,
  });

  const { data: myProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/retailer/products"],
    queryFn: async () => {
      const res = await fetch("/api/retailer/products");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!me,
  });

  const { data: submissions = [] } = useQuery<any[]>({
    queryKey: ["/api/retailer/submissions"],
    queryFn: async () => {
      const res = await fetch("/api/retailer/submissions");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!me,
  });

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["/api/retailer/orders"],
    queryFn: async () => {
      const res = await fetch("/api/retailer/orders");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!me,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/retailer/logout", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/retailer-login");
    },
  });

  // Product edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/retailer/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/retailer/products"] });
      setEditingId(null);
      toast({ title: "Product updated" });
    },
    onError: (e: any) => toast({ title: "Failed to update", description: e.message, variant: "destructive" }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/retailer/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/retailer/products"] });
      toast({ title: "Product removed from store" });
    },
  });

  // Submit new product
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [subForm, setSubForm] = useState({ name: "", description: "", price: "", imageUrl: "", category: "", stock: "1", upiId: "" });

  const submitMutation = useMutation({
    mutationFn: async (data: typeof subForm) => {
      const res = await fetch("/api/retailer/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, price: data.price, stock: Number(data.stock) }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/retailer/submissions"] });
      setShowSubmitForm(false);
      setSubForm({ name: "", description: "", price: "", imageUrl: "", category: "", stock: "1", upiId: "" });
      toast({ title: "Product submitted!", description: "Awaiting admin approval." });
    },
    onError: (e: any) => toast({ title: "Submission failed", description: e.message, variant: "destructive" }),
  });

  // Profile update
  const [profileForm, setProfileForm] = useState<any>(null);
  const [showPassChange, setShowPassChange] = useState(false);
  const [passForm, setPassForm] = useState({ email: "", newPassword: "", confirm: "" });
  const [showNewPass, setShowNewPass] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/retailer/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/retailer/me"] });
      toast({ title: "Profile updated" });
    },
    onError: (e: any) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const resetPassMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/retailer/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: passForm.email, newPassword: passForm.newPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password changed successfully!" });
      setPassForm({ email: "", newPassword: "", confirm: "" });
      setShowPassChange(false);
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  // Redirect if not logged in
  if (!meLoading && meError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-background px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-violet-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-violet-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-foreground">Retailer Portal</h2>
          <p className="text-muted-foreground mb-6">Sign in to manage your store on Sure Store marketplace.</p>
          <Button onClick={() => setLocation("/retailer-login")} className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-11 font-bold px-8" data-testid="button-go-to-login">
            Sign In / Register
          </Button>
        </div>
      </div>
    );
  }

  if (meLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-violet-600 border-t-transparent" />
        </div>
      </Layout>
    );
  }

  const totalRevenue = orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
              <Store className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{me?.storeName}</h1>
              <p className="text-sm text-muted-foreground">{me?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-2 flex items-center gap-2">
              <span className="text-xs text-violet-500 font-medium">Retailer ID</span>
              <span className="font-mono font-bold text-violet-700">#{me?.id}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(String(me?.id)); toast({ title: "Retailer ID copied!" }); }}
                className="text-violet-400 hover:text-violet-700 transition-colors"
                data-testid="button-copy-retailer-id"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
              data-testid="button-retailer-logout"
            >
              <LogOut className="w-4 h-4 mr-1.5" /> Logout
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Live Products", value: myProducts.length, icon: Package, color: "text-violet-600 bg-violet-50" },
            { label: "Pending Approval", value: submissions.filter((s: any) => s.status === "pending").length, icon: Clock, color: "text-amber-600 bg-amber-50" },
            { label: "Total Orders", value: orders.length, icon: ShoppingBag, color: "text-blue-600 bg-blue-50" },
            { label: "Revenue", value: formatCurrency(totalRevenue), icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
          ].map(s => (
            <Card key={s.label} className="rounded-2xl border border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-zinc-100 p-1 rounded-2xl border border-border">
            <TabsTrigger value="products" className="rounded-xl px-5">
              <Package className="w-4 h-4 mr-2" /> Products
            </TabsTrigger>
            <TabsTrigger value="submissions" className="rounded-xl px-5">
              <ClipboardList className="w-4 h-4 mr-2" /> Submissions
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl px-5">
              <ShoppingBag className="w-4 h-4 mr-2" /> Orders
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-xl px-5">
              <Settings className="w-4 h-4 mr-2" /> Profile
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            {myProducts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No approved products yet.</p>
                <p className="text-sm mt-1">Submit a product from the Submissions tab — once approved, it appears here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myProducts.map((p: any) => (
                  <Card key={p.id} className="rounded-2xl border border-border overflow-hidden" data-testid={`card-product-${p.id}`}>
                    {editingId === p.id ? (
                      <CardContent className="p-6 space-y-4">
                        <h3 className="font-bold text-base mb-4">Edit Product</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Product Name</Label>
                            <Input value={editForm.name} onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))} className="rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <Label>Price (₹)</Label>
                            <Input type="number" value={editForm.price} onChange={e => setEditForm((f: any) => ({ ...f, price: e.target.value }))} className="rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <Label>Category</Label>
                            <select value={editForm.category} onChange={e => setEditForm((f: any) => ({ ...f, category: e.target.value }))} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Stock Quantity</Label>
                            <Input type="number" value={editForm.stock} onChange={e => setEditForm((f: any) => ({ ...f, stock: e.target.value }))} className="rounded-xl" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Image URL</Label>
                          <Input value={editForm.imageUrl} onChange={e => setEditForm((f: any) => ({ ...f, imageUrl: e.target.value }))} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea value={editForm.description} onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))} className="rounded-xl min-h-20" />
                        </div>
                        <div className="flex gap-3">
                          <Button onClick={() => updateProductMutation.mutate({ id: p.id, data: editForm })} disabled={updateProductMutation.isPending} className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white">
                            {updateProductMutation.isPending ? "Saving…" : "Save Changes"}
                          </Button>
                          <Button variant="outline" onClick={() => setEditingId(null)} className="rounded-xl">Cancel</Button>
                        </div>
                      </CardContent>
                    ) : (
                      <CardContent className="p-4 flex items-center gap-4">
                        <img src={p.imageUrl} alt={p.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0 bg-zinc-100" onError={e => { (e.target as any).src = "https://placehold.co/64x64?text=No+Image"; }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-foreground truncate">{p.name}</span>
                            <Badge variant="outline" className="text-xs">{p.category}</Badge>
                            {p.isFeatured && <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">Featured</Badge>}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{formatCurrency(Number(p.price))}</span>
                            <span>Stock: {p.stock}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => { setEditingId(p.id); setEditForm({ name: p.name, description: p.description, price: p.price, imageUrl: p.imageUrl || "", category: p.category, stock: p.stock }); }} data-testid={`button-edit-product-${p.id}`}>
                            <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50" onClick={() => { if (confirm("Remove this product from the store?")) deleteProductMutation.mutate(p.id); }} data-testid={`button-delete-product-${p.id}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <div className="mb-4">
              <Button onClick={() => setShowSubmitForm(v => !v)} className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white gap-2" data-testid="button-toggle-submit-form">
                <Plus className="w-4 h-4" />
                {showSubmitForm ? "Close Form" : "Submit New Product"}
                {showSubmitForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>

            {showSubmitForm && (
              <Card className="rounded-2xl border border-violet-200 mb-6">
                <CardHeader>
                  <CardTitle className="text-base">New Product Submission</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Product Name *</Label>
                      <Input value={subForm.name} onChange={e => setSubForm(f => ({ ...f, name: e.target.value }))} className="rounded-xl" placeholder="e.g. Premium Bluetooth Speaker" />
                    </div>
                    <div className="space-y-2">
                      <Label>Price (₹) *</Label>
                      <Input type="number" value={subForm.price} onChange={e => setSubForm(f => ({ ...f, price: e.target.value }))} className="rounded-xl" placeholder="499" />
                    </div>
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <select value={subForm.category} onChange={e => setSubForm(f => ({ ...f, category: e.target.value }))} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
                        <option value="">Select category</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Stock Quantity</Label>
                      <Input type="number" value={subForm.stock} onChange={e => setSubForm(f => ({ ...f, stock: e.target.value }))} className="rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input value={subForm.imageUrl} onChange={e => setSubForm(f => ({ ...f, imageUrl: e.target.value }))} className="rounded-xl" placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label>UPI ID (for direct payment)</Label>
                    <Input value={subForm.upiId} onChange={e => setSubForm(f => ({ ...f, upiId: e.target.value }))} className="rounded-xl" placeholder={me?.upiId || "yourname@upi (optional)"} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea value={subForm.description} onChange={e => setSubForm(f => ({ ...f, description: e.target.value }))} className="rounded-xl min-h-24" placeholder="Describe your product..." />
                  </div>
                  <Button onClick={() => submitMutation.mutate(subForm)} disabled={submitMutation.isPending} className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white" data-testid="button-submit-product">
                    {submitMutation.isPending ? "Submitting…" : "Submit for Approval"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {submissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No submissions yet. Click "Submit New Product" to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((s: any) => (
                  <Card key={s.id} className="rounded-2xl border border-border" data-testid={`card-submission-${s.id}`}>
                    <CardContent className="p-4 flex items-start gap-4">
                      {s.imageUrl && <img src={s.imageUrl} alt={s.name} className="w-14 h-14 object-cover rounded-xl flex-shrink-0 bg-zinc-100" onError={e => { (e.target as any).src = "https://placehold.co/56x56?text=?"; }} />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground">{s.name}</span>
                          <Badge className={`text-xs border ${statusBadge[s.status] || ""}`}>
                            {s.status === "pending" ? <><Clock className="w-3 h-3 mr-1" />Under Review</> : s.status === "approved" ? <><CheckCircle2 className="w-3 h-3 mr-1" />Approved</> : <><XCircle className="w-3 h-3 mr-1" />Rejected</>}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">{s.category} · {formatCurrency(Number(s.price))} · Stock: {s.stock}</div>
                        {s.adminNotes && (
                          <div className="mt-2 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-800">
                            <strong>Admin note:</strong> {s.adminNotes}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex-shrink-0">
                        {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            {orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No orders for your products yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((o: any) => {
                  const myItems = o.items?.filter((i: any) => myProducts.some((p: any) => p.id === i.productId));
                  const stageIdx = ORDER_STAGES.indexOf(o.status);
                  return (
                    <Card key={o.id} className="rounded-2xl border border-border" data-testid={`card-order-${o.id}`}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                          <div>
                            <span className="font-bold text-foreground">Order #{o.id.toString().padStart(6, "0")}</span>
                            <span className="ml-3 text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleDateString("en-IN")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs border ${o.paymentMethod === "UPI" ? "bg-violet-100 text-violet-700 border-violet-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>{o.paymentMethod}</Badge>
                            <Badge className="text-xs border bg-blue-100 text-blue-700 border-blue-200">{o.status}</Badge>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
                          {ORDER_STAGES.map((stage, i) => (
                            <div key={stage} className="flex items-center shrink-0">
                              <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${i < stageIdx ? "bg-emerald-500 text-white" : i === stageIdx ? "bg-violet-600 text-white" : "bg-zinc-200 text-zinc-500"}`}>
                                {i + 1}
                              </div>
                              {i < ORDER_STAGES.length - 1 && <div className={`h-0.5 w-4 ${i < stageIdx ? "bg-emerald-400" : "bg-zinc-200"}`} />}
                            </div>
                          ))}
                        </div>

                        {(myItems || o.items)?.slice(0, 3).map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3 py-2 border-t border-border first:border-t-0">
                            <img src={item.product?.imageUrl} alt={item.product?.name} className="w-10 h-10 object-cover rounded-lg bg-zinc-100 flex-shrink-0" onError={e => { (e.target as any).src = "https://placehold.co/40x40?text=?"; }} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{item.product?.name}</div>
                              <div className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatCurrency(Number(item.price))}</div>
                            </div>
                          </div>
                        ))}

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {o.phone && <><Phone className="w-3 h-3" />{o.phone}</>}
                          </div>
                          <span className="font-bold text-foreground">{formatCurrency(Number(o.totalAmount))}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="max-w-xl space-y-6">
              {/* Store Info */}
              <Card className="rounded-2xl border border-border">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Store className="w-4 h-4 text-violet-600" /> Store Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Store Name</Label>
                    <Input
                      value={profileForm?.storeName ?? (me?.storeName || "")}
                      onChange={e => setProfileForm((f: any) => ({ ...(f || me), storeName: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={profileForm?.phone ?? (me?.phone || "")}
                        onChange={e => setProfileForm((f: any) => ({ ...(f || me), phone: e.target.value }))}
                        className="pl-10 rounded-xl"
                        placeholder="9876543210"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>UPI ID</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={profileForm?.upiId ?? (me?.upiId || "")}
                        onChange={e => setProfileForm((f: any) => ({ ...(f || me), upiId: e.target.value }))}
                        className="pl-10 rounded-xl"
                        placeholder="yourname@upi"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => updateProfileMutation.mutate(profileForm || me)}
                    disabled={updateProfileMutation.isPending || !profileForm}
                    className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white"
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? "Saving…" : "Save Profile"}
                  </Button>
                </CardContent>
              </Card>

              {/* Retailer ID Card */}
              <Card className="rounded-2xl border border-violet-200 bg-violet-50/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-violet-600 uppercase tracking-wider mb-1">Your Retailer ID</div>
                      <div className="font-mono text-3xl font-black text-violet-700">#{me?.id}</div>
                      <div className="text-xs text-violet-500 mt-1">Share this ID with Sure Store admin</div>
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(String(me?.id)); toast({ title: "Retailer ID copied!" }); }}
                      className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-violet-200 hover:bg-violet-50 transition-colors"
                      data-testid="button-copy-id-profile"
                    >
                      <Copy className="w-5 h-5 text-violet-600" />
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Change Password */}
              <Card className="rounded-2xl border border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Eye className="w-4 h-4" /> Change Password
                    </CardTitle>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowPassChange(v => !v)}>
                      {showPassChange ? "Cancel" : "Change"}
                    </Button>
                  </div>
                </CardHeader>
                {showPassChange && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="space-y-2">
                      <Label>Confirm Your Email</Label>
                      <Input value={passForm.email} onChange={e => setPassForm(f => ({ ...f, email: e.target.value }))} className="rounded-xl" placeholder={me?.email} />
                    </div>
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <div className="relative">
                        <Input type={showNewPass ? "text" : "password"} value={passForm.newPassword} onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))} className="pr-11 rounded-xl" placeholder="Min. 6 characters" />
                        <button type="button" onClick={() => setShowNewPass(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm New Password</Label>
                      <Input type="password" value={passForm.confirm} onChange={e => setPassForm(f => ({ ...f, confirm: e.target.value }))} className="rounded-xl" placeholder="Re-enter new password" />
                    </div>
                    <Button
                      onClick={() => {
                        if (passForm.newPassword !== passForm.confirm) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
                        resetPassMutation.mutate();
                      }}
                      disabled={resetPassMutation.isPending}
                      className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white"
                      data-testid="button-change-password"
                    >
                      {resetPassMutation.isPending ? "Updating…" : "Update Password"}
                    </Button>
                  </CardContent>
                )}
              </Card>

              {/* Logout */}
              <Button
                variant="outline"
                className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50 h-11"
                onClick={() => logoutMutation.mutate()}
                data-testid="button-logout-profile"
              >
                <LogOut className="w-4 h-4 mr-2" /> Sign Out of Retailer Panel
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
