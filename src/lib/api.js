const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function isJsonResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json");
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    if (!isJsonResponse(response)) {
      throw new Error(
        "SQLite backend is not connected to this site. Set VITE_API_BASE_URL to your Render URL, or run the app locally."
      );
    }

    const message = await response.text();
    const cleanMessage = String(message || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    throw new Error(cleanMessage || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function fetchChecklistSubmissions() {
  return request("/api/checklist-submissions");
}

export async function createChecklistSubmission(payload) {
  return request("/api/checklist-submissions", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export { API_BASE_URL };
