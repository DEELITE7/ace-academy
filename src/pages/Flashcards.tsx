import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, RotateCcw, Shuffle, ChevronLeft, ChevronRight, Check, X, BookOpen } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { cn } from "@/lib/utils";

export default function FlashcardsPage() {
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [studyMode, setStudyMode] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("courses").select("id, title, code"),
      supabase.from("flashcards").select("*"),
    ]).then(([coursesRes, cardsRes]) => {
      setCourses(coursesRes.data || []);
      setFlashcards(cardsRes.data || []);
      setLoading(false);
    });
  }, []);

  const filtered = selectedCourse === "all" ? flashcards : flashcards.filter(f => f.course_id === selectedCourse);
  const current = filtered[currentIdx];

  const shuffle = () => {
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    setFlashcards(prev => {
      const others = prev.filter(f => selectedCourse !== "all" ? f.course_id !== selectedCourse : false);
      return [...others, ...shuffled];
    });
    setCurrentIdx(0);
    setFlipped(false);
  };

  const next = () => { setCurrentIdx(i => Math.min(i + 1, filtered.length - 1)); setFlipped(false); };
  const prev = () => { setCurrentIdx(i => Math.max(i - 1, 0)); setFlipped(false); };

  if (!studyMode) {
    return (
      <AppLayout>
        <PageHeader title="Flashcards" description="Study with interactive flashcards" />
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>
        ) : flashcards.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-xl">
            <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No flashcards available</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.filter(c => flashcards.some(f => f.course_id === c.id)).map((course, i) => {
                const count = flashcards.filter(f => f.course_id === course.id).length;
                return (
                  <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="glass-card rounded-xl p-5 hover-lift cursor-pointer"
                    onClick={() => { setSelectedCourse(course.id); setStudyMode(true); setCurrentIdx(0); setFlipped(false); }}>
                    <div className="w-10 h-10 rounded-lg gradient-bg-subtle flex items-center justify-center mb-3">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-heading font-semibold">{course.code}</h3>
                    <p className="text-sm text-muted-foreground">{count} flashcards</p>
                    <Button size="sm" className="mt-3 gradient-bg text-primary-foreground">Study Now</Button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader title="Flashcard Study" description={`${currentIdx + 1} of ${filtered.length} · ${known.size} known`}>
        <Button variant="outline" size="sm" onClick={() => setStudyMode(false)}>Exit Study</Button>
      </PageHeader>

      <div className="max-w-lg mx-auto">
        {/* Progress */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-6">
          <motion.div className="h-full gradient-bg rounded-full" animate={{ width: `${((currentIdx + 1) / filtered.length) * 100}%` }} />
        </div>

        {/* Card */}
        {current && (
          <motion.div
            className="relative h-72 cursor-pointer perspective-1000"
            onClick={() => setFlipped(!flipped)}
            whileTap={{ scale: 0.98 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={flipped ? "back" : "front"}
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={cn("absolute inset-0 glass-card rounded-2xl p-8 flex flex-col items-center justify-center text-center",
                  flipped ? "gradient-bg-subtle" : ""
                )}
              >
                <span className="text-xs text-muted-foreground mb-3">{flipped ? "Answer" : "Question"}</span>
                <p className="text-lg font-medium">{flipped ? current.back_text : current.front_text}</p>
                {flipped && current.explanation && (
                  <p className="text-sm text-muted-foreground mt-4">{current.explanation}</p>
                )}
                <p className="text-xs text-muted-foreground mt-4">Tap to flip</p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between mt-6">
          <Button variant="ghost" onClick={prev} disabled={currentIdx === 0}><ChevronLeft className="w-5 h-5" /></Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              if (current) { const n = new Set(known); n.has(current.id) ? n.delete(current.id) : n.add(current.id); setKnown(n); }
            }}>
              {current && known.has(current.id) ? <Check className="w-4 h-4 text-success mr-1" /> : <X className="w-4 h-4 mr-1" />}
              {current && known.has(current.id) ? "Known" : "Unknown"}
            </Button>
            <Button variant="outline" size="sm" onClick={shuffle}><Shuffle className="w-4 h-4" /></Button>
          </div>
          <Button variant="ghost" onClick={next} disabled={currentIdx >= filtered.length - 1}><ChevronRight className="w-5 h-5" /></Button>
        </div>
      </div>
    </AppLayout>
  );
}
