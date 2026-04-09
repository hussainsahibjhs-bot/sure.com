import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Store, Lock, Mail, User, Phone, Eye, EyeOff, KeyRound, ArrowLeft } from "lucide-react";

type Tab = "login" | "register" | "reset";

export default function RetailerLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ storeName: "", email: "", password: "", confirmPassword: "", phone: "", upiId: "" });
  const [resetForm, setResetForm] = useState({ email: "", newPassword: "", confirmPassword: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/retailer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: "Welcome back!", description: `Logged in as ${data.storeName}` });
      setLocation("/retailer-panel");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regForm.password !== regForm.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/retailer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: regForm.storeName,
          email: regForm.email,
          password: regForm.password,
          phone: regForm.phone || undefined,
          upiId: regForm.upiId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: "Account created!", description: "Welcome to Sure Store Retailer Panel" });
      setLocation("/retailer-panel");
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/retailer/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetForm.email, newPassword: resetForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast({ title: "Password reset!", description: "You can now log in with your new password." });
      setResetForm({ email: "", newPassword: "", confirmPassword: "" });
      setTab("login");
    } catch (err: any) {
      toast({ title: "Reset failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-background to-primary/5 px-4 py-12">
      <div className="w-full max-w-md">

        {/* Back to store */}
        <button
          onClick={() => setLocation("/")}
          className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </button>

        <div className="bg-card border border-border rounded-[2rem] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-violet-600 to-indigo-600 p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Store className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Retailer Portal</h1>
            <p className="text-white/70 text-sm">Sure Store — Seller Access</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-border">
            {(["login", "register", "reset"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  tab === t
                    ? "border-b-2 border-violet-600 text-violet-700 dark:text-violet-400 bg-violet-50/50 dark:bg-violet-900/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "login" ? "Log In" : t === "register" ? "Sign Up" : "Reset Password"}
              </button>
            ))}
          </div>

          {/* Login Form */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="p-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="l-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="l-email"
                    type="email"
                    value={loginForm.email}
                    onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                    className="pl-10 h-11 rounded-xl"
                    placeholder="store@example.com"
                    required
                    data-testid="input-retailer-email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="l-pass">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="l-pass"
                    type={showPass ? "text" : "password"}
                    value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    className="pl-10 pr-11 h-11 rounded-xl"
                    placeholder="Enter your password"
                    required
                    data-testid="input-retailer-password"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl font-bold bg-violet-600 hover:bg-violet-700 text-white" data-testid="button-retailer-login">
                {loading ? "Signing in…" : "Sign In"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Forgot password?{" "}
                <button type="button" onClick={() => setTab("reset")} className="text-violet-600 font-semibold hover:underline">
                  Reset it
                </button>
              </p>
            </form>
          )}

          {/* Register Form */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="p-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="r-store">Store / Brand Name</Label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="r-store"
                    value={regForm.storeName}
                    onChange={e => setRegForm(f => ({ ...f, storeName: e.target.value }))}
                    className="pl-10 h-11 rounded-xl"
                    placeholder="My Awesome Store"
                    required
                    data-testid="input-retailer-storename"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="r-email"
                    type="email"
                    value={regForm.email}
                    onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                    className="pl-10 h-11 rounded-xl"
                    placeholder="store@example.com"
                    required
                    data-testid="input-retailer-reg-email"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="r-phone">Phone (optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="r-phone" value={regForm.phone} onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} className="pl-10 h-11 rounded-xl" placeholder="9876543210" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-upi">UPI ID (optional)</Label>
                  <Input id="r-upi" value={regForm.upiId} onChange={e => setRegForm(f => ({ ...f, upiId: e.target.value }))} className="h-11 rounded-xl" placeholder="store@upi" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-pass">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="r-pass"
                    type={showPass ? "text" : "password"}
                    value={regForm.password}
                    onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                    className="pl-10 pr-11 h-11 rounded-xl"
                    placeholder="Min. 6 characters"
                    required
                    data-testid="input-retailer-reg-password"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-confirm">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="r-confirm"
                    type="password"
                    value={regForm.confirmPassword}
                    onChange={e => setRegForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    className="pl-10 h-11 rounded-xl"
                    placeholder="Re-enter password"
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl font-bold bg-violet-600 hover:bg-violet-700 text-white" data-testid="button-retailer-register">
                {loading ? "Creating account…" : "Create Retailer Account"}
              </Button>
            </form>
          )}

          {/* Reset Password Form */}
          {tab === "reset" && (
            <form onSubmit={handleReset} className="p-8 space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                Enter your registered email and a new password to reset your access.
              </div>
              <div className="space-y-2">
                <Label htmlFor="rst-email">Registered Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="rst-email"
                    type="email"
                    value={resetForm.email}
                    onChange={e => setResetForm(f => ({ ...f, email: e.target.value }))}
                    className="pl-10 h-11 rounded-xl"
                    placeholder="store@example.com"
                    required
                    data-testid="input-reset-email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rst-pass">New Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="rst-pass"
                    type={showPass ? "text" : "password"}
                    value={resetForm.newPassword}
                    onChange={e => setResetForm(f => ({ ...f, newPassword: e.target.value }))}
                    className="pl-10 pr-11 h-11 rounded-xl"
                    placeholder="Min. 6 characters"
                    required
                    data-testid="input-reset-newpassword"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rst-confirm">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="rst-confirm"
                    type="password"
                    value={resetForm.confirmPassword}
                    onChange={e => setResetForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    className="pl-10 h-11 rounded-xl"
                    placeholder="Re-enter new password"
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl font-bold bg-violet-600 hover:bg-violet-700 text-white" data-testid="button-reset-submit">
                {loading ? "Resetting…" : "Reset Password"}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Retailer accounts are for approved Sure Store sellers only.
        </p>
      </div>
    </div>
  );
}
