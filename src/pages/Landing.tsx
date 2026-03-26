import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Brain, Bell, Shield, ArrowRight, Clock, Target, Users, ChevronRight, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useExamData } from "@/hooks/useExamData";
import { getNextDeadline } from "@/data/exams";
import CountdownRing from "@/components/CountdownRing";
import ExamTimeline from "@/components/ExamTimeline";
import AlertStrip from "@/components/AlertStrip";
import ThemeToggle from "@/components/ThemeToggle";

const features = [
  { icon: Search, title: "Smart Aggregation", description: "Auto-collects data from JEE, BITSAT, WBJEE, VITEEE, COMEDK & more." },
  { icon: Brain, title: "AI Recommendations", description: "Safe, Moderate & Risky picks based on your profile preferences." },
  { icon: Bell, title: "Deadline Alerts", description: "Priority notifications so you never miss a registration deadline." },
  { icon: Shield, title: "Verified Data", description: "Cross-checked from official sources with confidence scores." },
  { icon: Clock, title: "Live Countdown", description: "Real-time timers for every important deadline." },
  { icon: Target, title: "Personalized", description: "Set stream, budget & goals for tailored recommendations." },
];

export default function Landing() {
  const { user } = useAuth();
  const { exams } = useExamData();

  const examPreviews = exams
    .map((e) => ({ exam: e, next: getNextDeadline(e) }))
    .filter((e) => e.next)
    .sort((a, b) => a.next!.days - b.next!.days)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* Alert Strip */}
      <AlertStrip />

      {/* Nav */}
      <nav className="border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-lg">E</span>
              </div>
              <span className="font-display text-lg font-bold text-foreground">
                exam<span className="text-primary">intel</span>
              </span>
            </Link>
            <div className="hidden sm:flex items-center gap-1">
              <Link to="/" className="px-4 py-2 rounded-lg text-sm font-medium text-primary">Home</Link>
              <Link to="/exams" className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Exams</Link>
              <Link to="/notifications" className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Alerts</Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Link to="/dashboard">
                <Button size="sm" className="rounded-lg h-9 text-sm font-semibold">
                  Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="rounded-lg h-9 text-sm font-semibold border-border hover:bg-secondary">
                    Login
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="rounded-lg h-9 text-sm font-semibold">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - MathonGo inspired */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 text-center relative">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-foreground leading-tight mb-4">
              All Engineering Entrance Exams
              <br />
              <span className="text-primary">in One Place</span> 🇮🇳
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-3 leading-relaxed">
              Track deadlines, get alerts & make smarter decisions with India's one-stop exam intelligence platform.
            </p>
            <p className="text-primary font-semibold text-sm mb-8">
              #YourExamIntelligencePartner
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/auth">
                <Button size="lg" className="rounded-xl h-12 px-8 text-base font-semibold">
                  Login to Exam Tracker
                </Button>
              </Link>
              <Link to="/exams">
                <Button variant="outline" size="lg" className="rounded-xl h-12 px-8 text-base font-semibold border-border hover:bg-secondary">
                  Browse All Exams
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Telegram Join Button */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-center">
        <motion.a
          href="https://t.me/EngineeringExamUpdates"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[hsl(200,80%,50%)] to-[hsl(210,90%,45%)] px-5 py-2.5 text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all group cursor-pointer text-sm font-semibold"
        >
          <Send className="w-4 h-4" />
          Join Telegram Channel
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </motion.a>
      </section>

      {/* Timeline - horizontal scroll */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <ExamTimeline />
      </section>

      {/* Live Deadlines */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl text-foreground flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
              Upcoming Deadlines
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Registration & exam dates you shouldn't miss</p>
          </div>
          <Link to="/exams" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 transition-colors">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {examPreviews.map(({ exam, next }, i) => {
            const days = next?.days ?? 999;
            const isUrgent = days <= 7;
            const isWarning = days <= 30;
            const urgencyClass = isUrgent ? 'urgency-red' : isWarning ? 'urgency-amber' : 'urgency-green';

            return (
              <motion.div key={exam.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
                <Link to={`/exams/${exam.id}`} className={`block glass-card p-5 group hover:border-primary/30 h-full ${urgencyClass}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors">{exam.shortName}</h3>
                    <CountdownRing days={days} maxDays={90} size={36} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{exam.conductingBody}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{exam.states[0]}</span>
                    <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />{Math.round(exam.confidenceScore * 100)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isUrgent ? 'text-destructive' : isWarning ? 'text-primary' : 'text-success'}`}>
                      {isUrgent ? '🔴' : isWarning ? '🟡' : '🟢'} {days <= 0 ? 'TODAY!' : `${days} days left`}
                    </span>
                  </div>
                  {next && (
                    <div className="pt-3 mt-3 border-t border-border/40 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{next.label}</span>
                      <span className="text-sm font-semibold text-foreground">
                        {next.date ? new Date(next.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'TBA'}
                      </span>
                    </div>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Features - White card section like MathonGo */}
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl text-foreground mb-3">
              Why Students Choose <span className="text-primary">ExamIntel</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              From data collection to personalized recommendations — everything automated.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                className="glass-card p-6 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl text-foreground mb-3">How It Works</h2>
            <p className="text-muted-foreground">Get started in 3 simple steps</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { num: "01", title: "Browse Exams", desc: "Explore all exams — no login needed", icon: Search },
              { num: "02", title: "Create Account", desc: "Sign up to save preferences & get alerts", icon: Users },
              { num: "03", title: "Get AI Picks", desc: "Personalized Safe/Moderate/Risky picks", icon: Brain },
            ].map((s, i) => (
              <motion.div key={s.num} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }}
                className="text-center glass-card p-8"
              >
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-5 font-display text-xl font-bold">
                  {s.num}
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">E</span>
            </div>
            <span className="font-display text-base font-bold text-foreground">
              exam<span className="text-primary">intel</span>
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/exams" className="hover:text-foreground transition-colors">Exams</Link>
            <Link to="/notifications" className="hover:text-foreground transition-colors">Alerts</Link>
            <Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 ExamIntel</p>
        </div>
      </footer>
    </div>
  );
}
