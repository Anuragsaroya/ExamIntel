import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useExamData } from "@/hooks/useExamData";
import { getNextDeadline } from "@/data/exams";
import CountdownRing from "./CountdownRing";

export default function ExamTimeline() {
  const { exams } = useExamData();

  const milestones = exams
    .map((e) => ({ exam: e, next: getNextDeadline(e) }))
    .filter((e) => e.next && e.next.days >= 0)
    .sort((a, b) => a.next!.days - b.next!.days)
    .slice(0, 12);

  if (milestones.length === 0) return null;

  return (
    <div className="w-full">
      <h2 className="font-display text-2xl text-foreground mb-4 tracking-wider">
        MISSION TIMELINE
      </h2>
      <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin">
        <div className="flex gap-4" style={{ minWidth: `${milestones.length * 200}px` }}>
          {milestones.map(({ exam, next }, i) => {
            const isUrgent = next!.days <= 7;
            const isWarning = next!.days <= 30;
            const urgencyClass = isUrgent ? 'urgency-red' : isWarning ? 'urgency-amber' : 'urgency-green';

            return (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex-shrink-0 w-[180px]"
              >
                <Link
                  to={`/exams/${exam.id}`}
                  className={`block glass-card p-4 ${urgencyClass} hover:border-primary/30 transition-all group`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <CountdownRing days={next!.days} maxDays={90} size={40} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      isUrgent ? 'text-destructive' : isWarning ? 'text-primary' : 'text-success'
                    }`}>
                      {isUrgent ? '🔴 URGENT' : isWarning ? '🟡 SOON' : '🟢 SAFE'}
                    </span>
                  </div>
                  <h3 className="font-display text-lg text-foreground group-hover:text-primary transition-colors leading-tight">
                    {exam.shortName}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">{next!.label}</p>
                  <p className="text-xs font-mono text-muted-foreground mt-2">
                    {next!.date ? new Date(next!.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'TBA'}
                  </p>
                  {/* Timeline connector */}
                  {i < milestones.length - 1 && (
                    <div className="absolute right-0 top-1/2 w-4 h-px bg-border -mr-4 hidden lg:block" />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
