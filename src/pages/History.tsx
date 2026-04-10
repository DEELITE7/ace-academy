import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History as HistoryIcon, Search, Eye, ChevronDown, ChevronUp, CheckCircle2, XCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import { ListSkeleton } from "@/components/ui/loading-skeleton";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<Record<string, any[]>>({});
  const [loadingReview, setLoadingReview] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("quiz_attempts")
      .select("*, quiz_sets(title, course_id, courses(title, code))")
      .eq("user_id", user.id).eq("status", "completed")
      .order("completed_at", { ascending: false })
      .then(({ data }) => { setAttempts(data || []); setLoading(false); });
  }, [user]);

  const toggleReview = async (attemptId: string) => {
    if (expandedId === attemptId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(attemptId);
    if (reviewData[attemptId]) return;

    setLoadingReview(attemptId);
    const { data: answers } = await supabase
      .from("quiz_attempt_answers")
      .select("*, questions(question_text, explanation, question_options(id, option_label, option_text, is_correct))")
      .eq("attempt_id", attemptId);
    setReviewData(prev => ({ ...prev, [attemptId]: answers || [] }));
    setLoadingReview(null);
  };

  const filtered = attempts.filter(a =>
    !search || a.quiz_sets?.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.quiz_sets?.courses?.code?.toLowerCase().includes(search.toLowerCase())
  );

  const totalAttempts = attempts.length;
  const avgScore = totalAttempts ? Math.round(attempts.reduce((s, a) => s + Number(a.percentage), 0) / totalAttempts) : 0;
  const highestScore = totalAttempts ? Math.round(Math.max(...attempts.map(a => Number(a.percentage)))) : 0;

  return (
    <AppLayout>
      <PageHeader title="Quiz History" description="Review your past quiz attempts and answers" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Total Attempts" value={totalAttempts} icon={HistoryIcon} />
        <StatCard title="Average Score" value={`${avgScore}%`} icon={HistoryIcon} delay={0.1} />
        <StatCard title="Highest Score" value={`${highestScore}%`} icon={HistoryIcon} delay={0.2} />
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by quiz or course..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <ListSkeleton /> : filtered.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-xl">
          <HistoryIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No attempts yet</p>
          <p className="text-sm text-muted-foreground">Complete a quiz to see your history!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="glass-card rounded-xl overflow-hidden">
              <div className="p-4 cursor-pointer hover-lift" onClick={() => toggleReview(a.id)}>
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-lg font-heading font-bold",
                    Number(a.percentage) >= 70 ? "bg-success/10 text-success" :
                    Number(a.percentage) >= 50 ? "bg-warning/10 text-warning" :
                    "bg-destructive/10 text-destructive"
                  )}>{Math.round(Number(a.percentage))}%</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{a.quiz_sets?.title}</p>
                    <p className="text-xs text-muted-foreground">{a.quiz_sets?.courses?.code} · {a.score}/{a.total_questions} correct</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : "—"}
                      {a.duration_seconds && ` · ${Math.floor(a.duration_seconds / 60)}m ${a.duration_seconds % 60}s`}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost">
                    {expandedId === a.id ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Expanded review section */}
              <AnimatePresence>
                {expandedId === a.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border p-4 space-y-3">
                      {loadingReview === a.id ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Loading review...</p>
                      ) : reviewData[a.id]?.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No answer details available</p>
                      ) : reviewData[a.id]?.map((ans, idx) => {
                        const q = ans.questions;
                        if (!q) return null;
                        const correctOpt = q.question_options?.find((o: any) => o.is_correct);
                        const selectedOpt = q.question_options?.find((o: any) => o.id === ans.selected_option_id);
                        return (
                          <div key={ans.id} className={cn("rounded-lg p-4 border-l-4",
                            ans.is_correct ? "border-l-success bg-success/5" : "border-l-destructive bg-destructive/5"
                          )}>
                            <div className="flex items-start gap-2 mb-2">
                              <span className="text-xs font-bold bg-muted px-2 py-0.5 rounded">Q{idx + 1}</span>
                              {ans.is_correct ? <CheckCircle2 className="w-4 h-4 text-success mt-0.5" /> : <XCircle className="w-4 h-4 text-destructive mt-0.5" />}
                              <p className="text-sm font-medium flex-1">{q.question_text}</p>
                            </div>
                            <div className="ml-7 space-y-1">
                              {q.question_options?.map((opt: any) => (
                                <div key={opt.id} className={cn("text-xs px-2 py-1.5 rounded",
                                  opt.is_correct ? "bg-success/10 text-success font-medium" :
                                  opt.id === ans.selected_option_id && !opt.is_correct ? "bg-destructive/10 text-destructive" :
                                  "text-muted-foreground"
                                )}>
                                  <span className="font-medium mr-1">{opt.option_label}.</span>{opt.option_text}
                                  {opt.is_correct && " ✓"}
                                  {opt.id === ans.selected_option_id && !opt.is_correct && " ✗ (your answer)"}
                                </div>
                              ))}
                              {q.explanation && (
                                <p className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded">
                                  <span className="font-medium text-foreground">Explanation:</span> {q.explanation}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
