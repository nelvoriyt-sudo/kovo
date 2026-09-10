import test from "node:test";
import assert from "node:assert/strict";
const memory = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
};
globalThis.localStorage = memory();
globalThis.sessionStorage = memory();
globalThis.window = new EventTarget();
window.location = {
  origin: "https://nelvoriyt-sudo.github.io",
  pathname: "/kovo/",
  search: "",
  hash: "",
};
let replacedUrl = "";
globalThis.history = {
  replaceState: (_a, _b, url) => {
    replacedUrl = url;
  },
};
const auth = await import("../src/lib/cloud.js");
const response = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const session = (expires_at = 0) => ({
  user: { id: "owner-a" },
  access_token: "test-access",
  refresh_token: "test-refresh",
  expires_at,
});
test("sign-in records a real expiry even when auth response supplies only expires_in", async () => {
  globalThis.fetch = async () => response({ ...session(), expires_in: 3600 });
  await auth.signIn("test@example.invalid", "test-only");
  assert.ok(auth.getStoredSession().expires_at > Date.now() / 1000);
});
test("an offline refresh preserves login and queued work", async () => {
  localStorage.setItem("kovo-cloud-session-v1", JSON.stringify(session()));
  globalThis.fetch = async () => {
    throw new TypeError("offline");
  };
  await assert.rejects(auth.freshSession());
  assert.equal(auth.getStoredSession().refresh_token, "test-refresh");
});
test("invalid refresh tokens end the session without touching financial storage", async () => {
  localStorage.setItem("financial-test", "keep");
  globalThis.fetch = async () => response({ message: "invalid token" }, 400);
  assert.equal(await auth.freshSession(), null);
  assert.equal(localStorage.getItem("financial-test"), "keep");
});
test("concurrent refreshes share one request", async () => {
  localStorage.setItem("kovo-cloud-session-v1", JSON.stringify(session()));
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return response({ ...session(), expires_in: 3600 });
  };
  await Promise.all([
    auth.freshSession(),
    auth.freshSession(),
    auth.freshSession(),
  ]);
  assert.equal(requests, 1);
});
test("a queued operation cannot be submitted under a different account", async () => {
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return response({});
  };
  await assert.rejects(
    auth.rpc("kovo_apply_operation", {}, "owner-b"),
    /Account changed/,
  );
  assert.equal(requests, 0);
});
test("recovery link validates its user, strips URL credentials, and opens password completion", async () => {
  window.location.hash =
    "#access_token=test&refresh_token=refresh&type=recovery&expires_in=3600";
  globalThis.fetch = async (url) => {
    assert.ok(url.endsWith("/auth/v1/user"));
    return response({ id: "recovery-user" });
  };
  await auth.completeAuthRedirect();
  assert.equal(replacedUrl, "/kovo/");
  assert.equal(sessionStorage.getItem("kovo-recovery"), "true");
  assert.equal(auth.getStoredSession().user.id, "recovery-user");
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.method, "PUT");
    assert.equal(JSON.parse(options.body).password, "test-new-password");
    return response({});
  };
  await auth.updatePassword("test-new-password");
  assert.equal(sessionStorage.getItem("kovo-recovery"), null);
});
test("expired email link produces a recoverable error and removes fragment", async () => {
  window.location.hash = "#error_description=Email+link+expired";
  await assert.rejects(auth.completeAuthRedirect(), /Email link expired/);
  assert.equal(replacedUrl, "/kovo/");
});
