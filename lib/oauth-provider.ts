import { randomBytes, createHash } from "crypto";
import { getSupabase } from "./supabase";

export type OAuthApp = {
  id: string;
  owner_email: string;
  owner_user_id: string | null;
  name: string;
  homepage_url: string;
  redirect_uris: string[];
  javascript_origins: string[];
  client_id: string;
  client_secret: string;
  created_at: string;
  updated_at: string;
};

export function generateClientId() {
  return "app_" + randomBytes(12).toString("hex");
}

export function generateClientSecret() {
  return "sk_" + randomBytes(24).toString("hex");
}

export function generateAuthCode() {
  return randomBytes(24).toString("hex");
}

export function generateAccessToken() {
  return "tok_" + randomBytes(32).toString("hex");
}

export function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

/** Compare redirect URIs: scheme+host+port+path, no trailing slash, no hash */
export function normalizeUri(uri: string) {
  try {
    const u = new URL(uri.trim());
    u.hash = "";
    // drop default ports
    if (
      (u.protocol === "https:" && u.port === "443") ||
      (u.protocol === "http:" && u.port === "80")
    ) {
      u.port = "";
    }
    let path = u.pathname || "/";
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    u.pathname = path;
    // search kept — if registered without query, request should not add extra
    return u.origin + u.pathname + (u.search || "");
  } catch {
    return uri.trim().replace(/\/$/, "");
  }
}

export function isRedirectAllowed(app: OAuthApp, redirectUri: string) {
  const target = normalizeUri(redirectUri);
  const list = app.redirect_uris || [];
  return list.some((r) => normalizeUri(r) === target);
}

export async function getAppByClientId(clientId: string) {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("oauth_apps")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error || !data) return null;
  return data as OAuthApp;
}

export async function listAppsByOwner(email: string) {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from("oauth_apps")
    .select("*")
    .eq("owner_email", email)
    .order("created_at", { ascending: false });
  return (data || []) as OAuthApp[];
}
