import { readFile } from "node:fs/promises";

type ManifestChunk = {
  file: string;
  isEntry?: boolean;
  imports?: string[];
};
export type ViteManifest = Record<string, ManifestChunk>;

// Page modules are lazy, so without a hint the browser only discovers them
// after the entry bundle has downloaded and executed. Announcing them in the
// HTML lets both requests run in parallel.
const routeModules: Array<[RegExp, string]> = [
  [/^\/$/, "src/pages/Home.tsx"],
  [/^\/post\/[^/]+$/, "src/pages/PostDetail.tsx"],
  [/^\/archive$/, "src/pages/Archive.tsx"],
  [/^\/search$/, "src/pages/Search.tsx"],
  [/^\/about$/, "src/pages/About.tsx"],
  [/^\/(algorithms|applications)$/, "src/pages/Track.tsx"],
  [/^\/(tags|categories)\/[^/]+$/, "src/pages/TaxonomyPage.tsx"],
];

function collectEntryFiles(manifest: ViteManifest) {
  const loaded = new Set<string>();
  const visit = (key: string) => {
    const chunk = manifest[key];
    if (!chunk || loaded.has(chunk.file)) return;
    loaded.add(chunk.file);
    chunk.imports?.forEach(visit);
  };
  for (const [key, chunk] of Object.entries(manifest)) {
    if (chunk.isEntry) visit(key);
  }
  return loaded;
}

export function buildRoutePreloadTags(
  manifest: ViteManifest,
  pathname: string
): string {
  const moduleKey = routeModules.find(([pattern]) =>
    pattern.test(pathname)
  )?.[1];
  if (!moduleKey || !manifest[moduleKey]) return "";

  const alreadyLoaded = collectEntryFiles(manifest);
  const files: string[] = [];
  const visit = (key: string) => {
    const chunk = manifest[key];
    if (!chunk || alreadyLoaded.has(chunk.file) || files.includes(chunk.file))
      return;
    files.push(chunk.file);
    chunk.imports?.forEach(visit);
  };
  visit(moduleKey);

  return files
    .map(
      file =>
        `<link rel="modulepreload" crossorigin href="/${file}" data-route-preload />`
    )
    .join("\n    ");
}

let manifestPromise: Promise<ViteManifest | null> | undefined;

/** Reads the build manifest once; development and missing builds yield null. */
export function loadViteManifest(manifestPath: string) {
  manifestPromise ??= readFile(manifestPath, "utf-8")
    .then(raw => JSON.parse(raw) as ViteManifest)
    .catch(() => null);
  return manifestPromise;
}

/** Replaces the build-time (Home) route preloads with this route's own. */
export function injectPreloadTags(html: string, tags: string) {
  const cleaned = html.replace(
    /[ \t]*<link rel="modulepreload"[^>]*data-route-preload[^>]*>\n?/g,
    ""
  );
  if (!tags) return cleaned;
  return cleaned.replace("</head>", `    ${tags}\n  </head>`);
}
