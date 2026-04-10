import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GraduationCap, BookOpen, Trophy, Zap, ChevronRight, Star, Users, Target, Brain, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

const features = [
  { icon: BookOpen, title: "Rich Course Content", desc: "Structured quizzes with detailed explanations for every answer." },
  { icon: Trophy, title: "Live Leaderboards", desc: "Compete with peers and track your ranking in real-time." },
  { icon: Zap, title: "Smart Flashcards", desc: "Flip-based study cards to reinforce your knowledge." },
  { icon: Target, title: "Performance Analytics", desc: "Track progress, identify weaknesses, and improve scores." },
  { icon: Brain, title: "Adaptive Quizzes", desc: "Choose how many questions you want and get a randomized experience every time." },
  { icon: BarChart3, title: "Detailed History", desc: "Review every past attempt with full explanations and scoring breakdowns." },
];

const stats = [
  { value: "500+", label: "Questions" },
  { value: "Multiple", label: "Courses" },
  { value: "Real-time", label: "Leaderboard" },
  { value: "24/7", label: "Access" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg">QuizMaster</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button onClick={() => navigate("/dashboard")} className="gradient-bg text-primary-foreground">Go to Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>Sign In</Button>
                <Button onClick={() => navigate("/auth")} className="gradient-bg text-primary-foreground">Get Started</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Star className="w-3.5 h-3.5" /> New Courses Available
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold leading-tight mb-6">
            Master Your Courses with <span className="gradient-text">QuizMaster</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            The premium quiz platform built for university students. Take timed quizzes, study with flashcards, track your performance, and compete on leaderboards — across all your courses.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/auth")} className="gradient-bg text-primary-foreground px-8 h-12 text-base font-semibold">
              Start Learning <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="h-12 px-8 text-base">
              View Courses
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {stats.map((stat, i) => (
            <div key={i} className="text-center p-4 rounded-xl glass-card">
              <p className="text-2xl font-heading font-bold gradient-text">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl font-heading font-bold mb-3">Everything You Need to Succeed</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Designed for serious learners who want to ace their courses.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-xl p-6 hover-lift group"
              >
                <div className="w-12 h-12 rounded-lg gradient-bg-subtle flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="max-w-4xl mx-auto text-center gradient-bg rounded-2xl p-12">
          <h2 className="text-3xl font-heading font-bold text-primary-foreground mb-4">Ready to Start Learning?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">Join your classmates on QuizMaster and start preparing for your exams today.</p>
          <Button size="lg" onClick={() => navigate("/auth")} className="bg-primary-foreground text-primary font-semibold h-12 px-8 hover:bg-primary-foreground/90">
            <Users className="w-4 h-4 mr-2" /> Create Free Account
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <GraduationCap className="w-4 h-4" /> <span className="font-heading font-semibold text-foreground">QuizMaster</span>
        </div>
        <p>© {new Date().getFullYear()} QuizMaster. Built for university students.</p>
      </footer>
    </div>
  );
}
