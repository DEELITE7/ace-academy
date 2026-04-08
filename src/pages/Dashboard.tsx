import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, History, Trophy, Layers, Megaphone, ChevronRight, Zap, TrendingUp } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/loading-skeleton";

export default function Dashboard() {
  const { profile, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ courses: 0, attempts: 0, avgScore: 0, bestScore: 0 });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [coursesRes, attemptsRes, announcementsRes] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact" }),
        supabase.from("quiz_attempts").select("score, percentage, total_questions").eq("user_id", user.id).eq("status", "completed"),
        supabase.from("announcements").select("*").eq("is_published", true).order("created_at", { ascending: false }).limit(3),
      ]);
      const attempts = attemptsRes.data || [];
      const avgScore = attempts.length ? Math.round(attempts.reduce((s, a) => s + Number(a.percentage), 0) / attempts.length) : 0;
      const bestScore = attempts.length ? Math.round(Math.max(...attempts.map(a => Number(a.percentage)))) : 0;
      setStats({
        courses: coursesRes.count || 0,
        attempts: attempts.length,
        avgScore,
        bestScore,
      });
      setAnnouncements(announcementsRes.data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  if (authLoading || loading) return <AppLayout><PageSkeleton /></AppLayout>;

  const quickActions = [
    { label: "Start Quiz", icon: Zap, to: "/courses", color: "from-primary to-accent" },
    { label: "Flashcards", icon: Layers, to: "/flashcards", color: "from-success to-info" },
    { label: "History", icon: History, to: "/history", color: "from-warning to-destructive" },
    { label: "Leaderboard", icon: Trophy, to: "/leaderboard", color: "from-accent to-primary" },
  ];

  return (
    <AppLayout>
      <PageHeader title={`Welcome back, ${profile?.display_name || "Student"}!`} description="Here's your learning overview" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Courses" value={stats.courses} icon={BookOpen} delay={0} />
        <StatCard title="Quizzes Taken" value={stats.attempts} icon={History} delay={0.1} />
        <StatCard title="Avg Score" value={`${stats.avgScore}%`} icon={TrendingUp} delay={0.2} />
        <StatCard title="Best Score" value={`${stats.bestScore}%`} icon={Trophy} delay={0.3} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickActions.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(action.to)}
            className={`bg-gradient-to-br ${action.color} rounded-xl p-5 text-primary-foreground text-left shadow-lg`}
          >
            <action.icon className="w-6 h-6 mb-3 opacity-90" />
            <p className="font-semibold text-sm">{action.label}</p>
            <ChevronRight className="w-4 h-4 mt-2 opacity-70" />
          </motion.button>
        ))}
      </div>

      {/* Recent Announcements */}
      {announcements.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" /> Announcements
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/announcements")}>View All</Button>
          </div>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
                  </div>
                  {a.is_pinned && <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium">Pinned</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AppLayout>
  );
}
