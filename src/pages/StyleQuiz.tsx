import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { quizSteps } from "@/lib/quizOptions";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const StyleQuiz = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const current = quizSteps[step];
  const progress = ((step + 1) / quizSteps.length) * 100;

  const handleSelect = (option: string) => {
    if (current.type === "multi") {
      const existing = (answers[current.key] as string[]) || [];
      const updated = existing.includes(option)
        ? existing.filter((o) => o !== option)
        : [...existing, option];
      setAnswers({ ...answers, [current.key]: updated });
    } else {
      setAnswers({ ...answers, [current.key]: option });
    }
  };

  const isSelected = (option: string) => {
    const val = answers[current.key];
    if (Array.isArray(val)) return val.includes(option);
    return val === option;
  };

  const canProceed = () => {
    const val = answers[current.key];
    if (!val) return false;
    if (Array.isArray(val)) return val.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < quizSteps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const quizData = {
        user_id: user.id,
        gender: answers.gender as string,
        age_group: answers.age_group as string,
        height: answers.height as string,
        weight: answers.weight as string,
        body_type: answers.body_type as string,
        skin_tone: answers.skin_tone as string,
        preferred_fit: answers.preferred_fit as string,
        color_palette: answers.color_palette as string[],
        style_preferences: answers.style_preferences as string[],
      };

      const { error } = await supabase
        .from("style_quizzes")
        .upsert(quizData, { onConflict: "user_id" });

      if (error) throw error;

      toast({ title: "Style profile saved!", description: "Now pick your occasion." });
      navigate("/occasions");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-gradient-pink">Drippy</span>
          </div>
          <span className="text-sm text-muted-foreground">
            Step {step + 1} of {quizSteps.length}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-6">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-2xl mx-auto w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold font-display mb-2">{current.title}</h2>
          <p className="text-muted-foreground">{current.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
          {current.options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className={`p-4 rounded-xl text-left transition-all duration-200 border ${
                isSelected(option)
                  ? "border-primary bg-primary/10 shadow-pink"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <span className="font-medium">{option}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="border-t border-border p-4">
        <div className="max-w-2xl mx-auto flex justify-between">
          <Button variant="ghost" onClick={handleBack} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>

          {step < quizSteps.length - 1 ? (
            <Button variant="hero" onClick={handleNext} disabled={!canProceed()}>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button variant="hero" onClick={handleSubmit} disabled={!canProceed() || loading}>
              {loading ? "Saving..." : "Complete Quiz"} <Sparkles className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StyleQuiz;
