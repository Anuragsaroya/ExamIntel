import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Save, BookOpen, MapPin, IndianRupee, GraduationCap, CheckCircle2, Loader2, LogIn, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

export default function Profile() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    stream: "pcm",
    budget: "",
    states: [] as string[],
    targetBranch: "",
    percentage: "",
  });

  const stateOptions = ["All India", "West Bengal", "Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "Rajasthan", "Andhra Pradesh", "Gujarat", "Kerala", "Odisha", "Telangana", "Assam", "Chhattisgarh", "Himachal Pradesh"];

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const loadProfile = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setProfile({
          name: data.name || "",
          stream: data.stream || "pcm",
          budget: data.budget || "",
          states: data.preferred_states || [],
          targetBranch: data.target_branch || "",
          percentage: data.percentage?.toString() || "",
        });
      }
      setLoading(false);
    };
    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: profile.name,
        stream: profile.stream,
        budget: profile.budget,
        preferred_states: profile.states,
        target_branch: profile.targetBranch,
        percentage: profile.percentage ? parseFloat(profile.percentage) : null,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      localStorage.setItem("examintel-profile", JSON.stringify(profile));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({ title: "Profile saved", description: "Dashboard recommendations updated." });
    }
    setSaving(false);
  };

  const toggleState = (state: string) => {
    setProfile((p) => ({
      ...p,
      states: p.states.includes(state) ? p.states.filter((s) => s !== state) : [...p.states, state],
    }));
  };

  if (authLoading || loading) {
    return (
      <AppLayout title="Profile">
        <div className="flex items-center justify-center py-32"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout title="Profile">
        <div className="max-w-md mx-auto py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Sign in to save preferences</h2>
          <p className="text-sm text-muted-foreground mb-6">Create an account to save your profile and get personalized recommendations.</p>
          <Link to="/auth"><Button className="rounded-lg"><LogIn className="w-4 h-4 mr-2" /> Sign In</Button></Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Profile" subtitle="Set preferences for personalized recommendations">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="space-y-4">
          <div className="glass-card p-5">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2"><User className="w-4 h-4 text-muted-foreground" /> Name</label>
            <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Your name" className="w-full px-3 py-2.5 rounded-lg bg-background text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 border border-border" />
          </div>

          <div className="glass-card p-5">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2"><BookOpen className="w-4 h-4 text-muted-foreground" /> Stream</label>
            <div className="flex gap-2">
              {["pcm", "pcb"].map((s) => (
                <button key={s} onClick={() => setProfile({ ...profile, stream: s })} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all border ${profile.stream === s ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/40"}`}>
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2"><IndianRupee className="w-4 h-4 text-muted-foreground" /> Annual Fee Budget</label>
            <input value={profile.budget} onChange={(e) => setProfile({ ...profile, budget: e.target.value })} placeholder="e.g., 500000" className="w-full px-3 py-2.5 rounded-lg bg-background text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 border border-border" />
          </div>

          <div className="glass-card p-5">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2"><MapPin className="w-4 h-4 text-muted-foreground" /> Preferred States</label>
            <div className="flex flex-wrap gap-2">
              {stateOptions.map((s) => (
                <button key={s} onClick={() => toggleState(s)} className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${profile.states.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/40"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-5">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2"><GraduationCap className="w-4 h-4 text-muted-foreground" /> Target Branch</label>
            <input value={profile.targetBranch} onChange={(e) => setProfile({ ...profile, targetBranch: e.target.value })} placeholder="e.g., Computer Science" className="w-full px-3 py-2.5 rounded-lg bg-background text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 border border-border" />
          </div>

          <div className="glass-card p-5">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2"><Percent className="w-4 h-4 text-muted-foreground" /> 12th / Board Percentage</label>
            <input
              value={profile.percentage}
              onChange={(e) => setProfile({ ...profile, percentage: e.target.value })}
              placeholder="e.g., 85.5"
              type="number"
              min="0"
              max="100"
              step="0.1"
              className="w-full px-3 py-2.5 rounded-lg bg-background text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 border border-border"
            />
            <p className="text-xs text-muted-foreground mt-1.5">This helps us recommend exams matching your eligibility</p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full rounded-lg" size="lg">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
          </Button>
        </div>
      </motion.div>
    </AppLayout>
  );
}
