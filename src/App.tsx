import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute, AdminRoute } from "@/components/auth/ProtectedRoute";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import QuizTake from "./pages/QuizTake";
import Leaderboard from "./pages/Leaderboard";
import HistoryPage from "./pages/History";
import Flashcards from "./pages/Flashcards";
import Announcements from "./pages/Announcements";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import QuizMarketplace from "./pages/QuizMarketplace";
import QuizDetail from "./pages/QuizDetail";
import QuizByCode from "./pages/QuizByCode";
import CreatorDashboard from "./pages/creator/CreatorDashboard";
import QuizBuilder from "./pages/creator/QuizBuilder";
import CreatorEarnings from "./pages/creator/CreatorEarnings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/quizzes" element={<QuizMarketplace />} />
            <Route path="/quizzes/:quizId" element={<QuizDetail />} />
            <Route path="/q/:quizCode" element={<QuizByCode />} />

            {/* Protected user routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
            <Route path="/courses/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
            <Route path="/quiz/:quizSetId" element={<ProtectedRoute><QuizTake /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
            <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Creator routes */}
            <Route path="/creator" element={<ProtectedRoute><CreatorDashboard /></ProtectedRoute>} />
            <Route path="/creator/new" element={<ProtectedRoute><QuizBuilder /></ProtectedRoute>} />
            <Route path="/creator/edit/:quizId" element={<ProtectedRoute><QuizBuilder /></ProtectedRoute>} />
            <Route path="/creator/earnings" element={<ProtectedRoute><CreatorEarnings /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
