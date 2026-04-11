import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, FileQuestion, Layers, History,
  Trophy, Megaphone, User, GraduationCap, LogOut,
  Users, BarChart3, ChevronLeft, ChevronRight, Menu, PlusCircle, DollarSign, Globe
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const userLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/quizzes", label: "Browse Quizzes", icon: Globe },
  { to: "/courses", label: "Take Quiz", icon: BookOpen },
  { to: "/flashcards", label: "Flashcards", icon: Layers },
  { to: "/history", label: "History", icon: History },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/announcements", label: "Announcements", icon: Megaphone },
];

const creatorLinks = [
  { to: "/creator", label: "My Quizzes", icon: FileQuestion },
  { to: "/creator/new", label: "Create Quiz", icon: PlusCircle },
  { to: "/creator/earnings", label: "Earnings", icon: DollarSign },
];

const adminLinks = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/courses", label: "Courses", icon: BookOpen },
  { to: "/admin/quiz-sets", label: "Quiz Sets", icon: FileQuestion },
  { to: "/admin/questions", label: "Questions", icon: GraduationCap },
  { to: "/admin/flashcards", label: "Flashcards", icon: Layers },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/attempts", label: "Attempts", icon: History },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isAdmin, profile, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdminRoute = pathname.startsWith("/admin");
  const isCreatorRoute = pathname.startsWith("/creator");

  let links = userLinks;
  if (isAdminRoute) links = adminLinks;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0 cursor-pointer" onClick={() => navigate("/")}>
          <GraduationCap className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
            <h1 className="font-heading font-bold text-lg text-sidebar-foreground">QuizMaster</h1>
            <p className="text-xs text-sidebar-muted">{isAdminRoute ? "Admin Panel" : "Quiz Platform"}</p>
          </motion.div>
        )}
      </div>

      {/* Mode Switch */}
      {isAdmin && !collapsed && (
        <div className="px-3 py-3">
          <div className="flex rounded-lg bg-sidebar-accent p-1">
            <button onClick={() => navigate("/dashboard")}
              className={cn("flex-1 text-xs py-1.5 rounded-md transition-all font-medium",
                !isAdminRoute && !isCreatorRoute ? "bg-primary text-primary-foreground shadow-sm" : "text-sidebar-muted hover:text-sidebar-foreground"
              )}>Student</button>
            <button onClick={() => navigate("/admin")}
              className={cn("flex-1 text-xs py-1.5 rounded-md transition-all font-medium",
                isAdminRoute ? "bg-primary text-primary-foreground shadow-sm" : "text-sidebar-muted hover:text-sidebar-foreground"
              )}>Admin</button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const active = pathname === link.to;
          return (
            <motion.button key={link.to} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
              onClick={() => { navigate(link.to); setMobileOpen(false); }}
              className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                active ? "bg-primary/15 text-primary font-semibold" : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}>
              <link.icon className={cn("w-5 h-5 flex-shrink-0", active && "text-primary")} />
              {!collapsed && <span>{link.label}</span>}
              {active && !collapsed && <motion.div layoutId="sidebar-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </motion.button>
          );
        })}

        {/* Creator section */}
        {!isAdminRoute && (
          <>
            {!collapsed && <div className="pt-4 pb-1 px-3 text-xs font-semibold text-sidebar-muted uppercase tracking-wider">Creator</div>}
            {creatorLinks.map((link) => {
              const active = pathname === link.to;
              return (
                <motion.button key={link.to} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { navigate(link.to); setMobileOpen(false); }}
                  className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                    active ? "bg-primary/15 text-primary font-semibold" : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}>
                  <link.icon className={cn("w-5 h-5 flex-shrink-0", active && "text-primary")} />
                  {!collapsed && <span>{link.label}</span>}
                </motion.button>
              );
            })}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="px-3 py-3 border-t border-sidebar-border space-y-2">
        {!collapsed && (
          <button onClick={() => { navigate("/profile"); setMobileOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-all">
            <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-primary-foreground">
              {profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-sm font-medium truncate text-sidebar-foreground">{profile?.display_name || "User"}</p>
              <p className="text-xs text-sidebar-muted">{isAdmin ? "Admin" : "Creator"}</p>
            </div>
          </button>
        )}
        <button onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-muted hover:bg-sidebar-accent hover:text-destructive transition-all">
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center py-3 border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground transition-colors">
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <>
      <Button variant="ghost" size="icon" className="fixed top-3 left-3 z-50 lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
        <Menu className="w-5 h-5" />
      </Button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] z-50 lg:hidden shadow-2xl">
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      <motion.aside animate={{ width: collapsed ? 72 : 260 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="hidden lg:block h-screen sticky top-0 flex-shrink-0">
        <SidebarContent />
      </motion.aside>
    </>
  );
}
