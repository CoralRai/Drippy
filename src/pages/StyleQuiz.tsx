import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { quizSteps } from "@/lib/quizOptions";
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Profile fields that are saved once and only changed if user wants
const PROFILE_KEYS = ["gender", "age_group", "height", "weight", "body_type", "skin_tone"];

const StyleQuiz = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load existing quiz data on mount
  useEffect(() => {
    const loadExisting = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from("style_quizzes")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) {
          const existing: Record<string, string | string[]> = {
            gender: data.gender,
            age_group: data.age_group,
            height: data.height,
            weight: data.weight,
            body_type: data.body_type,
            skin_tone: data.skin_tone,
            preferred_fit: data.preferred_fit,
            color_palette: data.color_palette || [],
            style_preferences: data.style_preferences || [],
          };
          setAnswers(existing);

          // If profile fields are already filled, skip to preferred_fit step
          const profileFilled = PROFILE_KEYS.every((k) => existing[k]);
          if (profileFilled) {
            setHasExistingProfile(true);
            // Jump to preferred_fit step (index 6 in original, now find it)
            const prefFitIndex = quizSteps.findIndex((s) => s.key === "preferred_fit");
            if (prefFitIndex >= 0) setStep(prefFitIndex);
          }
        }
      } catch (err) {
        console.error("Failed to load quiz data:", err);
      } finally {
        setInitialLoading(false);
      }
    };
    loadExisting();
  }, [user]);

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

  const handleEditProfile = () => {
    // Go back to the first step to edit profile fields
    setStep(0);
    setHasExistingProfile(false);
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
        color_palette: (answers.color_palette as string[]) || [],
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

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-display font-bold text-gradient-pink">Drippy</span>
          </Link>
          <div className="flex items-center gap-3">
            {hasExistingProfile && step >= quizSteps.findIndex((s) => s.key === "preferred_fit") && (
              <Button variant="ghost" size="sm" onClick={handleEditProfile} className="text-xs">
                Edit Profile Info
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              Step {step + 1} of {quizSteps.length}
            </span>
          </div>
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
