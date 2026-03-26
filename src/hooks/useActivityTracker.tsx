import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useActivityTracker() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const track = async () => {
      await supabase.from("user_activity").upsert(
        { user_id: user.id, last_seen: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    };

    track();
    const interval = setInterval(track, 60000); // every minute
    return () => clearInterval(interval);
  }, [user]);
}
