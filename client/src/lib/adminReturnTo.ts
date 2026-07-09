const DEFAULT_LOGIN_RETURN_PATH = "/";
const OWNER_RETURN_PREFIXES = ["/manage", "/write"] as const;

export function isSafeAdminReturnPath(
  value: string | null | undefined
): value is string {
  if (!value) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  if (value.includes("\\")) return false;

  try {
    const url = new URL(value, "http://local.example");
    if (url.origin !== "http://local.example") return false;
    return OWNER_RETURN_PREFIXES.some(
      prefix => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)
    );
  } catch {
    return false;
  }
}

export function getSafeAdminReturnPath(search: string | null | undefined) {
  const returnTo = new URLSearchParams(search ?? "").get("returnTo");
  return isSafeAdminReturnPath(returnTo)
    ? returnTo
    : DEFAULT_LOGIN_RETURN_PATH;
}

export function buildAdminLoginHref(returnTo: string | null | undefined) {
  if (!isSafeAdminReturnPath(returnTo)) return "/login";
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export function getCurrentAdminReturnPath() {
  if (typeof window === "undefined") return null;
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}
