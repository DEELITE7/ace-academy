import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, FileQuestion, DollarSign, Eye, BarChart3, Edit, Trash2, Globe, EyeOff } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/ui/loading-skeleton";
import { useToast } from "@/hooks/use-toast";

export default function CreatorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [earnings, setEarnings] = useState({ total: 0, pending: 0, paid: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [quizzesRes, earningsRes] = await Promise.all([
        supabase.from("quiz_sets").select("*, questions(id)").eq("creator_id", user.id).order("created_at", { ascending: false }),
        supabase.from("creator_earnings").select("amount, payout_status").eq("creator_id", user.id),
      ]);
      setQuizzes(quizzesRes.data || []);
      const e = earningsRes.data || [];
      setEarnings({
        total: e.reduce((s, r) => s + Number(r.amount), 0),
        pending: e.filter(r => r.payout_status === "pending").reduce((s, r) => s + Number(r.amount), 0),
        paid: e.filter(r => r.payout_status === "paid").reduce((s, r) => s + Number(r.amount), 0),
      });
      setLoading(false);
    };
    load();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this quiz permanently?")) return;
    await supabase.from("quiz_sets").delete().eq("id", id);
    setQuizzes(q => q.filter(x => x.id !== id));
    toast({ title: "Quiz deleted" });
  };

  const toggleStatus = async (quiz: any) => {
    const newStatus = quiz.status === "published" ? "draft" : "published";
    await supabase.from("quiz_sets").update({ status: newStatus }).eq("id", quiz.id);
    setQuizzes(q => q.map(x => x.id === quiz.id ? { ...x, status: newStatus } : x));
    toast({ title: `Quiz ${newStatus === "published" ? "published" : "unpublished"}` });
  };

  if (loading) return <AppLayout><PageSkeleton /></AppLayout>;

  const published = quizzes.filter(q => q.status === "published").length;
  const drafts = quizzes.filter(q => q.status === "draft").length;
  const totalPlays = quizzes.reduce((s, q) => s + (q.total_plays || 0), 0);

  return (
    <AppLayout>
      <PageHeader title="Creator Dashboard" description="Manage your quizzes and earnings">
        <Button className="gradient-bg text-primary-foreground" onClick={() => navigate("/creator/new")}>
          <Plus className="w-4 h-4 mr-2" /> Create Quiz
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="My Quizzes" value={quizzes.length} icon={FileQuestion} />
        <StatCard title="Total Plays" value={totalPlays} icon={Eye} delay={0.1} />
        <StatCard title="Total Earnings" value={`$${earnings.total.toFixed(2)}`} icon={DollarSign} delay={0.2} />
        <StatCard title="Pending Payout" value={`$${earnings.pending.toFixed(2)}`} icon={BarChart3} delay={0.3} />
      </div>

      {/* Quiz list */}
      {quizzes.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-xl">
          <FileQuestion className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No quizzes yet</p>
          <p className="text-sm text-muted-foreground mb-4">Create your first quiz and share it with the world.</p>
          <Button className="gradient-bg text-primary-foreground" onClick={() => navigate("/creator/new")}>
            <Plus className="w-4 h-4 mr-2" /> Create Quiz
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz, i) => (
            <motion.div key={quiz.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-heading font-semibold truncate">{quiz.title}</h3>
                    <Badge variant={quiz.status === "published" ? "default" : "secondary"} className="text-xs">
                      {quiz.status}
                    </Badge>
                    {quiz.is_monetized && <Badge className="bg-warning/10 text-warning text-xs">Paid</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-mono">{quiz.public_quiz_code}</span>
                    <span>{quiz.questions?.length || 0} questions</span>
                    <span>{quiz.total_plays || 0} plays</span>
                    {quiz.is_monetized && <span>${Number(quiz.price_amount).toFixed(2)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => toggleStatus(quiz)} title={quiz.status === "published" ? "Unpublish" : "Publish"}>
                    {quiz.status === "published" ? <EyeOff className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/creator/edit/${quiz.id}`)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(quiz.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
