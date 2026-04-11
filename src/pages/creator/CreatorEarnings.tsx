import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Clock, CheckCircle2, Landmark, Save, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/ui/loading-skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function CreatorEarnings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Bank details
  const [bankLoading, setBankLoading] = useState(true);
  const [bankSaving, setBankSaving] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("pending");
  const [hasBankRecord, setHasBankRecord] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Load earnings
    supabase.from("creator_earnings")
      .select("*, quiz_sets(title, public_quiz_code)")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setEarnings(data || []); setLoading(false); });

    // Load bank details
    supabase.from("creator_bank_details")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setAccountName(data.account_name);
          setAccountNumber(data.account_number);
          setBankName(data.bank_name);
          setBankCode(data.bank_code || "");
          setVerificationStatus(data.verification_status);
          setHasBankRecord(true);
        }
        setBankLoading(false);
      });
  }, [user]);

  const saveBankDetails = async () => {
    if (!user) return;
    if (!accountName.trim() || !accountNumber.trim() || !bankName.trim()) {
      toast({ title: "Please fill in all required bank fields", variant: "destructive" });
      return;
    }
    setBankSaving(true);
    const payload = {
      user_id: user.id,
      account_name: accountName.trim(),
      account_number: accountNumber.trim(),
      bank_name: bankName.trim(),
      bank_code: bankCode.trim() || null,
    };
    try {
      if (hasBankRecord) {
        const { error } = await supabase.from("creator_bank_details").update(payload).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("creator_bank_details").insert(payload);
        if (error) throw error;
        setHasBankRecord(true);
      }
      toast({ title: "Bank details saved successfully" });
    } catch (err: any) {
      toast({ title: "Error saving bank details", description: err.message, variant: "destructive" });
    } finally {
      setBankSaving(false);
    }
  };

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

      {/* Bank Details Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl p-6 mb-8 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Landmark className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-semibold text-lg">Payout Bank Details</h2>
          <Badge variant={verificationStatus === "verified" ? "default" : "secondary"} className="ml-auto text-xs">
            {verificationStatus}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">Enter your bank details for withdrawal payouts. Your information is stored securely and only visible to you and platform admins.</p>
        {bankLoading ? (
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Account Name *</Label>
              <Input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="e.g. John Doe" />
            </div>
            <div>
              <Label>Account Number *</Label>
              <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="e.g. 0123456789" />
            </div>
            <div>
              <Label>Bank Name *</Label>
              <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. First Bank" />
            </div>
            <div>
              <Label>Bank Code</Label>
              <Input value={bankCode} onChange={e => setBankCode(e.target.value)} placeholder="e.g. 011 (optional)" />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={saveBankDetails} disabled={bankSaving}>
                {bankSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {hasBankRecord ? "Update Bank Details" : "Save Bank Details"}
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Earnings list */}
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
