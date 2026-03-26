import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Shield, Users, Activity, Upload, Trash2, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  recentUsers: { id: string; name: string; created_at: string; last_sign_in_at: string }[];
}

interface ExamUpdate {
  id: string;
  exam_name: string;
  exam_short: string;
  state: string | null;
  type: string | null;
  last_date: string | null;
  status: string | null;
  category: string | null;
  uploaded_at: string;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [examUpdates, setExamUpdates] = useState<ExamUpdate[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin) return;
    fetchStats();
    fetchExamUpdates();
  }, [user, isAdmin]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("admin-stats", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.data) setStats(res.data);
    } catch (e) {
      console.error("Failed to fetch stats", e);
    }
    setLoadingStats(false);
  };

  const fetchExamUpdates = async () => {
    const { data } = await supabase
      .from("exam_updates")
      .select("*")
      .order("uploaded_at", { ascending: false });
    if (data) setExamUpdates(data as ExamUpdate[]);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const text = await file.text();
      const lines = text.trim().split("\n");
      const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));

      const rows = lines.slice(1).filter(l => l.trim()).map((line) => {
        const values = parseCSVLine(line);
        const row: Record<string, string> = {};
        headers.forEach((h, i) => (row[h] = values[i] || ""));
        return row;
      });

      // Upsert: update existing by exam_short, add new ones
      for (const r of rows) {
        const examShort = r.exam_short || r.short || "";
        const examName = r.exam_name || r.name || "";
        if (!examShort && !examName) continue;

        const updateFields: Record<string, any> = {
          exam_name: examName,
          exam_short: examShort,
          uploaded_by: user!.id,
          uploaded_at: new Date().toISOString(),
        };
        if (r.state) updateFields.state = r.state;
        if (r.type) updateFields.type = r.type;
        if (r.last_date || r.deadline) updateFields.last_date = r.last_date || r.deadline;
        if (r.status) updateFields.status = r.status;
        if (r.category) updateFields.category = r.category;

        // Check if exam_short already exists
        const { data: existing } = await supabase
          .from("exam_updates")
          .select("id")
          .eq("exam_short", examShort)
          .maybeSingle();

        if (existing) {
          // Update existing record
          await supabase
            .from("exam_updates")
            .update(updateFields)
            .eq("id", existing.id);
        } else {
          // Insert new record
          await supabase.from("exam_updates").insert([{
            exam_name: updateFields.exam_name,
            exam_short: updateFields.exam_short,
            state: updateFields.state || null,
            type: updateFields.type || null,
            last_date: updateFields.last_date || null,
            status: updateFields.status || "Open",
            category: updateFields.category || "Safe",
            uploaded_by: updateFields.uploaded_by,
            uploaded_at: updateFields.uploaded_at,
          }]);
        }
      }

      const newCount = rows.length;

      toast({ title: "CSV uploaded!", description: `${newCount} exams processed (new added, existing updated).` });
      fetchExamUpdates();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDeleteAll = async () => {
    await supabase.from("exam_updates").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    toast({ title: "All exam updates deleted" });
    fetchExamUpdates();
  };

  if (authLoading || adminLoading) {
    return (
      <AppLayout title="Admin">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const getStatusColor = (status: string | null) => {
    if (!status) return "text-muted-foreground";
    switch (status.toLowerCase()) {
      case "open": return "text-[hsl(var(--success))]";
      case "closed": return "text-destructive";
      case "upcoming": return "text-[hsl(var(--warning))]";
      default: return "text-muted-foreground";
    }
  };

  return (
    <AppLayout title="Admin Dashboard" subtitle="Manage exams and monitor users">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        {/* Admin Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 w-fit">
          <Shield className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-semibold text-violet-500">Admin Access</span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border p-5 stat-card-blue">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-foreground tracking-tight">
              {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.totalUsers || 0}
            </div>
            <div className="text-[13px] text-muted-foreground mt-1">Total Users (excl. admins)</div>
          </div>

          <div className="rounded-2xl border p-5 stat-card-green">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-[hsl(var(--success))]" />
            </div>
            <div className="text-3xl font-bold text-foreground tracking-tight">
              {loadingStats ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.activeUsers || 0}
            </div>
            <div className="text-[13px] text-muted-foreground mt-1">Active Now (5 min)</div>
          </div>

          <div className="rounded-2xl border p-5 stat-card-amber">
            <div className="flex items-center gap-2 mb-3">
              <FileSpreadsheet className="w-5 h-5 text-[hsl(var(--warning))]" />
            </div>
            <div className="text-3xl font-bold text-foreground tracking-tight">{examUpdates.length}</div>
            <div className="text-[13px] text-muted-foreground mt-1">Exam Entries</div>
          </div>
        </div>

        {/* CSV Upload */}
        <div className="rounded-2xl border p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Upload Exam Data (CSV)</h2>
            </div>
            {examUpdates.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleDeleteAll} className="text-destructive border-destructive/20 hover:bg-destructive/10">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear All
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a CSV file with columns: exam_name, exam_short, state, type, last_date, status, category
          </p>
          <div className="flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
              id="csv-upload"
            />
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-xl"
            >
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {uploading ? "Uploading..." : "Choose CSV File"}
            </Button>
          </div>
        </div>

        {/* Exam Updates Table */}
        {examUpdates.length > 0 && (
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="p-5 border-b">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success))]" />
                Current Exam Data ({examUpdates.length} entries)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Exam</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Short</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">State</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Last Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {examUpdates.map((eu) => (
                    <tr key={eu.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-foreground">{eu.exam_name}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{eu.exam_short}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{eu.state || "—"}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{eu.type || "—"}</td>
                      <td className="py-2.5 px-4 text-muted-foreground font-mono text-xs">{eu.last_date || "—"}</td>
                      <td className={`py-2.5 px-4 font-semibold text-xs ${getStatusColor(eu.status)}`}>{eu.status || "—"}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{eu.category || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Users - Names only, no emails */}
        {stats?.recentUsers && stats.recentUsers.length > 0 && (
          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="p-5 border-b">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Recent Users
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Joined</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Last Sign In</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentUsers.map((u) => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-foreground">{u.name}</td>
                      <td className="py-2.5 px-4 text-muted-foreground text-xs font-mono">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="py-2.5 px-4 text-muted-foreground text-xs font-mono">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "Never"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
