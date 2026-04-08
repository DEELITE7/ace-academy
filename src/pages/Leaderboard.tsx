import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, ChevronDown } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { ListSkeleton } from "@/components/ui/loading-skeleton";

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("courses").select("id, title, code").then(({ data }) => setCourses(data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    let query = supabase.from("leaderboard_entries").select("*").is("quiz_set_id", null).order("best_percentage", { ascending: false }).limit(50);
    if (selectedCourse !== "all") query = query.eq("course_id", selectedCourse);
    query.then(({ data }) => { setEntries(data || []); setLoading(false); });
  }, [selectedCourse]);

  const userEntry = entries.find(e => e.user_id === user?.id);
  const userRank = userEntry ? entries.indexOf(userEntry) + 1 : null;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-warning" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-warning/70" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
  };

  return (
    <AppLayout>
      <PageHeader title="Leaderboard" description="See how you rank against your peers">
        <div className="relative">
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            className="appearance-none bg-card border border-border rounded-lg px-4 py-2 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </PageHeader>

      {/* User rank card */}
      {userEntry && userRank && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-5 mb-6 gradient-bg-subtle border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-lg font-bold text-primary-foreground">
                #{userRank}
              </div>
              <div>
                <p className="font-heading font-semibold">Your Rank</p>
                <p className="text-sm text-muted-foreground">Best: {Math.round(Number(userEntry.best_percentage))}% · {userEntry.total_attempts} attempts</p>
              </div>
            </div>
            <Trophy className="w-6 h-6 text-primary" />
          </div>
        </motion.div>
      )}

      {/* Top 3 spotlight */}
      {!loading && entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[entries[1], entries[0], entries[2]].map((entry, i) => {
            const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
            return (
              <motion.div key={entry.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={cn("glass-card rounded-xl p-4 text-center", rank === 1 && "ring-2 ring-warning/50 -mt-4")}>
                <div className={cn("w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center font-heading font-bold text-lg",
                  rank === 1 ? "gradient-bg text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {entry.display_name?.charAt(0)?.toUpperCase()}
                </div>
                {getRankIcon(rank)}
                <p className="font-semibold text-sm mt-1 truncate">{entry.display_name}</p>
                <p className="text-lg font-heading font-bold gradient-text">{Math.round(Number(entry.best_percentage))}%</p>
                <p className="text-xs text-muted-foreground">{entry.total_attempts} attempts</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full list */}
      {loading ? <ListSkeleton /> : entries.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-xl">
          <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No entries yet</p>
          <p className="text-sm text-muted-foreground">Complete a quiz to appear here!</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          {entries.map((entry, i) => (
            <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              className={cn("flex items-center gap-4 px-5 py-3 border-b border-border/50 last:border-0",
                entry.user_id === user?.id && "bg-primary/5"
              )}>
              <div className="w-8 flex justify-center">{getRankIcon(i + 1)}</div>
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                {entry.display_name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{entry.display_name}</p>
                <p className="text-xs text-muted-foreground">{entry.total_attempts} attempts</p>
              </div>
              <div className="text-right">
                <p className={cn("font-heading font-bold",
                  Number(entry.best_percentage) >= 70 ? "text-success" : Number(entry.best_percentage) >= 50 ? "text-warning" : "text-destructive"
                )}>{Math.round(Number(entry.best_percentage))}%</p>
                <p className="text-xs text-muted-foreground">Best: {entry.best_score}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
