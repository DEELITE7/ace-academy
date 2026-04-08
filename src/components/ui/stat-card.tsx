import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: number;
  className?: string;
  delay?: number;
}

export function StatCard({ title, value, icon: Icon, description, trend, className, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn("glass-card rounded-xl p-5 hover-lift", className)}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-heading font-bold">{value}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
          {trend !== undefined && (
            <p className={cn("text-xs font-medium", trend >= 0 ? "text-success" : "text-destructive")}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg gradient-bg-subtle flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </motion.div>
  );
}
