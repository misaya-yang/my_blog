export type ProductRouteKind =
  | "home"
  | "public"
  | "reader"
  | "editor"
  | "owner"
  | "system";

export type ProductRouteClassification = {
  pathname: string;
  kind: ProductRouteKind;
  known: boolean;
  slug?: string;
};

export const PUBLIC_STATIC_ROUTES = [
  "/",
  "/algorithms",
  "/applications",
  "/archive",
  "/about",
  "/search",
] as const;

export const OWNER_STATIC_ROUTES = ["/manage", "/manage/agent"] as const;
export const EDITOR_STATIC_ROUTES = ["/write"] as const;
export const SYSTEM_STATIC_ROUTES = ["/login", "/404"] as const;
export const DISALLOWED_ROUTES = [
  "/write",
  "/manage",
  "/api/trpc/posts.create",
  "/api/trpc/posts.update",
] as const;

const slugSegment = "[^/?#]+";
const postPattern = new RegExp(`^/post/(${slugSegment})$`);
const tagPattern = new RegExp(`^/tags/(${slugSegment})$`);
const categoryPattern = new RegExp(`^/categories/(${slugSegment})$`);
const editorPattern = new RegExp(`^/write/(${slugSegment})$`);

export function normalizeRoutePathname(path: string) {
  const pathname = path.split(/[?#]/, 1)[0] || "/";
  if (pathname.length > 1) return pathname.replace(/\/+$/, "");
  return pathname;
}

export function classifyProductRoute(
  path: string
): ProductRouteClassification {
  const pathname = normalizeRoutePathname(path);

  if (pathname === "/") return { pathname, kind: "home", known: true };

  const postSlug = matchRouteSlug(pathname, postPattern);
  if (postSlug) {
    return { pathname, kind: "reader", known: true, slug: postSlug };
  }

  const tagSlug = matchRouteSlug(pathname, tagPattern);
  if (tagSlug) {
    return { pathname, kind: "public", known: true, slug: tagSlug };
  }

  const categorySlug = matchRouteSlug(pathname, categoryPattern);
  if (categorySlug) {
    return { pathname, kind: "public", known: true, slug: categorySlug };
  }

  if (PUBLIC_STATIC_ROUTES.includes(pathname as PublicStaticRoute)) {
    return { pathname, kind: "public", known: true };
  }

  if (OWNER_STATIC_ROUTES.includes(pathname as OwnerStaticRoute)) {
    return { pathname, kind: "owner", known: true };
  }

  if (
    EDITOR_STATIC_ROUTES.includes(pathname as EditorStaticRoute) ||
    editorPattern.test(pathname)
  ) {
    return { pathname, kind: "editor", known: true };
  }

  if (SYSTEM_STATIC_ROUTES.includes(pathname as SystemStaticRoute)) {
    return { pathname, kind: "system", known: true };
  }

  return { pathname, kind: "system", known: false };
}

export function isKnownClientRoute(path: string) {
  return classifyProductRoute(path).known;
}

export function canShowPublicBlogAgent(path: string) {
  const route = classifyProductRoute(path);
  return route.kind === "home" || route.kind === "public" || route.kind === "reader";
}

function matchRouteSlug(pathname: string, pattern: RegExp) {
  const value = pattern.exec(pathname)?.[1];
  return value ? decodeURIComponent(value) : undefined;
}

type PublicStaticRoute = (typeof PUBLIC_STATIC_ROUTES)[number];
type OwnerStaticRoute = (typeof OWNER_STATIC_ROUTES)[number];
type EditorStaticRoute = (typeof EDITOR_STATIC_ROUTES)[number];
type SystemStaticRoute = (typeof SYSTEM_STATIC_ROUTES)[number];
