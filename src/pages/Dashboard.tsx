import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CalendarDays, TrendingUp, BookOpen, RefreshCw, Wifi, WifiOff, Target } from "lucide-react";
import { getNextDeadline, getUrgencyLevel } from "@/data/exams";
import ExamCard from "@/components/ExamCard";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { getRecommendations, ExamRecommendation, UserProfile } from "@/lib/recommendations";
import { Link, Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useExamData } from "@/hooks/useExamData";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { exams, isLive, isFetching, lastFetch, refetch } = useExamData();
  const [recommendations, setRecommendations] = useState<ExamRecommendation[]>([]);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (!user) return;
    const loadAndRecommend = async () => {
      let profile: UserProfile = { stream: "pcm", budget: "", states: [], targetBranch: "", percentage: null };
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        profile = { stream: data.stream || "pcm", budget: data.budget || "", states: data.preferred_states || [], targetBranch: data.target_branch || "", percentage: data.percentage ? Number(data.percentage) : null };
        setUserName(data.name || "");
      }
      setRecommendations(getRecommendations(exams, profile));
    };
    loadAndRecommend();
  }, [exams, user]);

  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (authLoading) {
    return (
      <AppLayout title="Dashboard">
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const handleRefresh = async () => {
    await refetch();
    toast({ title: "Data refreshed", description: "Exam data updated from official sources." });
  };

  const urgentExams = exams.map((e) => ({ exam: e, next: getNextDeadline(e) })).filter((e) => e.next && e.next.days <= 7 && e.next.days >= 0).sort((a, b) => a.next!.days - b.next!.days);
  const upcomingExams = exams.map((e) => ({ exam: e, next: getNextDeadline(e) })).filter((e) => e.next && e.next.days > 7).sort((a, b) => a.next!.days - b.next!.days);
  const openRegistrations = exams.filter((e) => e.status === "registration_open" || e.status === "registration_closing");

  const safeRecs = recommendations.filter((r) => r.risk === "safe");
  const moderateRecs = recommendations.filter((r) => r.risk === "moderate");
  const riskyRecs = recommendations.filter((r) => r.risk === "risky");

  const statCards = [
    { icon: BookOpen, label: "Total Exams", value: exams.length, color: "text-primary", bg: "stat-card-blue" },
    { icon: AlertTriangle, label: "Urgent", value: urgentExams.length, color: "text-destructive", bg: "stat-card-red" },
    { icon: CalendarDays, label: "Open Registration", value: openRegistrations.length, color: "text-warning", bg: "stat-card-amber" },
    { icon: TrendingUp, label: "Safe Picks", value: safeRecs.length, color: "text-success", bg: "stat-card-green" },
  ];

  return (
    <AppLayout
      title={`Welcome back, ${userName || user!.email?.split('@')[0]}`}
      subtitle="Your exam intelligence overview"
    >
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Actions */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${isLive ? "text-[hsl(var(--success))] bg-[hsl(var(--success)/.08)] border-[hsl(var(--success)/.2)]" : "text-muted-foreground bg-muted border-border"}`}>
            {isLive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isLive ? "Live" : "Cached"}
          </div>
          <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isFetching} className="text-xs rounded-xl h-8">
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Fetching..." : "Refresh Data"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className={`rounded-2xl border p-5 ${s.bg}`}>
              <div className="flex items-center justify-between mb-3">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className="text-3xl font-bold text-foreground tracking-tight">{s.value}</div>
              <div className="text-[13px] text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* AI Recommendations */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-violet/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-violet" />
            </div>
            <h2 className="text-lg font-bold text-foreground">AI Recommendations</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: "Safe Picks", recs: safeRecs, color: "text-[hsl(var(--success))]", dotColor: "bg-[hsl(var(--success))]", cardBg: "stat-card-green" },
              { title: "Moderate", recs: moderateRecs, color: "text-[hsl(var(--warning))]", dotColor: "bg-[hsl(var(--warning))]", cardBg: "stat-card-amber" },
              { title: "Risky", recs: riskyRecs, color: "text-destructive", dotColor: "bg-destructive", cardBg: "stat-card-red" },
            ].map((cat) => (
              <div key={cat.title} className={`rounded-2xl border p-5 ${cat.cardBg}`}>
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-foreground/5">
                  <div className={`w-2.5 h-2.5 rounded-full ${cat.dotColor}`} />
                  <span className="font-bold text-foreground">{cat.title}</span>
                  <span className="text-sm text-muted-foreground ml-auto font-mono">{cat.recs.length}</span>
                </div>
                <div className="space-y-2.5">
                  {cat.recs.slice(0, 3).map((r) => (
                    <Link key={r.exam.id} to={`/exams/${r.exam.id}`} className="block p-3 rounded-xl bg-background/60 hover:bg-background transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-[14px] text-foreground">{r.exam.shortName}</p>
                        <span className="text-xs font-mono font-bold text-muted-foreground">{r.matchScore}%</span>
                      </div>
                      <p className="text-[12px] text-muted-foreground line-clamp-1">{r.reasons[0]}</p>
                      <div className="mt-2 w-full bg-foreground/5 rounded-full h-1.5">
                        <div className={`${cat.dotColor} h-1.5 rounded-full transition-all`} style={{ width: `${r.matchScore}%` }} />
                      </div>
                    </Link>
                  ))}
                  {cat.recs.length === 0 && (
                    <p className="text-[13px] text-muted-foreground py-4 text-center">Update profile preferences</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Urgent */}
        {urgentExams.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Closing Soon</h2>
              <span className="badge-urgent">{urgentExams.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {urgentExams.map(({ exam }, i) => <ExamCard key={exam.id} exam={exam} index={i} />)}
            </div>
          </div>
        )}

        {/* Upcoming */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Upcoming Deadlines</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...(urgentExams.length === 0 ? urgentExams : []), ...upcomingExams].slice(0, 6).map(({ exam }, i) => <ExamCard key={exam.id} exam={exam} index={i} />)}
            {urgentExams.length === 0 && upcomingExams.length === 0 && <div className="col-span-full text-center py-16 text-muted-foreground">All caught up! No upcoming deadlines. 🎉</div>}
          </div>
        </div>

        {lastFetch && <p className="text-xs text-muted-foreground mt-8 text-center">Last fetched: {new Date(lastFetch).toLocaleString()}</p>}
      </motion.div>
    </AppLayout>
  );
}
