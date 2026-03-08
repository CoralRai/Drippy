import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { occasions } from "@/lib/quizOptions";
import { Sparkles, ArrowRight } from "lucide-react";

const OccasionSelect = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selected) {
      navigate(`/recommendations?occasion=${selected}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-display font-bold text-gradient-pink">Drippy</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold font-display mb-3">
            What's the occasion?
          </h1>
          <p className="text-muted-foreground text-lg">
            Select the occasion and we'll style you perfectly
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
          {occasions.map((occ) => (
            <button
              key={occ.id}
              onClick={() => setSelected(occ.id)}
              className={`p-6 rounded-xl text-center transition-all duration-200 border ${
                selected === occ.id
                  ? "border-primary bg-primary/10 shadow-pink"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="text-3xl mb-2">{occ.icon}</div>
              <span className="font-medium text-sm">{occ.label}</span>
            </button>
          ))}
        </div>

        <div className="text-center">
          <Button
            variant="hero"
            size="lg"
            onClick={handleContinue}
            disabled={!selected}
            className="px-12"
          >
            Get Recommendations <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OccasionSelect;
