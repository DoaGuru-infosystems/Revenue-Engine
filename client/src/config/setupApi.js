import axios from "axios";

// 1. Ensure Axios sends ngrok-skip-browser-warning on all requests so ngrok free-tier warning page is bypassed
axios.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  if (typeof config.headers.set === "function") {
    config.headers.set("ngrok-skip-browser-warning", "true");
  } else {
    config.headers["ngrok-skip-browser-warning"] = "true";
  }
  return config;
});

// Also set on axios defaults common headers
axios.defaults.headers.common["ngrok-skip-browser-warning"] = "true";

// 2. Patch window.fetch so any native fetch requests also bypass the ngrok warning page
if (typeof window !== "undefined" && window.fetch) {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    let [resource, config = {}] = args;
    config = { ...config };
    const headers = new Headers(config.headers || {});
    if (!headers.has("ngrok-skip-browser-warning")) {
      headers.set("ngrok-skip-browser-warning", "true");
    }
    config.headers = headers;
    return originalFetch(resource, config);
  };
}
