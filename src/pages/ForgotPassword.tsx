import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, ArrowLeft } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast({ title: "Email sent!", description: "Check your inbox for the reset link." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold font-display text-gradient-pink">Drippy</h1>
          </Link>
          <p className="text-muted-foreground">Reset your password</p>
        </div>

        <div className="glass-card rounded-xl p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-foreground">We've sent a password reset link to <strong>{email}</strong>.</p>
              <p className="text-sm text-muted-foreground">Check your inbox and click the link to set a new password.</p>
              <Link to="/login">
                <Button variant="ghost" className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="bg-secondary border-border"
                  />
                </div>
                <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
              <p className="text-center text-muted-foreground mt-6 text-sm">
                Remember your password?{" "}
                <Link to="/login" className="text-primary hover:underline">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
