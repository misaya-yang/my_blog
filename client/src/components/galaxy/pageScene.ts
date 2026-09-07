export function getPageScene(path: string) {
  const key = path.split(/[?#]/)[0] || "/";
  let hash = 2166136261;
  for (const char of key)
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return {
    key,
    mode: key === "/" ? "home" : key === "/about" ? "author" : "reading",
    phase: (hash / 4294967295) * Math.PI * 2,
    tilt: ((hash >>> 16) / 65535 - 0.5) * 0.8,
    pace: 0.65 + ((hash % 997) / 997) * 0.7,
  } as const;
}
