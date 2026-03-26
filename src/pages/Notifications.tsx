import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, AlertTriangle, Clock, CheckCircle2, LogIn } from "lucide-react";
import { getNextDeadline, getUrgencyLevel } from "@/data/exams";
import { useExamData } from "@/hooks/useExamData";
import AppLayout from "@/components/AppLayout";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import ExamSubscriptions from "@/components/ExamSubscriptions";
import { supabase } from "@/integrations/supabase/client";

export default function Notifications() {
  const { user } = useAuth();
  const { exams } = useExamData();
  const [subscribedExams, setSubscribedExams] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("exam_subscriptions")
        .select("exam_id")
        .eq("user_id", user.id);
      if (data) setSubscribedExams(new Set(data.map((d: any) => d.exam_id)));
    };
    load();
  }, [user]);

  // Filter alerts: if user has subscriptions, show only those; otherwise show all
  const allAlerts = exams.map((e) => ({ exam: e, next: getNextDeadline(e) })).filter((e) => e.next).sort((a, b) => a.next!.days - b.next!.days);
  const alerts = user && subscribedExams && subscribedExams.size > 0
    ? allAlerts.filter(a => subscribedExams.has(a.exam.id))
    : allAlerts;

  const alertColors = ["color-card-red", "color-card-amber", "color-card-blue", "color-card-violet", "color-card-emerald", "color-card-teal", "color-card-pink", "color-card-green"];

  return (
    <AppLayout title="Notifications" subtitle="Priority-based deadline alerts">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card color-card-blue p-4 mb-5 flex items-center gap-3"
          >
            <Bell className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[14px] font-medium text-foreground">Sign in to get personalized alerts</p>
              <p className="text-[12px] text-muted-foreground">Create an account to select exams and receive custom notifications.</p>
            </div>
            <Link to="/auth">
              <Button size="sm" className="rounded-xl text-xs h-8">
                <LogIn className="w-3.5 h-3.5 mr-1" /> Sign In
              </Button>
            </Link>
          </motion.div>
        )}

        {/* Exam Subscription Selector — only for logged-in users */}
        {user && (
          <div className="glass-card p-5 mb-6">
            <ExamSubscriptions />
          </div>
        )}

        {/* Show filtered note */}
        {user && subscribedExams && subscribedExams.size > 0 && (
          <p className="text-xs text-muted-foreground mb-4">
            Showing alerts for {subscribedExams.size} selected exam{subscribedExams.size > 1 ? "s" : ""}. Deselect all to see everything.
          </p>
        )}

        <div className="space-y-2">
          {alerts.map(({ exam, next }, i) => {
            const urgency = getUrgencyLevel(next!.days);
            const icon = urgency === "urgent" ? <AlertTriangle className="w-4 h-4 text-destructive" /> : urgency === "warning" ? <Clock className="w-4 h-4 text-warning" /> : <Bell className="w-4 h-4 text-primary" />;
            const badge = urgency === "urgent" ? "badge-urgent" : urgency === "warning" ? "badge-warning" : "badge-info";
            const colorBorder = alertColors[i % alertColors.length];
            return (
              <motion.div key={exam.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Link to={`/exams/${exam.id}`} className={`glass-card ${colorBorder} p-4 flex items-center gap-4 group hover:border-primary/30`}>
                  <div className="flex-shrink-0">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-foreground text-[14px] group-hover:text-primary transition-colors">{exam.shortName}</span>
                      <span className={badge}>{urgency === "urgent" ? "Urgent" : urgency === "warning" ? "Soon" : "Upcoming"}</span>
                    </div>
                    <p className="text-[12px] text-muted-foreground">{next!.label} — {next!.date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[14px] font-bold font-mono text-foreground">{next!.days <= 0 ? "Today" : `${next!.days}d`}</div>
                    <div className="text-[11px] text-muted-foreground">left</div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
        {alerts.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-[hsl(var(--success))]" />
            <p className="text-[14px]">
              {user && subscribedExams && subscribedExams.size > 0
                ? "No upcoming deadlines for your selected exams!"
                : "No upcoming deadlines. You're all set!"}
            </p>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
