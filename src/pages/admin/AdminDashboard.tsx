import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, FileQuestion, GraduationCap, History, TrendingUp } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { supabase } from "@/integrations/supabase/client";
import { PageSkeleton } from "@/components/ui/loading-skeleton";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, courses: 0, quizSets: 0, questions: 0, attempts: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [users, courses, sets, questions, attempts] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("quiz_sets").select("id", { count: "exact", head: true }),
        supabase.from("questions").select("id", { count: "exact", head: true }),
        supabase.from("quiz_attempts").select("percentage").eq("status", "completed"),
      ]);
      const attData = attempts.data || [];
      const avg = attData.length ? Math.round(attData.reduce((s, a) => s + Number(a.percentage), 0) / attData.length) : 0;
      setStats({
        users: users.count || 0, courses: courses.count || 0, quizSets: sets.count || 0,
        questions: questions.count || 0, attempts: attData.length, avgScore: avg,
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <AppLayout><PageSkeleton /></AppLayout>;

  return (
    <AppLayout>
      <PageHeader title="Admin Dashboard" description="Overview of your quiz platform" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Users" value={stats.users} icon={Users} delay={0} />
        <StatCard title="Courses" value={stats.courses} icon={BookOpen} delay={0.1} />
        <StatCard title="Quiz Sets" value={stats.quizSets} icon={FileQuestion} delay={0.2} />
        <StatCard title="Questions" value={stats.questions} icon={GraduationCap} delay={0.3} />
        <StatCard title="Total Attempts" value={stats.attempts} icon={History} delay={0.4} />
        <StatCard title="Avg Score" value={`${stats.avgScore}%`} icon={TrendingUp} delay={0.5} />
      </div>
    </AppLayout>
  );
}
