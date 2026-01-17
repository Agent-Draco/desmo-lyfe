import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from "lucide-react";
import { z } from "zod";
const emailSchema = z.string().email("Please enter a valid email");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    displayName?: string;
  }>({});
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  useEffect(() => {
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/", {
          replace: true
        });
      }
    });
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      if (session) {
        navigate("/", {
          replace: true
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("vigil_remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);
  const validate = () => {
    const newErrors: typeof errors = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    if (!isLogin && !displayName.trim()) {
      newErrors.displayName = "Please enter your name";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (isLogin) {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        if (rememberMe) {
          localStorage.setItem("vigil_remember_email", email);
        } else {
          localStorage.removeItem("vigil_remember_email");
        }
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const {
          error
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              display_name: displayName
            }
          }
        });
        if (error) throw error;
        toast({
          title: "Account created!",
          description: "Welcome to Desmo. Let's set up your kitchen."
        });
      }
    } catch (error: any) {
      let message = error.message;
      if (error.message.includes("User already registered")) {
        message = "An account with this email already exists. Please sign in.";
      } else if (error.message.includes("Invalid login credentials")) {
        message = "Incorrect email or password. Please try again.";
      }
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSocialLogin = async (provider: "google" | "azure") => {
    setSocialLoading(provider);
    try {
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      setSocialLoading(null);
    }
  };
  return <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{
      opacity: 0,
      y: 20
    }} animate={{
      opacity: 1,
      y: 0
    }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <motion.div initial={{
          scale: 0.8
        }} animate={{
          scale: 1
        }} transition={{
          type: "spring",
          duration: 0.6
        }} className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/30 flex items-center justify-center">
            <span className="text-4xl">🥗</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground">Desmo</h1>
          <p className="text-muted-foreground mt-2">Family Kitchen Inventory</p>
        </div>

        <GlassCard className="p-6">
          <div className="flex mb-6 gap-2">
            <button type="button" onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-xl font-medium transition-all ${isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              Sign In
            </button>
            <button type="button" onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-xl font-medium transition-all ${!isLogin ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && <div className="space-y-2">
                <Label htmlFor="displayName">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="displayName" type="text" placeholder="Your name" value={displayName} onChange={e => setDisplayName(e.target.value)} className="pl-10" />
                </div>
                {errors.displayName && <p className="text-sm text-destructive">{errors.displayName}</p>}
              </div>}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            {isLogin && <div className="flex items-center space-x-2">
                <Checkbox id="rememberMe" checked={rememberMe} onCheckedChange={checked => setRememberMe(checked === true)} />
                <Label htmlFor="rememberMe" className="text-sm cursor-pointer">
                  Remember me
                </Label>
              </div>}

            <motion.button type="submit" disabled={loading} whileHover={{
            scale: 1.02
          }} whileTap={{
            scale: 0.98
          }} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </> : isLogin ? "Sign In" : "Create Account"}
            </motion.button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <motion.button type="button" onClick={() => handleSocialLogin("google")} disabled={socialLoading !== null} whileHover={{
              scale: 1.02
            }} whileTap={{
              scale: 0.98
            }} className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border bg-background hover:bg-muted transition-colors disabled:opacity-50">
                {socialLoading === "google" ? <Loader2 className="w-4 h-4 animate-spin" /> : <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>}
                <span className="text-sm font-medium">Google</span>
              </motion.button>

              
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>;
};
export default Auth;