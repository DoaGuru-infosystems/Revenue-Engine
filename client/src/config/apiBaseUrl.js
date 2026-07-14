const FALLBACK_API_BASE_URL = "http://localhost:5000";

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || FALLBACK_API_BASE_URL;

const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");

export default API_BASE_URL;
