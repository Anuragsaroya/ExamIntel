import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ArrowLeft, Calendar, MapPin, Tag } from "lucide-react";
import { Exam } from "@/data/exams";
import { useExamData } from "@/hooks/useExamData";
import ExamCard from "@/components/ExamCard";
import AppLayout from "@/components/AppLayout";

export default function ExamExplorer() {
  const { exams, dbExams } = useExamData();
  const allStates = Array.from(new Set([
    ...exams.flatMap((e) => e.states),
    ...dbExams.map(e => e.state).filter(Boolean) as string[],
  ])).sort();
  const allLevels: Exam["level"][] = ["national", "state", "university"];
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"deadline" | "name" | "confidence">("deadline");

  const filtered = useMemo(() => {
    let result = exams.filter((e) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || e.name.toLowerCase().includes(q) || e.shortName.toLowerCase().includes(q) || e.tags.some((t) => t.toLowerCase().includes(q));
      const matchesState = stateFilter === "all" || e.states.includes(stateFilter);
      const matchesLevel = levelFilter === "all" || e.level === levelFilter;
      return matchesSearch && matchesState && matchesLevel;
    });
    result.sort((a, b) => {
      if (sortBy === "name") return a.shortName.localeCompare(b.shortName);
      if (sortBy === "confidence") return b.confidenceScore - a.confidenceScore;
      const aDate = a.registrationEnd ? new Date(a.registrationEnd).getTime() : Infinity;
      const bDate = b.registrationEnd ? new Date(b.registrationEnd).getTime() : Infinity;
      return aDate - bDate;
    });
    return result;
  }, [search, stateFilter, levelFilter, sortBy, exams]);

  const filteredDbExams = useMemo(() => {
    return dbExams.filter((e) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || e.exam_name.toLowerCase().includes(q) || e.exam_short.toLowerCase().includes(q);
      const matchesState = stateFilter === "all" || (e.state && e.state === stateFilter);
      return matchesSearch && matchesState;
    });
  }, [search, stateFilter, dbExams]);

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-muted text-muted-foreground";
    switch (status.toLowerCase()) {
      case "open": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "closed": return "bg-destructive/10 text-destructive border-destructive/20";
      case "upcoming": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryColor = (category: string | null) => {
    if (!category) return "bg-muted text-muted-foreground";
    switch (category.toLowerCase()) {
      case "target": return "bg-primary/10 text-primary border-primary/20";
      case "safe": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <h1 className="text-xl font-bold text-foreground">All Exams</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Browse and filter engineering entrance exams</p>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search exams, tags..."
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-background text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 border border-border"
              />
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-background text-sm outline-none cursor-pointer border border-border flex-1 sm:flex-none">
                <option value="all">All States</option>
                {allStates.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="px-3 py-2 rounded-lg bg-background text-sm outline-none cursor-pointer border border-border flex-1 sm:flex-none">
                <option value="all">All Levels</option>
                {allLevels.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-3 py-2 rounded-lg bg-background text-sm outline-none cursor-pointer border border-border flex-1 sm:flex-none">
                <option value="deadline">By Deadline</option>
                <option value="name">By Name</option>
                <option value="confidence">By Confidence</option>
              </select>
            </div>
          </div>
        </div>

        {/* DB Exams from CSV */}
        {filteredDbExams.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Latest Exam Updates ({filteredDbExams.length})
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDbExams.map((exam) => (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border bg-card p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{exam.exam_name}</h3>
                      <p className="text-xs text-muted-foreground font-medium">{exam.exam_short}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(exam.status)}`}>
                      {exam.status || "—"}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {exam.state && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> {exam.state}
                      </div>
                    )}
                    {exam.last_date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> Last Date: <span className="font-mono font-medium text-foreground">{exam.last_date}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {exam.type && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{exam.type}</span>
                      )}
                      {exam.category && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getCategoryColor(exam.category)}`}>
                          {exam.category}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Static Exams */}
        <h2 className="text-lg font-bold text-foreground mb-4">Detailed Exams ({filtered.length})</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((exam, i) => <ExamCard key={exam.id} exam={exam} index={i} />)}
        </div>
        {filtered.length === 0 && filteredDbExams.length === 0 && <div className="text-center py-16 text-muted-foreground text-sm">No exams match your filters.</div>}
      </motion.div>
    </AppLayout>
  );
}
