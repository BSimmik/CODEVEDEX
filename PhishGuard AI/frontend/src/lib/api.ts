// API Helper for PhishGuard AI

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  let token = "";
  if (typeof window !== "undefined") {
    token = localStorage.getItem("phishguard_token") || "";
  }

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  } as HeadersInit;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "API request failed";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch (_) {}
    throw new Error(errorDetail);
  }

  // Handle binary data responses (e.g. PDF/CSV downloads)
  const contentType = response.headers.get("content-type");
  if (contentType && (contentType.includes("application/pdf") || contentType.includes("text/csv"))) {
    return response.blob();
  }

  return response.json();
}
