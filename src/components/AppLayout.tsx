import Navbar from "./Navbar";
import AlertStrip from "./AlertStrip";

interface Props {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AppLayout({ children, title, subtitle }: Props) {
  return (
    <div className="min-h-screen bg-background grid-pattern noise-overlay relative flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background pointer-events-none" />
      <div className="relative z-10 flex flex-col flex-1">
        <AlertStrip />
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {title && (
            <div className="mb-6">
              <h1 className="font-display text-3xl text-foreground tracking-wider">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground mt-1 font-mono">{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
