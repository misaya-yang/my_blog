export function initAnalytics() {
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

  if (!endpoint || !websiteId) return;

  initWebVitals();

  const script = document.createElement("script");
  script.defer = true;
  script.src = `${endpoint.replace(/\/$/, "")}/umami`;
  script.dataset.websiteId = websiteId;
  document.head.appendChild(script);
}

type AnalyticsPayload = Record<string, unknown>;

export function trackAnalyticsEvent(
  name: string,
  payload: AnalyticsPayload = {}
) {
  if (typeof window === "undefined") return;

  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;
  if (!endpoint || !websiteId) return;

  const body = JSON.stringify({
    websiteId,
    name,
    url: window.location.pathname + window.location.search,
    payload,
  });
  const url = `${endpoint.replace(/\/$/, "")}/api/send`;

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      return;
    }
    fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Analytics must never break the reading or writing experience.
  }
}

export function trackPageView(path: string) {
  trackAnalyticsEvent("pageview", { path });
}

export function trackClientError(payload: {
  message: string;
  stack?: string;
  componentStack?: string;
}) {
  trackAnalyticsEvent("client_error", {
    message: payload.message,
    stack: payload.stack,
    componentStack: payload.componentStack,
  });
}

export function initWebVitals() {
  if (
    typeof window === "undefined" ||
    typeof PerformanceObserver === "undefined"
  )
    return;

  const observe = (type: string) => {
    try {
      const observer = new PerformanceObserver(list => {
        const entry = list.getEntries().at(-1);
        if (!entry) return;
        const shift = entry as PerformanceEntry & {
          value?: number;
          hadRecentInput?: boolean;
        };
        if (type === "layout-shift" && shift.hadRecentInput) return;
        const value =
          type === "layout-shift"
            ? shift.value
            : type === "event"
              ? entry.duration
              : entry.startTime;
        if (value === undefined) return;
        trackAnalyticsEvent("web_vital", {
          metric: type,
          value: type === "layout-shift" ? value : Math.round(value),
          name: entry.name,
          // These are raw samples, not aggregate CLS or INP scores.
          aggregation: "raw",
        });
      });
      observer.observe({ type, buffered: true });
    } catch {
      // Unsupported metrics vary by browser.
    }
  };

  ["largest-contentful-paint", "layout-shift", "event"].forEach(observe);
}
