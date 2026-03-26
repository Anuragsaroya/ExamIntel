import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Check, Loader2, ChevronDown, ChevronUp, Search, MapPin, Filter, X } from "lucide-react";
import { useExamData } from "@/hooks/useExamData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function ExamSubscriptions() {
  const { exams } = useExamData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscribed, setSubscribed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const load = async () => {
      const { data } = await supabase
        .from("exam_subscriptions")
        .select("exam_id")
        .eq("user_id", user.id);
      if (data) setSubscribed(new Set(data.map((d: any) => d.exam_id)));
      setLoading(false);
    };
    load();
  }, [user]);

  const toggle = async (examId: string) => {
    if (!user) return;
    setToggling(examId);
    if (subscribed.has(examId)) {
      await supabase.from("exam_subscriptions").delete().eq("user_id", user.id).eq("exam_id", examId);
      setSubscribed((prev) => { const n = new Set(prev); n.delete(examId); return n; });
      toast({ title: "Alert removed" });
    } else {
      await supabase.from("exam_subscriptions").insert({ user_id: user.id, exam_id: examId });
      setSubscribed((prev) => new Set(prev).add(examId));
      toast({ title: "Alert added", description: "You'll get notified about this exam." });
    }
    setToggling(null);
  };

  // Derive unique levels and states for filters
  const levels = useMemo(() => [...new Set(exams.map(e => e.level))], [exams]);
  const states = useMemo(() => {
    const all = new Set<string>();
    exams.forEach(e => e.states.forEach(s => all.add(s)));
    return [...all].sort();
  }, [exams]);

  // Filtered exams
  const filtered = useMemo(() => {
    return exams.filter(e => {
      if (search && !e.shortName.toLowerCase().includes(search.toLowerCase()) && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (levelFilter !== "all" && e.level !== levelFilter) return false;
      if (stateFilter !== "all" && !e.states.includes(stateFilter)) return false;
      return true;
    });
  }, [exams, search, levelFilter, stateFilter]);

  const hasActiveFilters = search || levelFilter !== "all" || stateFilter !== "all";

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div>
      {/* Collapsible Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-1 group"
      >
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Select Exams for Alerts</h3>
          {subscribed.size > 0 && (
            <span className="badge-info">{subscribed.size} selected</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {/* Filters */}
            <div className="pt-4 pb-3 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search exams..."
                  className="w-full bg-muted/50 border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {/* Filter pills */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Level:</span>
                </div>
                <button
                  onClick={() => setLevelFilter("all")}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    levelFilter === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  All
                </button>
                {levels.map(l => (
                  <button
                    key={l}
                    onClick={() => setLevelFilter(l === levelFilter ? "all" : l)}
                    className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-all ${
                      levelFilter === l ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">State:</span>
                </div>
                <select
                  value={stateFilter}
                  onChange={e => setStateFilter(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <option value="all">All States</option>
                  {states.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {hasActiveFilters && (
                  <button
                    onClick={() => { setSearch(""); setLevelFilter("all"); setStateFilter("all"); }}
                    className="text-xs px-3 py-1.5 rounded-full border border-destructive/30 text-destructive hover:bg-destructive/5 transition-all"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Exam List */}
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
              {filtered.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">No exams match your filters.</p>
              )}
              {filtered.map((exam) => {
                const isSub = subscribed.has(exam.id);
                const isToggling = toggling === exam.id;
                return (
                  <button
                    key={exam.id}
                    onClick={() => toggle(exam.id)}
                    disabled={isToggling}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      isSub
                        ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                        : "bg-card border-border hover:border-primary/20 hover:bg-muted/50"
                    }`}
                  >
                    {/* Toggle switch */}
                    <div className={`w-9 h-5 rounded-full relative flex-shrink-0 transition-colors ${
                      isSub ? "bg-primary" : "bg-muted-foreground/20"
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${
                        isSub ? "left-[18px]" : "left-0.5"
                      }`}>
                        {isToggling && <Loader2 className="w-3 h-3 animate-spin text-primary absolute top-0.5 left-0.5" />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{exam.shortName}</p>
                      <p className="text-xs text-muted-foreground truncate">{exam.conductingBody}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${
                        exam.level === "national" ? "bg-primary/10 text-primary" :
                        exam.level === "state" ? "bg-warning/10 text-warning" :
                        "bg-violet/10 text-violet"
                      }`}>
                        {exam.level}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{exam.states[0]}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
