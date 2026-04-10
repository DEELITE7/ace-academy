import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Save, Plus, Trash2, ChevronLeft, GraduationCap, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface QuestionDraft {
  id?: string;
  question_text: string;
  explanation: string;
  options: { option_label: string; option_text: string; is_correct: boolean }[];
}

export default function QuizBuilder() {
  const { quizId } = useParams();
  const isEdit = !!quizId;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [courses, setCourses] = useState<any[]>([]);

  // Quiz fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [instructions, setInstructions] = useState("");
  const [timeLimit, setTimeLimit] = useState<number | "">("");
  const [passingScore, setPassingScore] = useState(50);
  const [randomizeQ, setRandomizeQ] = useState(true);
  const [randomizeO, setRandomizeO] = useState(true);
  const [showExplanations, setShowExplanations] = useState(true);
  const [isMonetized, setIsMonetized] = useState(false);
  const [price, setPrice] = useState<number | "">("");
  const [tags, setTags] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  // Questions
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);

  useEffect(() => {
    supabase.from("courses").select("id, title, code").then(({ data }) => setCourses(data || []));
  }, []);

  useEffect(() => {
    if (!isEdit || !user) return;
    const load = async () => {
      const { data: quiz } = await supabase.from("quiz_sets").select("*").eq("id", quizId).eq("creator_id", user.id).single();
      if (!quiz) { navigate("/creator"); return; }
      setTitle(quiz.title);
      setDescription(quiz.description || "");
      setCourseId(quiz.course_id);
      setDifficulty(quiz.difficulty || "medium");
      setInstructions(quiz.instructions || "");
      setTimeLimit(quiz.time_limit_minutes || "");
      setPassingScore(quiz.passing_score || 50);
      setRandomizeQ(quiz.randomize_questions ?? true);
      setRandomizeO(quiz.randomize_options ?? true);
      setShowExplanations(quiz.show_explanations ?? true);
      setIsMonetized(quiz.is_monetized || false);
      setPrice(quiz.price_amount || "");
      setTags((quiz.tags || []).join(", "));
      setThumbnailUrl(quiz.thumbnail_url || "");

      // Load questions
      const { data: qs } = await supabase.from("questions").select("*, question_options(*)").eq("quiz_set_id", quizId).order("order_index");
      if (qs) {
        setQuestions(qs.map(q => ({
          id: q.id,
          question_text: q.question_text,
          explanation: q.explanation || "",
          options: (q.question_options || []).map((o: any) => ({
            option_label: o.option_label,
            option_text: o.option_text,
            is_correct: o.is_correct,
          })),
        })));
      }
      setLoading(false);
    };
    load();
  }, [quizId, user]);

  const addQuestion = () => {
    setQuestions(prev => [...prev, {
      question_text: "",
      explanation: "",
      options: [
        { option_label: "A", option_text: "", is_correct: true },
        { option_label: "B", option_text: "", is_correct: false },
        { option_label: "C", option_text: "", is_correct: false },
        { option_label: "D", option_text: "", is_correct: false },
      ],
    }]);
  };

  const removeQuestion = (idx: number) => setQuestions(prev => prev.filter((_, i) => i !== idx));

  const updateQuestion = (idx: number, field: string, value: any) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateOption = (qIdx: number, oIdx: number, field: string, value: any) => {
    setQuestions(prev => prev.map((q, qi) => qi === qIdx ? {
      ...q,
      options: q.options.map((o, oi) => {
        if (field === "is_correct" && value === true) {
          return oi === oIdx ? { ...o, is_correct: true } : { ...o, is_correct: false };
        }
        return oi === oIdx ? { ...o, [field]: value } : o;
      }),
    } : q));
  };

  const handleSave = async (publish = false) => {
    if (!user) return;
    if (!title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    if (!courseId) { toast({ title: "Select a course", variant: "destructive" }); return; }

    setSaving(true);
    const tagArr = tags.split(",").map(t => t.trim()).filter(Boolean);
    const quizData = {
      title: title.trim(),
      description: description.trim() || null,
      course_id: courseId,
      creator_id: user.id,
      difficulty,
      instructions: instructions.trim() || null,
      time_limit_minutes: timeLimit || null,
      passing_score: passingScore,
      randomize_questions: randomizeQ,
      randomize_options: randomizeO,
      show_explanations: showExplanations,
      is_monetized: isMonetized,
      price_amount: isMonetized ? (price || 0) : 0,
      tags: tagArr,
      thumbnail_url: thumbnailUrl.trim() || null,
      status: publish ? "published" : "draft",
      is_visible: publish,
    };

    try {
      let savedQuizId = quizId;

      if (isEdit) {
        await supabase.from("quiz_sets").update(quizData).eq("id", quizId);
        // Delete old questions
        await supabase.from("questions").delete().eq("quiz_set_id", quizId);
      } else {
        const { data, error } = await supabase.from("quiz_sets").insert(quizData).select().single();
        if (error) throw error;
        savedQuizId = data.id;
      }

      // Insert questions
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.question_text.trim()) continue;
        const { data: qData, error: qErr } = await supabase.from("questions").insert({
          quiz_set_id: savedQuizId!,
          question_text: q.question_text.trim(),
          explanation: q.explanation.trim() || null,
          order_index: i,
          difficulty,
        }).select().single();
        if (qErr) throw qErr;

        // Insert options
        const opts = q.options.filter(o => o.option_text.trim()).map(o => ({
          question_id: qData.id,
          option_label: o.option_label,
          option_text: o.option_text.trim(),
          is_correct: o.is_correct,
        }));
        if (opts.length > 0) {
          const { error: oErr } = await supabase.from("question_options").insert(opts);
          if (oErr) throw oErr;
        }
      }

      toast({ title: publish ? "Quiz published!" : "Quiz saved as draft" });
      navigate("/creator");
    } catch (err: any) {
      toast({ title: "Error saving quiz", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AppLayout><PageSkeleton /></AppLayout>;

  return (
    <AppLayout>
      <PageHeader title={isEdit ? "Edit Quiz" : "Create Quiz"} description="Build your quiz and add questions">
        <Button variant="outline" onClick={() => navigate("/creator")}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
      </PageHeader>

      <div className="max-w-3xl space-y-6">
        {/* Quiz metadata */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-heading font-semibold text-lg">Quiz Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Quiz title" /></div>
            <div className="sm:col-span-2"><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your quiz" rows={2} /></div>
            <div>
              <Label>Course *</Label>
              <select className="w-full h-10 px-3 border border-input bg-background rounded-md text-sm" value={courseId} onChange={e => setCourseId(e.target.value)}>
                <option value="">Select course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code} – {c.title}</option>)}
              </select>
            </div>
            <div>
              <Label>Difficulty</Label>
              <select className="w-full h-10 px-3 border border-input bg-background rounded-md text-sm" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div><Label>Time Limit (minutes)</Label><Input type="number" value={timeLimit} onChange={e => setTimeLimit(parseInt(e.target.value) || "")} placeholder="No limit" /></div>
            <div><Label>Passing Score (%)</Label><Input type="number" min={0} max={100} value={passingScore} onChange={e => setPassingScore(parseInt(e.target.value) || 50)} /></div>
            <div className="sm:col-span-2"><Label>Tags (comma separated)</Label><Input value={tags} onChange={e => setTags(e.target.value)} placeholder="math, algebra, exam prep" /></div>
            <div className="sm:col-span-2"><Label>Thumbnail URL</Label><Input value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} placeholder="https://..." /></div>
            <div className="sm:col-span-2"><Label>Instructions</Label><Textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={2} placeholder="Instructions for quiz takers" /></div>
          </div>

          {/* Toggles */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label>Randomize Questions</Label><Switch checked={randomizeQ} onCheckedChange={setRandomizeQ} />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label>Randomize Options</Label><Switch checked={randomizeO} onCheckedChange={setRandomizeO} />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label>Show Explanations</Label><Switch checked={showExplanations} onCheckedChange={setShowExplanations} />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label>Monetized (Paid)</Label><Switch checked={isMonetized} onCheckedChange={setIsMonetized} />
            </div>
          </div>

          {isMonetized && (
            <div className="grid gap-4 sm:grid-cols-2 p-4 border border-warning/30 rounded-lg bg-warning/5">
              <div><Label>Price (USD)</Label><Input type="number" min={0} step={0.01} value={price} onChange={e => setPrice(parseFloat(e.target.value) || "")} placeholder="0.00" /></div>
              <div className="flex items-end">
                <p className="text-xs text-muted-foreground">Revenue split: 70% to you, 30% to platform.</p>
              </div>
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-lg">Questions ({questions.length})</h2>
            <Button size="sm" onClick={addQuestion}><Plus className="w-4 h-4 mr-1" /> Add Question</Button>
          </div>

          {questions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No questions yet. Add your first question above.</p>
            </div>
          )}

          {questions.map((q, qi) => (
            <motion.div key={qi} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-heading font-semibold">Question {qi + 1}</span>
                <Button variant="ghost" size="icon" onClick={() => removeQuestion(qi)} className="text-destructive h-7 w-7">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <Textarea value={q.question_text} onChange={e => updateQuestion(qi, "question_text", e.target.value)} placeholder="Enter question text" rows={2} />
              <div className="space-y-2">
                {q.options.map((o, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input type="radio" name={`correct-${qi}`} checked={o.is_correct} onChange={() => updateOption(qi, oi, "is_correct", true)} className="accent-primary" />
                    <span className="text-sm font-bold w-6">{o.option_label}.</span>
                    <Input value={o.option_text} onChange={e => updateOption(qi, oi, "option_text", e.target.value)} placeholder={`Option ${o.option_label}`} className="flex-1" />
                  </div>
                ))}
              </div>
              <div>
                <Label className="text-xs">Explanation (optional)</Label>
                <Input value={q.explanation} onChange={e => updateQuestion(qi, "explanation", e.target.value)} placeholder="Why is this the correct answer?" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving} className="flex-1">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" /> Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving} className="flex-1 gradient-bg text-primary-foreground">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Publish Quiz
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

function PageSkeleton() {
  return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}</div>;
}
