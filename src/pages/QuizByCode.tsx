import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageSkeleton } from "@/components/ui/loading-skeleton";

export default function QuizByCode() {
  const { quizCode } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quizCode) { navigate("/quizzes"); return; }
    supabase
      .from("quiz_sets")
      .select("id")
      .eq("public_quiz_code", quizCode.toUpperCase())
      .eq("status", "published")
      .maybeSingle()
      .then(({ data }) => {
        if (data) navigate(`/quizzes/${data.id}`, { replace: true });
        else navigate("/quizzes", { replace: true });
        setLoading(false);
      });
  }, [quizCode]);

  if (loading) return <div className="min-h-screen p-8"><PageSkeleton /></div>;
  return null;
}
