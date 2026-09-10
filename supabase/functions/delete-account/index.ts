const allowedOrigin = "https://nelvoriyt-sudo.github.io";
Deno.serve(async (request: Request) => {
  const headers = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization,apikey,content-type",
    "Access-Control-Allow-Methods": "DELETE,OPTIONS",
    "Content-Type": "application/json",
  };
  const reply = (status: number, message: string) =>
    new Response(JSON.stringify({ message }), { status, headers });
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  if (request.method !== "DELETE") return reply(405, "Method not allowed");
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer "))
    return reply(401, "Sign in required");
  const url = Deno.env.get("SUPABASE_URL")!,
    secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  try {
    const response = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: secret, Authorization: authorization },
    });
    if (!response.ok)
      return reply(401, "Sign in again before deleting your account");
    const user = await response.json();
    if (!user.id) return reply(401, "Sign in required");
    // Revoke refresh sessions before deleting. Existing access tokens cannot recreate
    // financial records because every owner key references the deleted auth user.
    const logout = await fetch(`${url}/auth/v1/logout?scope=global`, {
      method: "POST",
      headers: { apikey: secret, Authorization: authorization },
    });
    if (!logout.ok)
      return reply(503, "Account was not deleted. Please try again.");
    const deleted = await fetch(
      `${url}/auth/v1/admin/users/${encodeURIComponent(user.id)}`,
      {
        method: "DELETE",
        headers: { apikey: secret, Authorization: `Bearer ${secret}` },
      },
    );
    if (!deleted.ok)
      return reply(
        503,
        "Account was not deleted. Please sign in and try again.",
      );
    return reply(200, "Account and cloud data deleted");
  } catch {
    return reply(503, "Could not reach account service. Please try again.");
  }
});
