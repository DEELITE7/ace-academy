import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { History as HistoryIcon, Search, Eye, ChevronRight } from "lucide-react";
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
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("quiz_attempts")
      .select("*, quiz_sets(title, course_id, courses(title, code))")
      .eq("user_id", user.id).eq("status", "completed")
      .order("completed_at", { ascending: false })
      .then(({ data }) => { setAttempts(data || []); setLoading(false); });
  }, [user]);

  const filtered = attempts.filter(a =>
    !search || a.quiz_sets?.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.quiz_sets?.courses?.code?.toLowerCase().includes(search.toLowerCase())
  );

  const totalAttempts = attempts.length;
  const avgScore = totalAttempts ? Math.round(attempts.reduce((s, a) => s + Number(a.percentage), 0) / totalAttempts) : 0;
  const highestScore = totalAttempts ? Math.round(Math.max(...attempts.map(a => Number(a.percentage)))) : 0;

  return (
    <AppLayout>
      <PageHeader title="Quiz History" description="Review your past quiz attempts" />

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
              className="glass-card rounded-xl p-4 hover-lift cursor-pointer"
              onClick={() => navigate(`/quiz/${a.quiz_set_id}`)}>
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
                <Button size="sm" variant="ghost"><Eye className="w-4 h-4" /></Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
