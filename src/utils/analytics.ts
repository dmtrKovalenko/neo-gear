let trackFn:
  | ((eventName: string, options?: { props?: Record<string, string> }) => void)
  | null = null;

if (typeof window !== "undefined") {
  import("@plausible-analytics/tracker")
    .then(({ init, track }) => {
      init({
        domain: "gears.dmtrkovalenko.dev",
        autoCapturePageviews: true,
      });
      trackFn = (eventName, options) =>
        track(eventName, { props: options?.props });
    })
    .catch((error) => {
      console.error("Failed to load Plausible tracker:", error);
    });
}

export function trackEvent(
  eventName: string,
  options?: { props?: Record<string, string> }
) {
  trackFn?.(eventName, options);
}
