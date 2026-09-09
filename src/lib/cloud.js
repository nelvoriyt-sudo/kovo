export const SUPABASE_URL = "https://qilncthqoemugozmilbg.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_2bl7GhwbDqmYb2fJA_o95Q_01f3cxHg";

const SESSION_KEY = "kovo-cloud-session-v1";
const PASSWORD_REDIRECT_URL = `${window.location.origin}${window.location.pathname}`;

function buildHeaders(token) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function jsonRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, options);
  const body = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      body?.msg ||
      body?.message ||
      body?.error_description ||
      body?.error ||
      `Request failed (${response.status})`
    );
  }

  return body;
}

export function getStoredSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function storeSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);

  window.dispatchEvent(new CustomEvent("kovo-auth-changed"));
}

export async function signIn(email, password) {
  const data = await jsonRequest("/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ email, password }),
  });

  storeSession(data);
  return data;
}

export async function signUp(email, password) {
  const data = await jsonRequest("/auth/v1/signup", {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ email, password }),
  });

  if (data?.access_token) storeSession(data);
  return data;
}

export async function requestPasswordReset(email) {
  return jsonRequest(`/auth/v1/recover?redirect_to=${encodeURIComponent(PASSWORD_REDIRECT_URL)}`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ email }),
  });
}

export function signOut() {
  storeSession(null);
}

export async function freshSession() {
  let session = getStoredSession();
  if (!session) return null;

  const expiresAt = session.expires_at || 0;
  if (expiresAt * 1000 > Date.now() + 60000) return session;

  if (!session.refresh_token) {
    signOut();
    return null;
  }

  try {
    session = await jsonRequest("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    storeSession(session);
    return session;
  } catch {
    signOut();
    return null;
  }
}

export async function loadCloudData(userId) {
  const session = await freshSession();
  if (!session) return null;

  const rows = await jsonRequest(
    `/rest/v1/kovo_user_data?user_id=eq.${encodeURIComponent(userId)}&select=data,updated_at,revision`,
    { headers: buildHeaders(session.access_token) }
  );

  return rows?.[0] || null;
}

export async function saveCloudData(userId, data, expectedRevision = 0) {
  const session = await freshSession();
  if (!session) return null;

  const rows = await jsonRequest("/rest/v1/rpc/kovo_save", {
    method: "POST",
    headers: buildHeaders(session.access_token),
    body: JSON.stringify({ p_data: data, p_revision: expectedRevision }),
  });

  const result = rows?.[0];
  if (!result) throw new Error("Cloud save returned no result");

  return {
    saved: Boolean(result.saved),
    currentRevision: Number(result.current_revision || 0),
  };
}
