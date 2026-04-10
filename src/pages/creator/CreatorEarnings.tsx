import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/ui/loading-skeleton";

export default function CreatorEarnings() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("creator_earnings")
      .select("*, quiz_sets(title, public_quiz_code)")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setEarnings(data || []); setLoading(false); });
  }, [user]);

  if (loading) return <AppLayout><PageSkeleton /></AppLayout>;

  const total = earnings.reduce((s, e) => s + Number(e.amount), 0);
  const pending = earnings.filter(e => e.payout_status === "pending").reduce((s, e) => s + Number(e.amount), 0);
  const paid = earnings.filter(e => e.payout_status === "paid").reduce((s, e) => s + Number(e.amount), 0);

  return (
    <AppLayout>
      <PageHeader title="Earnings" description="Track your revenue from quiz sales" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Earned" value={`$${total.toFixed(2)}`} icon={DollarSign} />
        <StatCard title="Pending Payout" value={`$${pending.toFixed(2)}`} icon={Clock} delay={0.1} />
        <StatCard title="Paid Out" value={`$${paid.toFixed(2)}`} icon={CheckCircle2} delay={0.2} />
      </div>

      {earnings.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-xl">
          <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No earnings yet</p>
          <p className="text-sm text-muted-foreground">Start earning by creating and publishing paid quizzes.</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          {earnings.map((e, i) => (
            <motion.div key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              className="flex items-center gap-4 px-5 py-3 border-b border-border/50 last:border-0">
              <div className="w-10 h-10 rounded-lg gradient-bg-subtle flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{e.quiz_sets?.title || "Quiz"}</p>
                <p className="text-xs text-muted-foreground font-mono">{e.quiz_sets?.public_quiz_code}</p>
              </div>
              <div className="text-right">
                <p className="font-heading font-bold text-success">${Number(e.amount).toFixed(2)}</p>
                <Badge variant={e.payout_status === "paid" ? "default" : "secondary"} className="text-xs">
                  {e.payout_status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">{new Date(e.created_at).toLocaleDateString()}</p>
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
