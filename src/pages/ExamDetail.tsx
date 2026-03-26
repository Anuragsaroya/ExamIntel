import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Shield, CheckCircle2, Circle, AlertCircle, MapPin, Calendar, BookOpen, Clock } from "lucide-react";
import { getDaysUntil } from "@/data/exams";
import { useExamData } from "@/hooks/useExamData";
import CountdownTimer from "@/components/CountdownTimer";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";

export default function ExamDetail() {
  const { id } = useParams();
  const { exams } = useExamData();
  const exam = exams.find((e) => e.id === id);

  if (!exam) {
    return (
      <AppLayout>
        <div className="py-20 text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">Exam not found</h1>
          <Link to="/exams" className="text-primary text-sm hover:underline">← Back to exams</Link>
        </div>
      </AppLayout>
    );
  }

  const confidenceColor = exam.confidenceScore >= 0.9 ? "text-[hsl(var(--success))]" : exam.confidenceScore >= 0.8 ? "text-[hsl(var(--warning))]" : "text-destructive";

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Link to="/exams" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Exams
        </Link>

        {/* Header - full width */}
        <div className="glass-card p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{exam.shortName}</h1>
                <span className="badge-info text-xs">{exam.level}</span>
              </div>
              <p className="text-muted-foreground">{exam.name}</p>
              <p className="text-sm text-muted-foreground mt-1">by {exam.conductingBody}</p>
            </div>
            <div className="flex items-center gap-8 flex-shrink-0">
              <div className="text-center">
                <div className={`text-3xl font-bold font-mono ${confidenceColor}`}>{Math.round(exam.confidenceScore * 100)}%</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 justify-center mt-1"><Shield className="w-3.5 h-3.5" /> Confidence</div>
              </div>
              {exam.examDate && (
                <div className="text-center">
                  <CountdownTimer targetDate={exam.examDate} />
                  <p className="text-xs text-muted-foreground mt-1.5">Until Exam</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main grid — 3 columns on large screens */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Timeline — spans 1 col */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Timeline
            </h2>
            <div className="space-y-0">
              {exam.timeline.map((t, i) => {
                const days = t.date ? getDaysUntil(t.date) : null;
                const icon = t.status === "completed" ? <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success))]" /> : t.status === "active" ? <AlertCircle className="w-5 h-5 text-[hsl(var(--warning))]" /> : <Circle className="w-5 h-5 text-border" />;
                return (
                  <div key={t.label} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      {icon}
                      {i < exam.timeline.length - 1 && <div className={`w-px flex-1 my-1 ${t.status === "completed" ? "bg-[hsl(var(--success)/.3)]" : "bg-border"}`} />}
                    </div>
                    <div className="pb-6">
                      <p className="font-medium text-foreground text-sm">{t.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.date || "TBA"}
                        {days !== null && days > 0 && t.status !== "completed" && <span className="ml-2 text-primary font-medium">({days}d away)</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details — spans 1 col */}
          <div className="space-y-5">
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet" /> Details
              </h3>
              <dl className="space-y-4 text-sm">
                <div className="p-3 rounded-xl bg-background border border-border/60">
                  <dt className="text-muted-foreground text-xs font-medium mb-1">Eligibility</dt>
                  <dd className="text-foreground">{exam.eligibility}</dd>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border/60">
                  <dt className="text-muted-foreground text-xs font-medium mb-1">Fee</dt>
                  <dd className="text-foreground">{exam.applicationFee}</dd>
                </div>
                <div className="p-3 rounded-xl bg-background border border-border/60">
                  <dt className="text-muted-foreground text-xs font-medium mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> States</dt>
                  <dd className="text-foreground">{exam.states.join(", ")}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Sources, Tags, About — spans 1 col */}
          <div className="space-y-5">
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-teal" /> Sources
              </h3>
              <div className="space-y-2">
                {exam.sourceUrls.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline p-2 rounded-lg hover:bg-primary/5 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />{new URL(url).hostname}
                  </a>
                ))}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">{exam.tags.map((tag) => <span key={tag} className="badge-info">{tag}</span>)}</div>
            </div>

            <a href={exam.officialWebsite} target="_blank" rel="noopener noreferrer">
              <Button className="w-full rounded-xl" variant="outline" size="sm">
                Official Website <ExternalLink className="w-3.5 h-3.5 ml-2" />
              </Button>
            </a>
          </div>
        </div>

        {/* About — full width */}
        <div className="glass-card p-6 mt-6">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> About
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{exam.description}</p>
        </div>
      </motion.div>
    </AppLayout>
  );
}
