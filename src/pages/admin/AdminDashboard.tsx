import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, FileQuestion, GraduationCap, History, TrendingUp, DollarSign, Globe, Eye, Search, EyeOff } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { supabase } from "@/integrations/supabase/client";
import { PageSkeleton } from "@/components/ui/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState({ users: 0, courses: 0, quizSets: 0, questions: 0, attempts: 0, avgScore: 0, creators: 0, purchases: 0, platformRevenue: 0, creatorRevenue: 0 });
  const [recentQuizzes, setRecentQuizzes] = useState<any[]>([]);
  const [quizSearch, setQuizSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [users, courses, sets, questions, attempts, purchases, platformEarnings, creatorEarnings] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("quiz_sets").select("id", { count: "exact", head: true }),
        supabase.from("questions").select("id", { count: "exact", head: true }),
        supabase.from("quiz_attempts").select("percentage").eq("status", "completed"),
        supabase.from("quiz_purchases").select("amount_paid, platform_share").eq("payment_status", "completed"),
        supabase.from("platform_earnings").select("amount"),
        supabase.from("creator_earnings").select("amount"),
      ]);

      // Count unique creators
      const { data: creatorsData } = await supabase.from("quiz_sets").select("creator_id").not("creator_id", "is", null);
      const uniqueCreators = new Set((creatorsData || []).map(c => c.creator_id)).size;

      const attData = attempts.data || [];
      const avg = attData.length ? Math.round(attData.reduce((s, a) => s + Number(a.percentage), 0) / attData.length) : 0;
      const platformRev = (platformEarnings.data || []).reduce((s, e) => s + Number(e.amount), 0);
      const creatorRev = (creatorEarnings.data || []).reduce((s, e) => s + Number(e.amount), 0);

      setStats({
        users: users.count || 0, courses: courses.count || 0, quizSets: sets.count || 0,
        questions: questions.count || 0, attempts: attData.length, avgScore: avg,
        creators: uniqueCreators, purchases: (purchases.data || []).length,
        platformRevenue: platformRev, creatorRevenue: creatorRev,
      });

      // Recent quizzes
      const { data: recent } = await supabase.from("quiz_sets")
        .select("*, profiles!quiz_sets_creator_id_fkey(display_name)")
        .order("created_at", { ascending: false }).limit(20);
      setRecentQuizzes(recent || []);
      setLoading(false);
    };
    load();
  }, []);

  const toggleQuizVisibility = async (quiz: any) => {
    const newStatus = quiz.status === "published" ? "archived" : "published";
    await supabase.from("quiz_sets").update({ status: newStatus, is_visible: newStatus === "published" }).eq("id", quiz.id);
    setRecentQuizzes(q => q.map(x => x.id === quiz.id ? { ...x, status: newStatus, is_visible: newStatus === "published" } : x));
    toast({ title: `Quiz ${newStatus}` });
  };

  if (loading) return <AppLayout><PageSkeleton /></AppLayout>;

  const filteredQuizzes = recentQuizzes.filter(q =>
    !quizSearch || q.title?.toLowerCase().includes(quizSearch.toLowerCase()) ||
    q.public_quiz_code?.toLowerCase().includes(quizSearch.toLowerCase())
  );

  return (
    <AppLayout>
      <PageHeader title="Admin Dashboard" description="Platform overview and management" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Users" value={stats.users} icon={Users} />
        <StatCard title="Creators" value={stats.creators} icon={GraduationCap} delay={0.05} />
        <StatCard title="Total Quizzes" value={stats.quizSets} icon={FileQuestion} delay={0.1} />
        <StatCard title="Questions" value={stats.questions} icon={BookOpen} delay={0.15} />
        <StatCard title="Total Attempts" value={stats.attempts} icon={History} delay={0.2} />
        <StatCard title="Avg Score" value={`${stats.avgScore}%`} icon={TrendingUp} delay={0.25} />
        <StatCard title="Platform Revenue" value={`$${stats.platformRevenue.toFixed(2)}`} icon={DollarSign} delay={0.3} />
        <StatCard title="Creator Payouts" value={`$${stats.creatorRevenue.toFixed(2)}`} icon={DollarSign} delay={0.35} />
      </div>

      {/* Quiz management */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-lg">All Quizzes</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search quizzes..." className="pl-10" value={quizSearch} onChange={e => setQuizSearch(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          {filteredQuizzes.map((quiz, i) => (
            <motion.div key={quiz.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{quiz.title}</p>
                  <Badge variant={quiz.status === "published" ? "default" : quiz.status === "archived" ? "destructive" : "secondary"} className="text-xs">{quiz.status}</Badge>
                  {quiz.is_monetized && <Badge className="bg-warning/10 text-warning text-xs">${Number(quiz.price_amount).toFixed(2)}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {quiz.public_quiz_code} · by {quiz.profiles?.display_name || "System"} · {quiz.total_plays || 0} plays
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => toggleQuizVisibility(quiz)} title={quiz.status === "published" ? "Archive" : "Publish"}>
                {quiz.status === "published" ? <EyeOff className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
