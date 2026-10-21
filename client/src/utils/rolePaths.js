/**
 * Role-aware path helpers for Admin vs BD routes.
 * Preserves Admin URLs; BD uses /BD base and AddService for services landing.
 */

export function isBdPath(pathname = "") {
  return String(pathname).toLowerCase().startsWith("/bd");
}

export function getBasePath(pathnameOrRole) {
  if (!pathnameOrRole) return "/admin";
  const value = String(pathnameOrRole);
  if (value === "BD" || value.toLowerCase() === "bd") return "/BD";
  if (value === "Owner" || value === "Admin") return "/admin";
  return isBdPath(value) ? "/BD" : "/admin";
}

/** HashRouter-safe: prefers react-router location.pathname, falls back to hash. */
export function getBasePathFromLocation(location) {
  const pathname = location?.pathname || "";
  if (isBdPath(pathname)) return "/BD";
  const hash = typeof window !== "undefined" ? window.location.hash || "" : "";
  if (hash.toLowerCase().includes("/bd")) return "/BD";
  const role = location?.state?.role;
  if (role === "BD") return "/BD";
  return "/admin";
}

export function getBasePathFromWindow() {
  if (typeof window === "undefined") return "/admin";
  const hash = window.location.hash || "";
  const path = window.location.pathname || "";
  if (hash.toLowerCase().includes("/bd") || path.toLowerCase().includes("/bd")) {
    return "/BD";
  }
  return "/admin";
}

export function joinPath(base, ...segments) {
  const parts = [String(base || "").replace(/\/+$/, "")];
  for (const seg of segments) {
    if (seg == null || seg === "") continue;
    const s = String(seg).replace(/^\/+|\/+$/g, "");
    if (s) parts.push(s);
  }
  return parts.join("/");
}

/** Admin: ServicesLanding, BD: AddService (existing BD route) */
export function servicesLandingPath(base, id, proposalId, query = "") {
  const segment = base === "/BD" ? "AddService" : "ServicesLanding";
  const path = joinPath(base, segment, id, proposalId);
  if (!query) return path;
  const q = String(query).startsWith("?") ? query : `?${query}`;
  return `${path}${q}`;
}

export function rolePath(base, ...segmentsAndQuery) {
  let query = "";
  const segments = [...segmentsAndQuery];
  const last = segments[segments.length - 1];
  if (typeof last === "string" && (last.startsWith("?") || last.includes("="))) {
    query = last.startsWith("?") ? last : `?${last}`;
    segments.pop();
  }
  const path = joinPath(base, ...segments);
  return query ? `${path}${query}` : path;
}
