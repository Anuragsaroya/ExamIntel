import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "We sent you a password reset link." });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (mode === "signup" && !name.trim()) {
      toast({ title: "Name required", description: "Please enter your name.", variant: "destructive" });
      return;
    }
    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
      } else {
        const { data: { user: loggedInUser } } = await supabase.auth.getUser();
        if (loggedInUser) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", loggedInUser.id)
            .eq("role", "admin")
            .maybeSingle();
          if (roleData) {
            toast({ title: "Welcome back, Admin!" });
            navigate("/admin");
          } else {
            toast({ title: "Welcome back!" });
            navigate("/dashboard");
          }
        } else {
          navigate("/dashboard");
        }
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").update({ name: name.trim() }).eq("user_id", user.id);
        }
        toast({ title: "Account created!", description: "Welcome! Redirecting to dashboard..." });
        navigate("/dashboard");
      }
    }
    setLoading(false);
  };

  const inputClass = "w-full pl-10 pr-4 py-3 rounded-lg bg-secondary text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 border border-border transition-all font-mono text-foreground";

  return (
    <div className="min-h-screen bg-background grid-pattern noise-overlay relative flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10 justify-center">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center border border-primary/30"
            style={{ background: "linear-gradient(135deg, hsl(38, 92%, 55%), hsl(38, 80%, 40%))" }}
          >
            <Zap className="w-5 h-5 text-background" />
          </div>
          <span className="font-display text-2xl tracking-widest text-foreground">EXAMINTEL <span className="text-primary">AI</span></span>
        </div>

        {/* Card */}
        <div className="glass-card p-8 rounded-2xl">
          <h2 className="font-display text-3xl text-foreground mb-1 text-center tracking-wider">
            {mode === "login" ? "WELCOME BACK" : mode === "signup" ? "CREATE ACCOUNT" : "RESET PASSWORD"}
          </h2>
          <p className="text-sm text-muted-foreground mb-8 text-center font-mono">
            {mode === "login" ? "Sign in to access your dashboard" : mode === "signup" ? "Start tracking exams smartly" : "Enter your email to receive a reset link"}
          </p>

          {mode === "forgot" ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className={inputClass} />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full rounded-lg h-12 text-sm font-mono font-bold uppercase tracking-wider mt-2" size="lg">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Send Reset Link
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
              <p className="text-center text-sm text-muted-foreground mt-4 font-mono">
                <button onClick={() => setMode("login")} className="text-accent font-bold hover:underline">
                  ← Back to Sign In
                </button>
              </p>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div>
                    <label className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required className={inputClass} />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className={inputClass} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">Password</label>
                    {mode === "login" && (
                      <button type="button" onClick={() => setMode("forgot")} className="text-xs text-accent hover:underline font-mono font-bold">
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      required
                      minLength={6}
                      className={`${inputClass} pr-12`}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full rounded-lg h-12 text-sm font-mono font-bold uppercase tracking-wider mt-2" size="lg">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {mode === "login" ? "Sign In" : "Create Account"}
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6 font-mono">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-accent font-bold hover:underline">
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono">← Back to home</Link>
        </div>
      </motion.div>
    </div>
  );
}
