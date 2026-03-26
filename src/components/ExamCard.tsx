import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, MapPin, Calendar } from "lucide-react";
import { Exam, getNextDeadline } from "@/data/exams";
import CountdownRing from "./CountdownRing";

interface Props {
  exam: Exam;
  index?: number;
}

const levelBadge: Record<string, string> = {
  national: "badge-info",
  state: "badge-warning",
  university: "badge-success",
};

export default function ExamCard({ exam, index = 0 }: Props) {
  const next = getNextDeadline(exam);
  const days = next?.days ?? 999;
  const isUrgent = days <= 7;
  const isWarning = days <= 30;
  const urgencyClass = isUrgent ? 'urgency-red' : isWarning ? 'urgency-amber' : 'urgency-green';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
    >
      <Link to={`/exams/${exam.id}`} className={`block glass-card p-5 group hover:border-primary/30 transition-all duration-300 ${urgencyClass}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
              {exam.shortName}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{exam.conductingBody}</p>
          </div>
          <div className="flex items-center gap-2">
            {next && <CountdownRing days={days} maxDays={90} size={40} />}
            <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </div>
        </div>

        {/* Tags row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={levelBadge[exam.level] || "badge-info"}>
            {exam.level}
          </span>
          {next && (
            <span className={`text-xs font-bold uppercase tracking-wide ${
              isUrgent ? 'text-destructive' : isWarning ? 'text-primary' : 'text-success'
            }`}>
              {isUrgent ? '🔴' : isWarning ? '🟡' : '🟢'} {days <= 0 ? 'TODAY!' : `${days}D LEFT`}
            </span>
          )}
        </div>

        {/* Info chips */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {exam.states[0]}
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            {Math.round(exam.confidenceScore * 100)}%
          </span>
        </div>

        {/* Deadline */}
        {next && (
          <div className="pt-3 border-t border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {next.label}
              </div>
              <span className="text-sm font-semibold text-foreground">
                {next.date ? new Date(next.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'TBA'}
              </span>
            </div>
          </div>
        )}
      </Link>
    </motion.div>
  );
}
