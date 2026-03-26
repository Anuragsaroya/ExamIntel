import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    // Get all admin user IDs to exclude them
    const { data: adminRoles } = await adminClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    const adminUserIds = new Set((adminRoles || []).map((r: any) => r.user_id));

    // Get all users
    const { data: allUsersData } = await adminClient.auth.admin.listUsers({ perPage: 100, page: 1 });
    const allUsers = allUsersData?.users || [];
    
    // Filter out admins
    const normalUsers = allUsers.filter((u: any) => !adminUserIds.has(u.id));

    // Get profiles for names
    const normalUserIds = normalUsers.map((u: any) => u.id);
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("user_id, name")
      .in("user_id", normalUserIds.length > 0 ? normalUserIds : ["00000000-0000-0000-0000-000000000000"]);
    
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.name]));

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: activeUsers } = await adminClient
      .from("user_activity")
      .select("*", { count: "exact", head: true })
      .gte("last_seen", fiveMinAgo);

    return new Response(
      JSON.stringify({
        totalUsers: normalUsers.length,
        activeUsers: activeUsers || 0,
        recentUsers: normalUsers.slice(0, 10).map((u: any) => ({
          id: u.id,
          name: profileMap.get(u.id) || "Unknown User",
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
