const FALLBACK_API_BASE_URL = "http://localhost:5000";

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  const targetUrl = envUrl || FALLBACK_API_BASE_URL;

  if (
    typeof window !== "undefined" &&
    window.location &&
    window.location.hostname &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    try {
      const parsed = new URL(targetUrl);
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
        return `${parsed.protocol}//${window.location.hostname}:${parsed.port || "5000"}`;
      }
    } catch (e) {
      // ignore parsing error and fallback
    }
  }

  return targetUrl.replace(/\/+$/, "");
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;
