import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Filter, GraduationCap, Clock, Users, Star, DollarSign, ChevronRight, Tag, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/ui/loading-skeleton";
import { useAuth } from "@/lib/auth";

export default function QuizMarketplace() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    pricing: "all" as "all" | "free" | "paid",
    difficulty: "all" as string,
    sort: "newest" as "newest" | "popular" | "title",
  });

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = supabase
        .from("quiz_sets")
        .select("*, courses(title, code), profiles!quiz_sets_creator_id_fkey(display_name), questions(id)")
        .eq("status", "published")
        .eq("is_visible", true);

      if (filters.pricing === "free") query = query.eq("is_monetized", false);
      if (filters.pricing === "paid") query = query.eq("is_monetized", true);
      if (filters.difficulty !== "all") query = query.eq("difficulty", filters.difficulty);

      if (filters.sort === "newest") query = query.order("created_at", { ascending: false });
      else if (filters.sort === "popular") query = query.order("total_plays", { ascending: false });
      else query = query.order("title");

      const { data } = await query.limit(50);
      setQuizzes(data || []);
      setLoading(false);
    };
    load();
  }, [filters]);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return quizzes;
    const s = debouncedSearch.toLowerCase();
    return quizzes.filter(q =>
      q.title?.toLowerCase().includes(s) ||
      q.description?.toLowerCase().includes(s) ||
      q.public_quiz_code?.toLowerCase().includes(s) ||
      q.courses?.title?.toLowerCase().includes(s) ||
      q.profiles?.display_name?.toLowerCase().includes(s) ||
      q.tags?.some((t: string) => t.toLowerCase().includes(s))
    );
  }, [quizzes, debouncedSearch]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg">QuizMaster</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button onClick={() => navigate("/dashboard")} className="gradient-bg text-primary-foreground">Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>Sign In</Button>
                <Button onClick={() => navigate("/auth")} className="gradient-bg text-primary-foreground">Get Started</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold mb-3">Explore Quizzes</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Browse thousands of quizzes created by the community. Search by title, code, or category.</p>
        </motion.div>

        {/* Search bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search quizzes by title, code, creator, or tags..."
              className="pl-12 pr-12 h-12 text-base rounded-xl"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setFilterOpen(!filterOpen)}>
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Filters */}
          {filterOpen && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 glass-card rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-medium text-muted-foreground mr-2 self-center">Pricing:</span>
                {(["all", "free", "paid"] as const).map(p => (
                  <Button key={p} size="sm" variant={filters.pricing === p ? "default" : "outline"} onClick={() => setFilters(f => ({ ...f, pricing: p }))}>
                    {p === "all" ? "All" : p === "free" ? "Free" : "Paid"}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-medium text-muted-foreground mr-2 self-center">Difficulty:</span>
                {["all", "easy", "medium", "hard"].map(d => (
                  <Button key={d} size="sm" variant={filters.difficulty === d ? "default" : "outline"} onClick={() => setFilters(f => ({ ...f, difficulty: d }))}>
                    {d === "all" ? "All" : d.charAt(0).toUpperCase() + d.slice(1)}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-medium text-muted-foreground mr-2 self-center">Sort:</span>
                {([["newest", "Newest"], ["popular", "Most Popular"], ["title", "A-Z"]] as const).map(([v, l]) => (
                  <Button key={v} size="sm" variant={filters.sort === v ? "default" : "outline"} onClick={() => setFilters(f => ({ ...f, sort: v as any }))}>
                    {l}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No quizzes found</p>
            <p className="text-muted-foreground">Try a different search or filter.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((quiz, i) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl overflow-hidden hover-lift cursor-pointer group"
                onClick={() => navigate(`/quizzes/${quiz.id}`)}
              >
                <div className="h-28 gradient-bg relative overflow-hidden">
                  {quiz.thumbnail_url && <img src={quiz.thumbnail_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    {quiz.is_monetized ? (
                      <Badge className="bg-warning text-warning-foreground text-xs"><DollarSign className="w-3 h-3 mr-0.5" />{Number(quiz.price_amount).toFixed(2)}</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Free</Badge>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary-foreground/20 text-primary-foreground font-mono">{quiz.public_quiz_code}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-heading font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-1">{quiz.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{quiz.description || "No description"}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{quiz.total_plays} plays</span>
                    <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />{quiz.questions?.length || 0} Q</span>
                    {quiz.time_limit_minutes && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{quiz.time_limit_minutes}m</span>}
                  </div>
                  {quiz.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {quiz.tags.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">by {quiz.profiles?.display_name || "Unknown"}</span>
                    <Badge variant="outline" className={`text-xs ${
                      quiz.difficulty === 'easy' ? 'border-success/50 text-success' :
                      quiz.difficulty === 'hard' ? 'border-destructive/50 text-destructive' :
                      'border-warning/50 text-warning'
                    }`}>{quiz.difficulty}</Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
