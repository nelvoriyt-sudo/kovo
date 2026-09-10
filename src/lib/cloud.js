export const SUPABASE_URL = "https://qilncthqoemugozmilbg.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_2bl7GhwbDqmYb2fJA_o95Q_01f3cxHg";

const SESSION_KEY = "kovo-cloud-session-v1";
const PASSWORD_REDIRECT_URL = typeof window === 'undefined' ? '' : `${window.location.origin}/kovo/`;

function buildHeaders(token) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function jsonRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, { ...options, signal: AbortSignal.timeout(15000) });
  const body = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      body?.msg ||
      body?.message ||
      body?.error_description ||
      body?.error ||
      `Request failed (${response.status})`
    );
    error.status = response.status;
    throw error;
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
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, expires_at: session.expires_at || Math.floor(Date.now()/1000) + (session.expires_in || 3600) }));
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
  const data = await jsonRequest(`/auth/v1/signup?redirect_to=${encodeURIComponent(PASSWORD_REDIRECT_URL)}`, {
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

export async function signOut() {
  const session = getStoredSession();
  storeSession(null);
  sessionStorage.removeItem('kovo-recovery');
  if (session?.access_token) await jsonRequest('/auth/v1/logout?scope=local', {method:'POST',headers:buildHeaders(session.access_token)}).catch(() => {});
}

async function refresh() {
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
  } catch (error) {
    if (error.status === 400 || error.status === 401) { storeSession(null); return null; }
    throw error;
  }
}

let refreshing;
export function freshSession() {
  if (!refreshing) refreshing = (globalThis.navigator?.locks
    ? navigator.locks.request('kovo-auth-refresh', refresh) : refresh()).finally(() => { refreshing = null; });
  return refreshing;
}

export async function completeAuthRedirect() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  if (!params.has('access_token') && !params.has('error_description')) return;
  history.replaceState(null, '', window.location.pathname + window.location.search);
  if (params.has('error_description')) throw new Error(params.get('error_description'));
  const access_token = params.get('access_token'), refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) throw new Error('This email link is incomplete. Request a new link.');
  const user = await jsonRequest('/auth/v1/user', { headers: buildHeaders(access_token) });
  if (params.get('type') === 'recovery') sessionStorage.setItem('kovo-recovery','true');
  storeSession({ access_token, refresh_token, user, expires_in:Number(params.get('expires_in') || 3600) });
}
export async function updatePassword(password) {
  const session = await freshSession();
  if (!session) throw new Error('Request a new password reset email.');
  await jsonRequest('/auth/v1/user',{method:'PUT',headers:buildHeaders(session.access_token),body:JSON.stringify({password})});
  sessionStorage.removeItem('kovo-recovery');
}
export function resendVerification(email) {
  return jsonRequest(`/auth/v1/resend?redirect_to=${encodeURIComponent(PASSWORD_REDIRECT_URL)}`,{method:'POST',headers:buildHeaders(),body:JSON.stringify({type:'signup',email})});
}
export async function rpc(name, body = {}, expectedOwner) {
  const session = await freshSession();
  if (!session) throw new Error('Sign in again to sync. Your pending entries remain on this device.');
  if (expectedOwner && session.user.id !== expectedOwner) throw new Error('Account changed. Pending entries remain with their original account.');
  return jsonRequest(`/rest/v1/rpc/${name}`,{method:'POST',headers:buildHeaders(session.access_token),body:JSON.stringify(body)});
}

export async function deleteAccount() {
  const session=await freshSession();
  if(!session)throw new Error('Sign in again before deleting your account.');
  return jsonRequest('/functions/v1/delete-account',{method:'DELETE',headers:buildHeaders(session.access_token)});
}
