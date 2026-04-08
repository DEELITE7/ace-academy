import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronLeft, ChevronRight, Flag, AlertTriangle, CheckCircle2, XCircle, Send, Shield } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PageSkeleton } from "@/components/ui/loading-skeleton";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  question_text: string;
  explanation: string | null;
  order_index: number;
  question_options: { id: string; option_text: string; option_label: string; is_correct: boolean }[];
}

export default function QuizTake() {
  const { quizSetId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quizSet, setQuizSet] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [violations, setViolations] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const timerRef = useRef<any>(null);

  // Load quiz
  useEffect(() => {
    if (!quizSetId || !user) return;
    const load = async () => {
      const { data: qs } = await supabase.from("quiz_sets").select("*").eq("id", quizSetId).single();
      if (!qs) { navigate("/courses"); return; }
      setQuizSet(qs);

      let query = supabase.from("questions").select("*, question_options(*)").eq("quiz_set_id", quizSetId);
      const { data: qData } = await query;
      let qs_list = qData || [];

      if (qs.randomize_questions) qs_list = qs_list.sort(() => Math.random() - 0.5);
      if (qs.randomize_options) {
        qs_list = qs_list.map(q => ({ ...q, question_options: [...q.question_options].sort(() => Math.random() - 0.5) }));
      }
      setQuestions(qs_list);

      // Create attempt
      const { data: attempt } = await supabase.from("quiz_attempts").insert({
        user_id: user.id, quiz_set_id: quizSetId, total_questions: qs_list.length, status: "in_progress"
      }).select().single();
      if (attempt) setAttemptId(attempt.id);

      if (qs.time_limit_minutes) setTimeLeft(qs.time_limit_minutes * 60);
      setLoading(false);
    };
    load();
  }, [quizSetId, user]);

  // Timer
  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    timerRef.current = setInterval(() => setTimeLeft(t => t !== null ? t - 1 : null), 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft, submitted]);

  // Anti-cheat: visibility change
  useEffect(() => {
    if (submitted || loading) return;
    const handler = () => {
      if (document.hidden) {
        setViolations(v => v + 1);
        toast({ title: "⚠️ Tab switch detected", description: "Stay on this tab during the quiz.", variant: "destructive" });
        if (attemptId && user) {
          supabase.from("anti_cheat_logs").insert({
            attempt_id: attemptId, user_id: user.id, violation_type: "tab_switch",
            details: { timestamp: new Date().toISOString() }
          });
        }
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [submitted, loading, attemptId, user]);

  // Anti-cheat: context menu & copy
  useEffect(() => {
    if (submitted || loading) return;
    const prevent = (e: Event) => { e.preventDefault(); };
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    return () => {
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
    };
  }, [submitted, loading]);

  const selectAnswer = useCallback(async (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    if (attemptId) {
      const existing = await supabase.from("quiz_attempt_answers").select("id").eq("attempt_id", attemptId).eq("question_id", questionId).maybeSingle();
      if (existing.data) {
        await supabase.from("quiz_attempt_answers").update({ selected_option_id: optionId, answered_at: new Date().toISOString() }).eq("id", existing.data.id);
      } else {
        await supabase.from("quiz_attempt_answers").insert({ attempt_id: attemptId, question_id: questionId, selected_option_id: optionId });
      }
    }
  }, [attemptId]);

  const toggleMark = (qId: string) => {
    setMarkedForReview(prev => {
      const n = new Set(prev);
      n.has(qId) ? n.delete(qId) : n.add(qId);
      return n;
    });
  };

  const handleSubmit = async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    setShowConfirm(false);
    clearInterval(timerRef.current);

    // Calculate score on frontend for display, but also update DB
    let correct = 0;
    const resultDetails: any[] = [];
    for (const q of questions) {
      const selectedId = answers[q.id];
      const correctOpt = q.question_options.find(o => o.is_correct);
      const selectedOpt = q.question_options.find(o => o.id === selectedId);
      const isCorrect = selectedId === correctOpt?.id;
      if (isCorrect) correct++;
      resultDetails.push({
        question: q.question_text, explanation: q.explanation,
        selectedAnswer: selectedOpt?.option_text || "Not answered",
        selectedLabel: selectedOpt?.option_label || "-",
        correctAnswer: correctOpt?.option_text || "",
        correctLabel: correctOpt?.option_label || "",
        isCorrect, options: q.question_options,
      });

      // Update answer correctness
      if (attemptId) {
        await supabase.from("quiz_attempt_answers").update({ is_correct: isCorrect })
          .eq("attempt_id", attemptId).eq("question_id", q.id);
      }
    }

    const percentage = questions.length > 0 ? (correct / questions.length) * 100 : 0;
    const duration = quizSet?.time_limit_minutes && timeLeft !== null ? (quizSet.time_limit_minutes * 60 - timeLeft) : null;

    if (attemptId) {
      await supabase.from("quiz_attempts").update({
        score: correct, percentage, duration_seconds: duration,
        completed_at: new Date().toISOString(), status: "completed", violations,
      }).eq("id", attemptId);

      // Update leaderboard
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).single();
        const displayName = profile?.display_name || "Anonymous";

        // Course leaderboard
        const courseId = quizSet?.course_id;
        if (courseId) {
          const { data: existing } = await supabase.from("leaderboard_entries")
            .select("*").eq("user_id", user.id).eq("course_id", courseId).is("quiz_set_id", null).maybeSingle();
          if (existing) {
            await supabase.from("leaderboard_entries").update({
              best_score: Math.max(existing.best_score, correct),
              best_percentage: Math.max(Number(existing.best_percentage), percentage),
              total_attempts: existing.total_attempts + 1,
              display_name: displayName, updated_at: new Date().toISOString()
            }).eq("id", existing.id);
          } else {
            await supabase.from("leaderboard_entries").insert({
              user_id: user.id, course_id: courseId, best_score: correct,
              best_percentage: percentage, total_attempts: 1, display_name: displayName
            });
          }
        }

        // Quiz set leaderboard
        const { data: existingQs } = await supabase.from("leaderboard_entries")
          .select("*").eq("user_id", user.id).eq("quiz_set_id", quizSetId!).maybeSingle();
        if (existingQs) {
          await supabase.from("leaderboard_entries").update({
            best_score: Math.max(existingQs.best_score, correct),
            best_percentage: Math.max(Number(existingQs.best_percentage), percentage),
            total_attempts: existingQs.total_attempts + 1,
            display_name: displayName, updated_at: new Date().toISOString()
          }).eq("id", existingQs.id);
        } else {
          await supabase.from("leaderboard_entries").insert({
            user_id: user.id, course_id: courseId, quiz_set_id: quizSetId,
            best_score: correct, best_percentage: percentage, total_attempts: 1, display_name: displayName
          });
        }
      }
    }

    setResults({ correct, total: questions.length, percentage, details: resultDetails, duration });
    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) return <AppLayout><PageSkeleton /></AppLayout>;

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // Results view
  if (submitted && results) {
    const isPassing = results.percentage >= (quizSet?.passing_score || 50);
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
              className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${isPassing ? 'bg-success/10' : 'bg-destructive/10'}`}
            >
              {isPassing ? <CheckCircle2 className="w-12 h-12 text-success" /> : <XCircle className="w-12 h-12 text-destructive" />}
            </motion.div>
            <h1 className="text-3xl font-heading font-bold mb-2">{isPassing ? "🎉 Excellent!" : "Keep Practicing!"}</h1>
            <p className="text-muted-foreground">{quizSet?.title}</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Score", value: `${results.correct}/${results.total}` },
              { label: "Percentage", value: `${Math.round(results.percentage)}%` },
              { label: "Correct", value: results.correct },
              { label: "Wrong", value: results.total - results.correct },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                className="glass-card rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-heading font-bold mt-1">{s.value}</p>
              </motion.div>
            ))}
          </div>

          {quizSet?.show_explanations && (
            <div className="space-y-4 mb-8">
              <h2 className="font-heading font-semibold text-lg">Review Answers</h2>
              {results.details.map((d: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.03 }}
                  className={cn("glass-card rounded-xl p-5 border-l-4", d.isCorrect ? "border-l-success" : "border-l-destructive")}>
                  <div className="flex items-start gap-2 mb-3">
                    <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded">Q{i + 1}</span>
                    <p className="font-medium text-sm">{d.question}</p>
                  </div>
                  <div className="grid gap-2 mb-3">
                    {d.options.map((opt: any) => (
                      <div key={opt.id} className={cn("text-sm px-3 py-2 rounded-lg border",
                        opt.is_correct ? "bg-success/10 border-success/30 text-success" :
                        opt.id === answers[questions[i]?.id] && !opt.is_correct ? "bg-destructive/10 border-destructive/30 text-destructive" :
                        "border-border/50"
                      )}>
                        <span className="font-medium mr-2">{opt.option_label}.</span>{opt.option_text}
                        {opt.is_correct && <CheckCircle2 className="w-3.5 h-3.5 inline ml-2" />}
                        {opt.id === answers[questions[i]?.id] && !opt.is_correct && <XCircle className="w-3.5 h-3.5 inline ml-2" />}
                      </div>
                    ))}
                  </div>
                  {d.explanation && (
                    <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Explanation:</span> {d.explanation}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate(`/courses/${quizSet?.course_id}`)}>Back to Course</Button>
            <Button className="gradient-bg text-primary-foreground" onClick={() => { window.location.reload(); }}>Retry Quiz</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Quiz taking view
  return (
    <div className="min-h-screen bg-background select-none">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="font-heading font-semibold text-sm truncate">{quizSet?.title}</h2>
          </div>
          <div className="flex items-center gap-4">
            {timeLeft !== null && (
              <div className={cn("flex items-center gap-1 font-mono text-sm font-bold",
                timeLeft < 60 ? "text-destructive animate-pulse" : timeLeft < 300 ? "text-warning" : "text-muted-foreground"
              )}>
                <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
              </div>
            )}
            <span className="text-xs text-muted-foreground">{answeredCount}/{questions.length}</span>
            <Button size="sm" variant="outline" onClick={() => setShowNav(!showNav)}>
              Q{currentIdx + 1}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-4xl mx-auto mt-2">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full gradient-bg rounded-full" animate={{ width: `${(answeredCount / questions.length) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Question navigator dropdown */}
      <AnimatePresence>
        {showNav && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="sticky top-20 z-30 bg-card border-b border-border px-4 py-3">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap gap-2">
                {questions.map((q, i) => (
                  <button key={q.id} onClick={() => { setCurrentIdx(i); setShowNav(false); }}
                    className={cn("w-9 h-9 rounded-lg text-xs font-medium transition-all",
                      i === currentIdx ? "gradient-bg text-primary-foreground" :
                      answers[q.id] ? "bg-success/20 text-success" :
                      markedForReview.has(q.id) ? "bg-warning/20 text-warning" :
                      "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}>{i + 1}</button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={currentIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
            <div className="mb-6">
              <span className="text-xs text-muted-foreground font-medium">Question {currentIdx + 1} of {questions.length}</span>
              <h3 className="text-lg font-heading font-semibold mt-2">{currentQ.question_text}</h3>
            </div>

            <div className="space-y-3">
              {currentQ.question_options.map((opt) => (
                <motion.button
                  key={opt.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => selectAnswer(currentQ.id, opt.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border-2 transition-all",
                    answers[currentQ.id] === opt.id
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/30 hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0",
                      answers[currentQ.id] === opt.id ? "gradient-bg text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>{opt.option_label}</div>
                    <span className="text-sm">{opt.option_text}</span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-8">
              <Button variant="ghost" onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toggleMark(currentQ.id)}
                className={markedForReview.has(currentQ.id) ? "text-warning" : ""}>
                <Flag className="w-4 h-4 mr-1" /> {markedForReview.has(currentQ.id) ? "Marked" : "Mark"}
              </Button>
              {currentIdx < questions.length - 1 ? (
                <Button onClick={() => setCurrentIdx(currentIdx + 1)}>Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
              ) : (
                <Button className="gradient-bg text-primary-foreground" onClick={() => setShowConfirm(true)}>
                  <Send className="w-4 h-4 mr-1" /> Submit
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Submit confirmation modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-card rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <AlertTriangle className="w-10 h-10 text-warning mx-auto mb-3" />
              <h3 className="font-heading font-bold text-lg text-center mb-2">Submit Quiz?</h3>
              <p className="text-sm text-muted-foreground text-center mb-1">
                You've answered {answeredCount} of {questions.length} questions.
              </p>
              {answeredCount < questions.length && (
                <p className="text-sm text-warning text-center mb-4">{questions.length - answeredCount} unanswered questions remaining.</p>
              )}
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>Cancel</Button>
                <Button className="flex-1 gradient-bg text-primary-foreground" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
