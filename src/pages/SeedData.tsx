import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Database, Loader2, CheckCircle, ArrowLeft, Zap, Link2 } from "lucide-react";

interface StepStatus {
  status: "idle" | "loading" | "done" | "error";
  result?: any;
  error?: string;
}

const SeedData = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [steps, setSteps] = useState<Record<string, StepStatus>>({
    items: { status: "idle" },
    compatibility: { status: "idle" },
    outfits: { status: "idle" },
  });

  const fetchStats = async () => {
    const { data } = await supabase.functions.invoke("seed-fashion-data", {
      body: { action: "stats" },
    });
    setStats(data);
  };

  const runStep = async (action: string, key: string) => {
    setSteps((prev) => ({ ...prev, [key]: { status: "loading" } }));
    try {
      const { data, error } = await supabase.functions.invoke("seed-fashion-data", {
        body: { action },
      });
      if (error) throw error;
      setSteps((prev) => ({ ...prev, [key]: { status: "done", result: data } }));
      toast({ title: "Success!", description: `${key} seeded successfully.` });
      await fetchStats();
    } catch (e: any) {
      setSteps((prev) => ({ ...prev, [key]: { status: "error", error: e.message } }));
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const runAll = async () => {
    await runStep("seed_items", "items");
    await runStep("seed_compatibility", "compatibility");
    await runStep("seed_outfits", "outfits");
  };

  const getIcon = (status: StepStatus["status"]) => {
    if (status === "loading") return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    if (status === "done") return <CheckCircle className="h-5 w-5 text-primary" />;
    if (status === "error") return <span className="text-destructive text-sm">✗</span>;
    return <Database className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-fashion">
      <div className="border-b border-border/50 p-4 bg-background/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-gradient-pink">Dataset Generator</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-8 bg-fashion-overlay min-h-[calc(100vh-65px)]">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold font-display mb-3">
            Fashion Dataset <span className="text-gradient-pink">Generator</span>
          </h1>
          <p className="text-muted-foreground">
            Generate 500+ clothing items, compatibility scores, and 100+ outfit combinations
          </p>
        </div>

        {/* Stats */}
        <div className="glass-card rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold">Current Database Stats</h3>
            <Button variant="outline" size="sm" onClick={fetchStats}>
              Refresh Stats
            </Button>
          </div>
          {stats ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-secondary/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-primary">{stats.clothing_items}</p>
                <p className="text-xs text-muted-foreground">Clothing Items</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-primary">{stats.compatibility_records}</p>
                <p className="text-xs text-muted-foreground">Compatibility Records</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-primary">{stats.outfits}</p>
                <p className="text-xs text-muted-foreground">Outfit Combos</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Click "Refresh Stats" to see current counts</p>
          )}
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {[
            {
              key: "items",
              action: "seed_items",
              title: "Step 1: Generate Clothing Items",
              desc: "Creates 500+ items across tops (t-shirts, shirts, sweaters, hoodies, blazers) and bottoms (jeans, trousers, chinos, shorts, skirts) with images, colors, and affiliate links",
            },
            {
              key: "compatibility",
              action: "seed_compatibility",
              title: "Step 2: Generate Compatibility Graph",
              desc: "Calculates compatibility scores between all top-bottom pairs based on style matching, color harmony, and fit rules",
            },
            {
              key: "outfits",
              action: "seed_outfits",
              title: "Step 3: Generate Outfit Combinations",
              desc: "Creates 100+ curated outfit combinations with body type compatibility, occasion tags, and preview images",
            },
          ].map((step) => (
            <div key={step.key} className="glass-card rounded-xl p-5 flex items-start gap-4">
              <div className="mt-1">{getIcon(steps[step.key].status)}</div>
              <div className="flex-1">
                <h4 className="font-display font-bold mb-1">{step.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">{step.desc}</p>
                {steps[step.key].result && (
                  <pre className="bg-secondary/50 rounded p-2 text-xs overflow-auto mb-2">
                    {JSON.stringify(steps[step.key].result, null, 2)}
                  </pre>
                )}
                {steps[step.key].error && (
                  <p className="text-xs text-destructive">{steps[step.key].error}</p>
                )}
                <Button
                  variant="outline-pink"
                  size="sm"
                  onClick={() => runStep(step.action, step.key)}
                  disabled={steps[step.key].status === "loading"}
                >
                  {steps[step.key].status === "loading" ? "Generating..." : steps[step.key].status === "done" ? "Run Again" : "Generate"}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Run All */}
        <div className="text-center space-y-4">
          <Button
            variant="hero"
            size="lg"
            onClick={runAll}
            disabled={Object.values(steps).some((s) => s.status === "loading")}
            className="px-12"
          >
            <Zap className="h-5 w-5 mr-2" />
            Run All Steps
          </Button>
          <p className="text-xs text-muted-foreground">
            This will generate the complete dataset. It may take 1-2 minutes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SeedData;
