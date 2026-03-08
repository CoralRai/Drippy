import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sparkles, Shirt, Zap, ShoppingBag, ArrowRight, Palette, CloudSun, LayoutGrid } from "lucide-react";
import drippyLogo from "@/assets/drippy-logo.png";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-fashion">
      {/* Nav */}
      <nav className="border-b border-border/50 p-4 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={drippyLogo} alt="Drippy" className="h-12" />
          </Link>
          <div>
            {user ? (
              <div className="flex gap-3">
                <Link to="/wardrobe">
                  <Button variant="ghost" size="sm">My Wardrobe</Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" size="sm">Profile</Button>
                </Link>
                <Link to="/quiz">
                  <Button variant="hero" size="sm">Style Profile</Button>
                </Link>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="hero" size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 md:py-32 px-4 bg-fashion-overlay">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary font-medium">AI-Powered Fashion</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-display mb-6 leading-tight">
            Your Personal
            <br />
            <span className="text-gradient-pink">AI Stylist</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Get outfit recommendations tailored to your body type, style preferences, weather, and occasion.
            Powered by a compatibility graph with Reddit fashion insights.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={user ? "/quiz" : "/signup"}>
              <Button variant="hero" size="lg" className="text-lg px-8">
                Start Style Quiz <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            {user && (
              <Link to="/wardrobe">
                <Button variant="outline-pink" size="lg" className="text-lg px-8">
                  My Wardrobe <LayoutGrid className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t border-border/50 bg-fashion-overlay">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-center mb-12">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: <Sparkles className="h-8 w-8" />,
                title: "Take the Quiz",
                desc: "Tell us about your body type, style preferences, and color choices.",
              },
              {
                icon: <Shirt className="h-8 w-8" />,
                title: "AI Generates Outfits",
                desc: "Our compatibility graph engine dynamically builds outfits scored across 7+ factors.",
              },
              {
                icon: <ShoppingBag className="h-8 w-8" />,
                title: "Shop the Look",
                desc: "Buy complete outfit bundles from Amazon, Myntra, or Flipkart.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="glass-card rounded-xl p-8 text-center hover:shadow-pink transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-display font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Palette className="h-8 w-8" />,
                title: "Color Harmony",
                desc: "Smart color matching ensures every piece works together beautifully.",
              },
              {
                icon: <CloudSun className="h-8 w-8" />,
                title: "Weather-Aware",
                desc: "Get outfit suggestions based on your current weather conditions.",
              },
              {
                icon: <LayoutGrid className="h-8 w-8" />,
                title: "Wardrobe Builder",
                desc: "Add your own clothes and get outfits mixing your wardrobe with new items.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="glass-card rounded-xl p-8 text-center hover:shadow-pink transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-display font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4 bg-background/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground text-sm">
          <p>© 2026 Drippy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
