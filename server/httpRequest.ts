export function setHeader(
  res: unknown,
  name: string,
  value: string | string[]
) {
  (
    res as {
      setHeader(headerName: string, headerValue: string | string[]): void;
    }
  ).setHeader(name, value);
}

export function getRequestSource(req: {
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}) {
  const forwardedFor = req.headers?.["x-forwarded-for"];
  const raw = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return raw?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

function getHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function getRequestHeader(req: unknown, name: string) {
  const headers = (
    req as { headers?: Record<string, string | string[] | undefined> }
  ).headers;
  return getHeaderValue(headers?.[name]);
}
