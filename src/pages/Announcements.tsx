import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Pin } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/integrations/supabase/client";
import { ListSkeleton } from "@/components/ui/loading-skeleton";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("announcements").select("*").eq("is_published", true)
      .order("is_pinned", { ascending: false }).order("created_at", { ascending: false })
      .then(({ data }) => { setAnnouncements(data || []); setLoading(false); });
  }, []);

  return (
    <AppLayout>
      <PageHeader title="Announcements" description="Stay updated with the latest news" />
      {loading ? <ListSkeleton /> : announcements.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-xl">
          <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-heading font-semibold text-lg">{a.title}</h3>
                <div className="flex items-center gap-2">
                  {a.is_pinned && <Pin className="w-4 h-4 text-warning" />}
                  {a.category && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{a.category}</span>}
                </div>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.content}</p>
              <p className="text-xs text-muted-foreground mt-3">{new Date(a.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </motion.div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
