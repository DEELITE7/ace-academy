import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, FileQuestion, Layers, Trophy, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/ui/loading-skeleton";

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("courses").select("*, quiz_sets(id), flashcards(id)").then(({ data }) => {
      setCourses(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <AppLayout>
      <PageHeader title="Take Quiz" description="Browse available quizzes and test your knowledge" />
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">No quizzes available yet</p>
          <p className="text-muted-foreground">Check back soon for new content!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl overflow-hidden hover-lift group cursor-pointer"
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              <div className="h-32 gradient-bg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary-foreground/20 text-primary-foreground font-medium">{course.code}</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-heading font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{course.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{course.description || "No description"}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1"><FileQuestion className="w-3.5 h-3.5" /> {course.quiz_sets?.length || 0} Quiz Sets</span>
                  <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> {course.flashcards?.length || 0} Flashcards</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" className="gradient-bg text-primary-foreground flex-1">Take Quiz <ChevronRight className="w-3.5 h-3.5 ml-1" /></Button>
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/leaderboard?course=${course.id}`); }}>
                    <Trophy className="w-3.5 h-3.5" />
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
