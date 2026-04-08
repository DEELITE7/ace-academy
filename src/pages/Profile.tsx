import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Save, Lock, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatCard } from "@/components/ui/stat-card";
import { useToast } from "@/hooks/use-toast";
import { Trophy, History, Target } from "lucide-react";

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ attempts: 0, avgScore: 0, rank: "—" });
  const [newPassword, setNewPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (profile) { setDisplayName(profile.display_name); setBio(profile.bio || ""); }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase.from("quiz_attempts").select("percentage").eq("user_id", user.id).eq("status", "completed")
      .then(({ data }) => {
        const attempts = data || [];
        setStats({
          attempts: attempts.length,
          avgScore: attempts.length ? Math.round(attempts.reduce((s, a) => s + Number(a.percentage), 0) / attempts.length) : 0,
          rank: "—"
        });
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ display_name: displayName, bio }).eq("user_id", user.id);
    toast({ title: "Profile updated!" });
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) { toast({ title: "Password must be 6+ characters", variant: "destructive" }); return; }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Password updated!" }); setNewPassword(""); }
    setChangingPw(false);
  };

  return (
    <AppLayout>
      <PageHeader title="Profile" description="Manage your account settings" />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="space-y-4">
          <StatCard title="Quizzes Taken" value={stats.attempts} icon={History} />
          <StatCard title="Average Score" value={`${stats.avgScore}%`} icon={Target} delay={0.1} />
          <StatCard title="Rank" value={stats.rank} icon={Trophy} delay={0.2} />
        </div>

        {/* Profile form */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-xl p-6">
            <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Profile Info</h2>
            <div className="space-y-4">
              <div><Label>Display Name</Label><Input value={displayName} onChange={e => setDisplayName(e.target.value)} /></div>
              <div><Label>Bio</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} /></div>
              <div><Label>Email</Label><Input value={user?.email || ""} disabled /></div>
              <Button onClick={handleSave} disabled={saving} className="gradient-bg text-primary-foreground">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Changes
              </Button>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6">
            <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> Change Password</h2>
            <div className="space-y-4">
              <div><Label>New Password</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" /></div>
              <Button onClick={handlePasswordChange} disabled={changingPw} variant="outline">
                {changingPw && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Update Password
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
