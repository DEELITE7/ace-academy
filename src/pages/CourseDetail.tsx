import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, FileQuestion, ChevronRight, BarChart3, Hash } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageSkeleton } from "@/components/ui/loading-skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function CourseDetail() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [quizSets, setQuizSets] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Question count selection dialog
  const [showCountDialog, setShowCountDialog] = useState(false);
  const [selectedSet, setSelectedSet] = useState<any>(null);
  const [questionCount, setQuestionCount] = useState<number>(10);

  useEffect(() => {
    if (!courseId || !user) return;
    const load = async () => {
      const [courseRes, setsRes, attemptsRes] = await Promise.all([
        supabase.from("courses").select("*").eq("id", courseId).single(),
        supabase.from("quiz_sets").select("*, questions(id)").eq("course_id", courseId).eq("is_visible", true).order("created_at"),
        supabase.from("quiz_attempts").select("quiz_set_id, score, percentage").eq("user_id", user.id),
      ]);
      setCourse(courseRes.data);
      setQuizSets(setsRes.data || []);
      setAttempts(attemptsRes.data || []);
      setLoading(false);
    };
    load();
  }, [courseId, user]);

  if (loading) return <AppLayout><PageSkeleton /></AppLayout>;
  if (!course) return <AppLayout><div className="text-center py-20"><p>Course not found</p></div></AppLayout>;

  const getBestScore = (setId: string) => {
    const setAttempts = attempts.filter(a => a.quiz_set_id === setId);
    return setAttempts.length ? Math.max(...setAttempts.map(a => Number(a.percentage))) : null;
  };

  const getAttemptCount = (setId: string) => attempts.filter(a => a.quiz_set_id === setId).length;

  const handleStartQuiz = (qs: any) => {
    const totalQuestions = qs.questions?.length || 0;
    if (totalQuestions <= 0) return;
    setSelectedSet(qs);
    setQuestionCount(Math.min(10, totalQuestions));
    setShowCountDialog(true);
  };

  const confirmStart = () => {
    if (!selectedSet) return;
    setShowCountDialog(false);
    navigate(`/quiz/${selectedSet.id}?count=${questionCount}`);
  };

  return (
    <AppLayout>
      <PageHeader title={course.title} description={course.description || course.code}>
        <Button variant="outline" onClick={() => navigate("/courses")}>Back to Courses</Button>
      </PageHeader>

      <div className="space-y-4">
        {quizSets.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-xl">
            <FileQuestion className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No quiz sets available yet</p>
          </div>
        ) : quizSets.map((qs, i) => {
          const best = getBestScore(qs.id);
          const count = getAttemptCount(qs.id);
          const totalQ = qs.questions?.length || 0;
          return (
            <motion.div
              key={qs.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-5 hover-lift cursor-pointer group"
              onClick={() => handleStartQuiz(qs)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-heading font-semibold group-hover:text-primary transition-colors">{qs.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      qs.difficulty === 'easy' ? 'bg-success/10 text-success' :
                      qs.difficulty === 'hard' ? 'bg-destructive/10 text-destructive' :
                      'bg-warning/10 text-warning'
                    }`}>{qs.difficulty}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{qs.description || "No description"}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><FileQuestion className="w-3 h-3" /> {totalQ} questions in bank</span>
                    {qs.time_limit_minutes && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {qs.time_limit_minutes} min</span>}
                    <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {count} attempts</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {best !== null && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Best</p>
                      <p className={`text-lg font-bold ${best >= 70 ? 'text-success' : best >= 50 ? 'text-warning' : 'text-destructive'}`}>{Math.round(best)}%</p>
                    </div>
                  )}
                  <Button size="sm" className="gradient-bg text-primary-foreground">
                    {count > 0 ? "Retry" : "Start"} <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Question count selection dialog */}
      <Dialog open={showCountDialog} onOpenChange={setShowCountDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Start Quiz</DialogTitle>
            <DialogDescription>
              {selectedSet?.title} — Choose how many questions you'd like to attempt. Questions will be randomly selected from the question bank.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="questionCount" className="flex items-center gap-2">
                <Hash className="w-4 h-4" /> Number of Questions
              </Label>
              <Input
                id="questionCount"
                type="number"
                min={1}
                max={selectedSet?.questions?.length || 1}
                value={questionCount}
                onChange={e => {
                  const val = parseInt(e.target.value) || 1;
                  const max = selectedSet?.questions?.length || 1;
                  setQuestionCount(Math.max(1, Math.min(val, max)));
                }}
              />
              <p className="text-xs text-muted-foreground">
                Available: {selectedSet?.questions?.length || 0} questions in the bank. No question will appear twice.
              </p>
            </div>
            {/* Quick select buttons */}
            <div className="flex flex-wrap gap-2">
              {[5, 10, 20, 30, 50].filter(n => n <= (selectedSet?.questions?.length || 0)).map(n => (
                <Button key={n} size="sm" variant={questionCount === n ? "default" : "outline"} onClick={() => setQuestionCount(n)}>
                  {n}
                </Button>
              ))}
              <Button size="sm" variant={questionCount === (selectedSet?.questions?.length || 0) ? "default" : "outline"}
                onClick={() => setQuestionCount(selectedSet?.questions?.length || 0)}>
                All ({selectedSet?.questions?.length || 0})
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCountDialog(false)}>Cancel</Button>
            <Button className="gradient-bg text-primary-foreground" onClick={confirmStart}>
              Start Quiz <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
