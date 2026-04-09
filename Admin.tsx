import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Package, Users, DollarSign, ShoppingCart, CheckCircle2, XCircle, Clock, ChevronRight, Truck, MapPin, Phone, Banknote, QrCode, Lock, Eye, EyeOff, ShieldCheck, Copy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

// ── Admin Password ────────────────────────────────────────────
const DEFAULT_ADMIN_PASSWORD = "admin@sure2024";
const SESSION_KEY    = "sure_admin_auth";
const PASS_STORE_KEY = "sure_admin_password_v1";
function getAdminPassword() {
  return localStorage.getItem(PASS_STORE_KEY) || DEFAULT_ADMIN_PASSWORD;
}
// ─────────────────────────────────────────────────────────────

const ORDER_STAGES = [
  "Order Placed",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const stageColors: Record<string, string> = {
  "Order Placed":     "bg-zinc-100 text-zinc-700 border-zinc-200",
  "Confirmed":        "bg-blue-100 text-blue-700 border-blue-200",
  "Packed":           "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Shipped":          "bg-violet-100 text-violet-700 border-violet-200",
  "Out for Delivery": "bg-amber-100 text-amber-700 border-amber-200",
  "Delivered":        "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function OrderStatusController({ order, onUpdate, isPending }: {
  order: any;
  onUpdate: (id: number, status: string) => void;
  isPending: boolean;
}) {
  const currentIdx = ORDER_STAGES.indexOf(order.status);

  return (
    <div className="mt-4">
      {/* Visual stage steps */}
      <div className="flex items-center gap-0 mb-4 overflow-x-auto pb-1">
        {ORDER_STAGES.map((stage, idx) => {
          const done   = idx < currentIdx;
          const active = idx === currentIdx;
          return (
            <div key={stage} className="flex items-center shrink-0">
              <button
                onClick={() => onUpdate(order.id, stage)}
                disabled={isPending || active}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                  active  ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/30 scale-105 cursor-default" :
                  done    ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 cursor-pointer" :
                            "bg-muted text-muted-foreground border-border hover:border-primary/40 hover:text-primary cursor-pointer"
                }`}
                title={`Set to: ${stage}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                  active ? "bg-white/20" : done ? "bg-emerald-500 text-white" : "bg-border"
                }`}>
                  {done ? "✓" : idx + 1}
                </span>
                <span className="leading-tight text-center max-w-[60px]">{stage}</span>
              </button>
              {idx < ORDER_STAGES.length - 1 && (
                <ChevronRight className={`w-3 h-3 shrink-0 mx-0.5 ${idx < currentIdx ? "text-emerald-500" : "text-muted-foreground/30"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Quick next-stage button */}
      {currentIdx < ORDER_STAGES.length - 1 && (
        <Button
          size="sm"
          className="rounded-xl h-9 text-xs font-bold gap-1.5 shadow-sm shadow-primary/20"
          onClick={() => onUpdate(order.id, ORDER_STAGES[currentIdx + 1])}
          disabled={isPending}
        >
          <Truck className="w-3.5 h-3.5" />
          Move to: <span className="font-black">{ORDER_STAGES[currentIdx + 1]}</span>
        </Button>
      )}
      {currentIdx === ORDER_STAGES.length - 1 && (
        <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
          <CheckCircle2 className="w-4 h-4" />
          Order Completed
        </div>
      )}
    </div>
  );
}

const statusConfig: Record<string, { color: string; label: string }> = {
  pending:  { color: "bg-amber-100 text-amber-700",     label: "Pending Review" },
  approved: { color: "bg-emerald-100 text-emerald-700", label: "Approved" },
  rejected: { color: "bg-red-100 text-red-700",         label: "Rejected" },
};

export default function Admin() {
  const { toast } = useToast();
  const [rejectNotes, setRejectNotes] = useState<Record<number, string>>({});
  const [adminAuthed, setAdminAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [adminPass, setAdminPass]     = useState("");
  const [adminErr, setAdminErr]       = useState("");
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [shaking, setShaking]         = useState(false);

  // Admin password change
  const [newAdminPass, setNewAdminPass]   = useState("");
  const [confirmAdminPass, setConfirmAdminPass] = useState("");
  const [showNewAdminPass, setShowNewAdminPass] = useState(false);

  // Retailer password reset
  const [retailerResetId, setRetailerResetId] = useState<number | null>(null);
  const [retailerNewPass, setRetailerNewPass] = useState("");

  const { data: stats } = useQuery({ queryKey: ["/api/admin/stats"] });
  const { data: products } = useQuery({ queryKey: ["/api/products"] });
  const { data: orders } = useQuery({ queryKey: ["/api/orders"] });
  const { data: retailers = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/retailers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/retailers");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });
  const { data: submissions = [], isLoading: subsLoading } = useQuery<any[]>({
    queryKey: ["/api/submissions/all"],
    queryFn: async () => {
      const res = await fetch("/api/submissions?all=true");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const pendingCount = (submissions as any[]).filter((s: any) => s.status === 'pending').length;

  const createProductMutation = useMutation({
    mutationFn: (newProduct: any) => apiRequest("POST", "/api/products", newProduct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product created" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", buildUrl("/api/products/:id", { id })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product deleted" });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      apiRequest("PATCH", buildUrl("/api/orders/:id/status", { id }), { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order status updated" });
    },
  });

  const updateOrderPaymentMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      apiRequest("PATCH", buildUrl("/api/orders/:id/payment", { id }), { paymentStatus: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Payment approved" });
    },
  });

  const updateSubmissionMutation = useMutation({
    mutationFn: ({ id, status, adminNotes }: { id: number; status: string; adminNotes?: string }) =>
      apiRequest("PATCH", `/api/submissions/${id}/status`, { status, adminNotes }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: vars.status === 'approved' ? "Product Approved!" : "Submission Rejected",
        description: vars.status === 'approved' ? "The product is now live in the store." : "The seller has been notified.",
      });
    },
    onError: () => toast({ title: "Error", description: "Could not update submission.", variant: "destructive" }),
  });

  const resetRetailerPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: number; newPassword: string }) => {
      const res = await fetch(`/api/admin/retailers/${id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/retailers"] });
      setRetailerResetId(null);
      setRetailerNewPass("");
      toast({ title: "Retailer password reset successfully" });
    },
    onError: (e: any) => toast({ title: "Reset failed", description: e.message, variant: "destructive" }),
  });

  if (!adminAuthed) {
    const handleAdminLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (adminPass === getAdminPassword()) {
        sessionStorage.setItem(SESSION_KEY, "1");
        setAdminAuthed(true);
        setAdminErr("");
      } else {
        setAdminErr("Incorrect password. Please try again.");
        setShaking(true);
        setAdminPass("");
        setTimeout(() => setShaking(false), 600);
      }
    };
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-100 via-background to-primary/5 px-4">
        <div className={`w-full max-w-md ${shaking ? "animate-[shake_0.4s_ease]" : ""}`}>
          <div className="bg-card border border-border rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-primary to-accent-foreground p-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <ShieldCheck className="w-9 h-9 text-white" />
              </div>
              <h1 className="text-2xl font-display font-bold text-white mb-1">Admin Panel</h1>
              <p className="text-white/70 text-sm">Sure Store — Restricted Access</p>
            </div>
            <form onSubmit={handleAdminLogin} className="p-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="admin-pass" className="text-foreground font-semibold">Admin Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="admin-pass"
                    type={showAdminPass ? "text" : "password"}
                    value={adminPass}
                    onChange={e => { setAdminPass(e.target.value); setAdminErr(""); }}
                    className="h-12 pl-10 pr-11 rounded-xl bg-background text-foreground"
                    placeholder="Enter admin password"
                    autoFocus
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {adminErr && (
                  <p className="text-destructive text-sm font-medium flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> {adminErr}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/25">
                <Lock className="w-4 h-4 mr-2" />
                Access Dashboard
              </Button>
            </form>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            This area is restricted to authorised administrators only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-display font-bold mb-8 text-foreground">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats?.totalSales.toFixed(2) || "0.00"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="submissions" className="space-y-8">
          <TabsList className="bg-zinc-100 p-1 rounded-2xl border border-border flex-wrap h-auto gap-1">
            <TabsTrigger value="submissions" className="rounded-xl px-5 relative">
              Submissions
              {pendingCount > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-2 py-0.5">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="products" className="rounded-xl px-5">Products</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl px-5">Orders</TabsTrigger>
            <TabsTrigger value="retailers" className="rounded-xl px-5">
              Retailers
              {retailers.length > 0 && (
                <span className="ml-2 bg-violet-600 text-white text-[10px] font-bold rounded-full px-2 py-0.5">
                  {retailers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-xl px-5">Security</TabsTrigger>
          </TabsList>

          {/* Submissions Tab */}
          <TabsContent value="submissions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold">Seller Product Submissions</h2>
              <div className="text-sm text-muted-foreground">{pendingCount} pending review</div>
            </div>

            {subsLoading && <div className="text-center py-12 text-muted-foreground">Loading submissions...</div>}

            {!subsLoading && (submissions as any[]).length === 0 && (
              <Card className="rounded-3xl border-border/50">
                <CardContent className="py-16 text-center text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  No product submissions yet.
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {(submissions as any[]).map((sub: any) => {
                const cfg = statusConfig[sub.status] || statusConfig.pending;
                return (
                  <Card key={sub.id} className="rounded-3xl border-border/60 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex gap-5 items-start">
                        {sub.imageUrl && (
                          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-50 border border-border flex-shrink-0">
                            <img src={sub.imageUrl} alt={sub.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                            <div>
                              <h3 className="font-bold text-xl">{sub.name}</h3>
                              {sub.submitterName && (
                                <p className="text-sm text-muted-foreground">by {sub.submitterName}</p>
                              )}
                            </div>
                            <Badge className={`${cfg.color} border-0 rounded-full font-semibold`}>
                              {cfg.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{sub.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm mb-4">
                            <span className="font-bold text-primary text-base">{formatCurrency(Number(sub.price))}</span>
                            <span className="text-muted-foreground">Category: <strong>{sub.category}</strong></span>
                            <span className="text-muted-foreground">Stock: <strong>{sub.stock}</strong></span>
                            <span className="text-muted-foreground">Submitted: {new Date(sub.createdAt).toLocaleDateString()}</span>
                          </div>

                          {sub.adminNotes && (
                            <div className="mb-4 p-3 rounded-xl bg-zinc-50 text-sm text-muted-foreground border border-border/50">
                              <strong>Admin Note:</strong> {sub.adminNotes}
                            </div>
                          )}

                          {sub.status === 'pending' && (
                            <div className="flex flex-col sm:flex-row gap-3">
                              <Button
                                size="sm"
                                className="rounded-xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                                onClick={() => updateSubmissionMutation.mutate({ id: sub.id, status: 'approved', adminNotes: "Approved by admin." })}
                                disabled={updateSubmissionMutation.isPending}
                              >
                                <CheckCircle2 className="w-4 h-4" /> Approve & Add to Store
                              </Button>
                              <div className="flex gap-2 flex-1">
                                <Input
                                  placeholder="Rejection reason (optional)..."
                                  className="rounded-xl h-9 text-sm"
                                  value={rejectNotes[sub.id] || ""}
                                  onChange={e => setRejectNotes(p => ({ ...p, [sub.id]: e.target.value }))}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl gap-2 border-destructive/30 text-destructive hover:bg-destructive/5 flex-shrink-0"
                                  onClick={() => updateSubmissionMutation.mutate({ id: sub.id, status: 'rejected', adminNotes: rejectNotes[sub.id] || "Rejected by admin." })}
                                  disabled={updateSubmissionMutation.isPending}
                                >
                                  <XCircle className="w-4 h-4" /> Reject
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-8">
            <Card className="rounded-3xl border border-border/50">
              <CardHeader>
                <CardTitle>Add New Product</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  createProductMutation.mutate({
                    name: formData.get("name"),
                    description: formData.get("description"),
                    price: formData.get("price"),
                    category: formData.get("category"),
                    imageUrl: formData.get("imageUrl"),
                    stock: parseInt(formData.get("stock") as string),
                    isFeatured: formData.get("isFeatured") === "on",
                  });
                  (e.currentTarget as HTMLFormElement).reset();
                }}>
                  <div className="space-y-2">
                    <Label>Product Name</Label>
                    <Input name="name" required placeholder="Luxury Watch" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select 
                      name="category" 
                      required 
                      className="w-full h-10 px-3 py-2 rounded-xl border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Grocery">Grocery</option>
                      <option value="Home & Kitchen">Home & Kitchen</option>
                      <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                      <option value="Sports & Fitness">Sports & Fitness</option>
                      <option value="Books">Books</option>
                      <option value="Toys">Toys</option>
                      <option value="Automotive">Automotive</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Health Products">Health Products</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Price (₹)</Label>
                    <Input name="price" type="number" step="0.01" required placeholder="299.99" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input name="imageUrl" required placeholder="https://..." className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock</Label>
                    <Input name="stock" type="number" required placeholder="10" className="rounded-xl" />
                  </div>
                  <div className="space-y-2 flex items-center gap-2 pt-8">
                    <input type="checkbox" name="isFeatured" id="isFeatured" />
                    <Label htmlFor="isFeatured">Featured Product</Label>
                  </div>
                  <div className="md:col-span-2 lg:col-span-3 space-y-2">
                    <Label>Description</Label>
                    <Input name="description" required placeholder="High quality luxury item..." className="rounded-xl" />
                  </div>
                  <Button type="submit" className="md:col-span-1 rounded-xl h-12 shadow-lg shadow-primary/20" disabled={createProductMutation.isPending}>
                    <Plus className="w-4 h-4 mr-2" /> {createProductMutation.isPending ? "Creating..." : "Create Product"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(products as any[])?.map((product: any) => (
                <Card key={product.id} className="rounded-3xl border border-border/50 overflow-hidden group">
                  <div className="aspect-square relative overflow-hidden">
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <Button variant="ghost" size="icon" onClick={() => deleteProductMutation.mutate(product.id)} className="text-destructive hover:bg-destructive/10 rounded-xl">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 truncate">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-primary">{formatCurrency(Number(product.price))}</span>
                      <span className="text-xs font-bold uppercase px-3 py-1 bg-zinc-100 rounded-full">{product.category}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-display font-bold text-foreground">Manage Orders</h2>
              <div className="text-sm text-muted-foreground">{(orders as any[])?.length || 0} total orders</div>
            </div>

            {!(orders as any[])?.length && (
              <Card className="rounded-3xl border-border/50">
                <CardContent className="py-16 text-center text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  No orders yet.
                </CardContent>
              </Card>
            )}

            {(orders as any[])?.map((order: any) => {
              const isCOD = order.paymentMethod === "COD";
              const stageColor = stageColors[order.status] || stageColors["Order Placed"];

              return (
                <Card key={order.id} className={`rounded-3xl border overflow-hidden ${isCOD ? "border-amber-200/60" : "border-violet-200/60"}`}>
                  <div className={`px-6 py-3 flex flex-wrap items-center justify-between gap-3 border-b ${isCOD ? "bg-amber-50/60 dark:bg-amber-900/10 border-amber-100" : "bg-violet-50/60 dark:bg-violet-900/10 border-violet-100"}`}>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-primary text-lg">
                        #ORD-{order.id.toString().padStart(6, '0')}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${stageColor}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Payment badge */}
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                        isCOD ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-violet-100 text-violet-700 border-violet-200"
                      }`}>
                        {isCOD ? <Banknote className="w-3.5 h-3.5" /> : <QrCode className="w-3.5 h-3.5" />}
                        {order.paymentMethod}
                        <span className={`ml-1 ${order.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                          • {order.paymentStatus === "paid" ? "PAID" : "PENDING"}
                        </span>
                      </div>

                      <span className="font-display font-bold text-lg text-foreground">
                        {formatCurrency(Number(order.totalAmount))}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    {/* Customer info */}
                    <div className="flex flex-wrap gap-5 text-sm mb-5">
                      {order.phone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="w-4 h-4 text-primary" />
                          <span className="font-medium text-foreground">{order.phone}</span>
                        </div>
                      )}
                      {order.address && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="font-medium text-foreground truncate max-w-xs">{order.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    {/* UPI payment approval */}
                    {!isCOD && order.paymentStatus === "pending" && (
                      <div className="mb-4 p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 rounded-2xl flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-violet-700 dark:text-violet-300">UPI Payment Verification</p>
                          <p className="text-xs text-muted-foreground">Confirm that payment was received before proceeding.</p>
                        </div>
                        <Button
                          size="sm"
                          className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white gap-2 shrink-0"
                          onClick={() => updateOrderPaymentMutation.mutate({ id: order.id, status: "paid" })}
                          disabled={updateOrderPaymentMutation.isPending}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark as Paid
                        </Button>
                      </div>
                    )}

                    {/* Status controller */}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                        {isCOD ? "COD Order — " : "UPI Order — "}Update Delivery Stage
                      </p>
                      <OrderStatusController
                        order={order}
                        onUpdate={(id, status) => updateOrderStatusMutation.mutate({ id, status })}
                        isPending={updateOrderStatusMutation.isPending}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Retailers Tab */}
          <TabsContent value="retailers" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Registered Retailers</h2>
              <a
                href="/retailer-login"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:underline"
              >
                Open Retailer Panel ↗
              </a>
            </div>
            {retailers.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No retailers registered yet.</p>
                <p className="text-sm mt-1">Retailers sign up via the Retailer Portal link below.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {retailers.map((r: any) => (
                  <Card key={r.id} className="rounded-2xl border border-border" data-testid={`card-retailer-${r.id}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-2">
                            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center text-violet-700 font-black text-sm">
                              {r.storeName?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-foreground">{r.storeName}</div>
                              <div className="text-sm text-muted-foreground">{r.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground mt-2">
                            <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 rounded-lg px-3 py-1">
                              <span className="text-violet-500 text-xs font-medium">ID</span>
                              <span className="font-mono font-bold text-violet-700">#{r.id}</span>
                              <button
                                onClick={() => { navigator.clipboard.writeText(String(r.id)); toast({ title: "Retailer ID copied!" }); }}
                                className="text-violet-400 hover:text-violet-700 ml-1"
                                data-testid={`button-copy-retailer-id-${r.id}`}
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            {r.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{r.phone}</div>}
                            {r.upiId && <div className="flex items-center gap-1"><QrCode className="w-3 h-3" />{r.upiId}</div>}
                            <span className="text-xs">{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {retailerResetId === r.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="password"
                                placeholder="New password (min 6)"
                                value={retailerNewPass}
                                onChange={e => setRetailerNewPass(e.target.value)}
                                className="h-9 rounded-xl w-40 text-sm"
                                data-testid={`input-retailer-newpass-${r.id}`}
                              />
                              <Button
                                size="sm"
                                className="rounded-xl h-9 bg-violet-600 hover:bg-violet-700 text-white"
                                onClick={() => { if (retailerNewPass.length < 6) { toast({ title: "Min 6 chars", variant: "destructive" }); return; } resetRetailerPasswordMutation.mutate({ id: r.id, newPassword: retailerNewPass }); }}
                                disabled={resetRetailerPasswordMutation.isPending}
                                data-testid={`button-confirm-reset-${r.id}`}
                              >
                                {resetRetailerPasswordMutation.isPending ? "…" : "Set"}
                              </Button>
                              <Button size="sm" variant="outline" className="rounded-xl h-9" onClick={() => { setRetailerResetId(null); setRetailerNewPass(""); }}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl h-9 border-amber-200 text-amber-700 hover:bg-amber-50"
                              onClick={() => { setRetailerResetId(r.id); setRetailerNewPass(""); }}
                              data-testid={`button-reset-retailer-${r.id}`}
                            >
                              <Lock className="w-3.5 h-3.5 mr-1.5" /> Reset Password
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Security Settings</h2>
            <div className="max-w-md space-y-6">

              {/* Change Admin Password */}
              <Card className="rounded-2xl border border-border">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" /> Change Admin Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                    Current password: <span className="font-mono font-bold">{getAdminPassword()}</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-admin-pass">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="new-admin-pass"
                        type={showNewAdminPass ? "text" : "password"}
                        value={newAdminPass}
                        onChange={e => setNewAdminPass(e.target.value)}
                        className="pl-10 pr-11 rounded-xl h-11"
                        placeholder="Min. 6 characters"
                        data-testid="input-new-admin-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewAdminPass(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-admin-pass">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirm-admin-pass"
                        type="password"
                        value={confirmAdminPass}
                        onChange={e => setConfirmAdminPass(e.target.value)}
                        className="pl-10 rounded-xl h-11"
                        placeholder="Re-enter new password"
                        data-testid="input-confirm-admin-password"
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full rounded-xl h-11 font-bold shadow-sm shadow-primary/20"
                    onClick={() => {
                      if (newAdminPass.length < 6) { toast({ title: "Password too short", description: "Minimum 6 characters required.", variant: "destructive" }); return; }
                      if (newAdminPass !== confirmAdminPass) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
                      localStorage.setItem(PASS_STORE_KEY, newAdminPass);
                      sessionStorage.removeItem(SESSION_KEY);
                      setNewAdminPass("");
                      setConfirmAdminPass("");
                      toast({ title: "Admin password updated!", description: "You will be asked to log in again on next visit." });
                    }}
                    data-testid="button-save-admin-password"
                  >
                    <Lock className="w-4 h-4 mr-2" /> Save New Password
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      localStorage.removeItem(PASS_STORE_KEY);
                      toast({ title: "Password reset to default", description: `Default: ${DEFAULT_ADMIN_PASSWORD}` });
                    }}
                    data-testid="button-reset-admin-password"
                  >
                    Reset to Default Password
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-border">
                <CardHeader>
                  <CardTitle className="text-base">Retailer Portal</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Share this link with your retailers so they can sign up and manage their products.</p>
                  <div className="flex items-center gap-2 bg-zinc-50 border border-border rounded-xl px-4 py-3">
                    <span className="text-sm font-mono text-foreground flex-1 truncate">{window.location.origin}/retailer-login</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/retailer-login`); toast({ title: "Link copied!" }); }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="button-copy-retailer-link"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <a href="/retailer-login" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-violet-600 hover:underline">
                    Open Retailer Portal ↗
                  </a>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </Layout>
  );
}
