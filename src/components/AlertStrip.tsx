import { Link } from "react-router-dom";
import { AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { useExamData } from "@/hooks/useExamData";
import { getNextDeadline } from "@/data/exams";

export default function AlertStrip() {
  const { exams } = useExamData();

  const nearest = exams
    .map((e) => ({ exam: e, next: getNextDeadline(e) }))
    .filter((e) => e.next && e.next.days >= 0)
    .sort((a, b) => a.next!.days - b.next!.days)[0];

  if (!nearest?.next) return null;

  const isUrgent = nearest.next.days <= 7;

  return (
    <div className="alert-strip px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {isUrgent && <AlertTriangle className="w-4 h-4" />}
          <span className="text-sm font-semibold">
            <span className="font-bold">{nearest.exam.shortName}</span>
            {' '}{nearest.next.label} —
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm font-bold">
            <Clock className="w-3.5 h-3.5" />
            {nearest.next.days}d left
          </div>
          <Link to={`/exams/${nearest.exam.id}`} className="flex items-center gap-0.5 text-sm font-bold underline underline-offset-2 hover:opacity-80 transition-opacity">
            Register Now <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
