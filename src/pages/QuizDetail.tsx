import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Clock, Users, DollarSign, Lock, Play, ChevronLeft, Tag, Copy, Check, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageSkeleton } from "@/components/ui/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

export default function QuizDetailPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);

  useEffect(() => {
    const load = async () => {
      // Try by ID first, then by public code
      let query = supabase
        .from("quiz_sets")
        .select("*, courses(title, code), profiles!quiz_sets_creator_id_fkey(display_name, avatar_url), questions(id)")
        .eq("status", "published");

      const { data: byId } = await query.eq("id", quizId!).maybeSingle();
      let quizData = byId;
      if (!quizData) {
        const { data: byCode } = await supabase
          .from("quiz_sets")
          .select("*, courses(title, code), profiles!quiz_sets_creator_id_fkey(display_name, avatar_url), questions(id)")
          .eq("status", "published")
          .eq("public_quiz_code", quizId!.toUpperCase())
          .maybeSingle();
        quizData = byCode;
      }
      setQuiz(quizData);

      // Check purchase if paid
      if (quizData?.is_monetized && user) {
        const { data: purchase } = await supabase
          .from("quiz_purchases")
          .select("id")
          .eq("user_id", user.id)
          .eq("quiz_set_id", quizData.id)
          .eq("payment_status", "completed")
          .maybeSingle();
        setHasPurchased(!!purchase);
      }
      setLoading(false);
    };
    load();
  }, [quizId, user]);

  const handlePurchase = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!quiz) return;
    setPurchasing(true);

    // Mock payment flow — in production, integrate Stripe/Paystack here
    const creatorShare = Number(quiz.price_amount) * (quiz.owner_share_percent / 100);
    const platformShare = Number(quiz.price_amount) * (quiz.platform_share_percent / 100);

    const { data: purchase, error } = await supabase.from("quiz_purchases").insert({
      user_id: user.id,
      quiz_set_id: quiz.id,
      amount_paid: quiz.price_amount,
      currency: quiz.currency,
      creator_share: creatorShare,
      platform_share: platformShare,
      payment_status: "completed",
      payment_provider: "mock",
    }).select().single();

    if (error) {
      toast({ title: "Purchase failed", description: error.message, variant: "destructive" });
      setPurchasing(false);
      return;
    }

    // Record earnings
    if (purchase && quiz.creator_id) {
      await supabase.from("creator_earnings").insert({
        creator_id: quiz.creator_id,
        quiz_set_id: quiz.id,
        purchase_id: purchase.id,
        amount: creatorShare,
        currency: quiz.currency,
      });
    }

    // Update purchase count
    await supabase.from("quiz_sets").update({ purchase_count: (quiz.purchase_count || 0) + 1 }).eq("id", quiz.id);

    setHasPurchased(true);
    setPurchasing(false);
    toast({ title: "Purchase successful!", description: "You can now take this quiz." });
  };

  const handleStartQuiz = () => {
    if (!user) { navigate("/auth"); return; }
    if (quiz.is_monetized && !hasPurchased) { handlePurchase(); return; }
    const totalQ = quiz.questions?.length || 0;
    if (totalQ <= 0) return;
    setQuestionCount(Math.min(10, totalQ));
    setShowStartDialog(true);
  };

  const confirmStart = () => {
    setShowStartDialog(false);
    navigate(`/quiz/${quiz.id}?count=${questionCount}`);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(quiz.public_quiz_code || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-screen bg-background p-8"><PageSkeleton /></div>;
  if (!quiz) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-heading font-bold mb-2">Quiz not found</h2>
        <p className="text-muted-foreground mb-4">The quiz you're looking for doesn't exist or isn't published.</p>
        <Button onClick={() => navigate("/quizzes")}>Browse Quizzes</Button>
      </div>
    </div>
  );

  const totalQ = quiz.questions?.length || 0;
  const canStart = !quiz.is_monetized || hasPurchased;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Button variant="ghost" onClick={() => navigate("/quizzes")}><ChevronLeft className="w-4 h-4 mr-1" /> Back to Quizzes</Button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold">QuizMaster</span>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="glass-card rounded-2xl overflow-hidden mb-6">
            <div className="h-40 gradient-bg relative">
              {quiz.thumbnail_url && <img src={quiz.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
            </div>
            <div className="p-6 -mt-8 relative">
              <div className="flex flex-wrap gap-2 mb-3">
                {quiz.is_monetized ? (
                  <Badge className="bg-warning text-warning-foreground"><DollarSign className="w-3 h-3 mr-0.5" />{Number(quiz.price_amount).toFixed(2)} {quiz.currency}</Badge>
                ) : (
                  <Badge variant="secondary">Free</Badge>
                )}
                <Badge variant="outline" className={`${
                  quiz.difficulty === 'easy' ? 'border-success/50 text-success' :
                  quiz.difficulty === 'hard' ? 'border-destructive/50 text-destructive' :
                  'border-warning/50 text-warning'
                }`}>{quiz.difficulty}</Badge>
                {quiz.courses && <Badge variant="outline">{quiz.courses.code}</Badge>}
              </div>
              <h1 className="text-2xl font-heading font-bold mb-2">{quiz.title}</h1>
              <p className="text-muted-foreground mb-4">{quiz.description || "No description provided."}</p>

              {/* Quiz code */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-muted-foreground">Quiz Code:</span>
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{quiz.public_quiz_code}</code>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyCode}>
                  {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Questions", value: totalQ, icon: GraduationCap },
                  { label: "Plays", value: quiz.total_plays || 0, icon: Users },
                  { label: "Time Limit", value: quiz.time_limit_minutes ? `${quiz.time_limit_minutes}m` : "None", icon: Clock },
                  { label: "Passing", value: `${quiz.passing_score || 50}%`, icon: Tag },
                ].map((s, i) => (
                  <div key={i} className="bg-muted/50 rounded-lg p-3 text-center">
                    <s.icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                    <p className="text-lg font-heading font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Creator info */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-sm font-bold text-primary-foreground">
                  {quiz.profiles?.display_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-medium text-sm">Created by {quiz.profiles?.display_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">Published {new Date(quiz.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Tags */}
              {quiz.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {quiz.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs"><Tag className="w-3 h-3 mr-1" />{tag}</Badge>
                  ))}
                </div>
              )}

              {/* Instructions */}
              {quiz.instructions && (
                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <h3 className="font-heading font-semibold mb-2">Instructions</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{quiz.instructions}</p>
                </div>
              )}

              {/* Action */}
              <div className="flex flex-col sm:flex-row gap-3">
                {canStart ? (
                  <Button size="lg" className="gradient-bg text-primary-foreground flex-1" onClick={handleStartQuiz}>
                    <Play className="w-4 h-4 mr-2" /> Start Quiz
                  </Button>
                ) : (
                  <Button size="lg" className="bg-warning text-warning-foreground flex-1" onClick={handlePurchase} disabled={purchasing}>
                    <Lock className="w-4 h-4 mr-2" /> {purchasing ? "Processing..." : `Purchase for ${Number(quiz.price_amount).toFixed(2)} ${quiz.currency}`}
                  </Button>
                )}
              </div>

              {quiz.is_monetized && !hasPurchased && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  70% goes to the creator · 30% supports the platform
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Start quiz dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Start Quiz</DialogTitle>
            <DialogDescription>Choose how many questions to attempt. Questions are randomly selected.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="qc" className="flex items-center gap-2"><Hash className="w-4 h-4" /> Number of Questions</Label>
              <Input id="qc" type="number" min={1} max={totalQ} value={questionCount}
                onChange={e => setQuestionCount(Math.max(1, Math.min(parseInt(e.target.value) || 1, totalQ)))} />
              <p className="text-xs text-muted-foreground">Available: {totalQ} questions. No repeats.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[5, 10, 20, 30, 50].filter(n => n <= totalQ).map(n => (
                <Button key={n} size="sm" variant={questionCount === n ? "default" : "outline"} onClick={() => setQuestionCount(n)}>{n}</Button>
              ))}
              <Button size="sm" variant={questionCount === totalQ ? "default" : "outline"} onClick={() => setQuestionCount(totalQ)}>All ({totalQ})</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartDialog(false)}>Cancel</Button>
            <Button className="gradient-bg text-primary-foreground" onClick={confirmStart}>Start Quiz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
