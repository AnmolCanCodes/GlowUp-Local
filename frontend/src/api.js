const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/\$/, "");

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    const raw = await response.text();
    let payload = null;

    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {}

    if (!response.ok) {
      const d = payload?.detail;
      const msg = Array.isArray(d)
        ? d.map((x) => `${x.loc?.slice(-1)[0] || "Field"}: ${x.msg}`).join(" · ")
        : typeof d === "string"
        ? d
        : `Request failed (${response.status}).`;
      throw new Error(msg);
    }

    if (!payload || typeof payload !== "object") {
      throw new Error("The server returned an invalid response. Please try again.");
    }

    return payload;
  } catch (e) {
    if (e.name === "AbortError") {
      throw new Error("The audit is taking longer than expected. Please try again.");
    }
    if (e instanceof TypeError) {
      throw new Error("Could not reach GlowUp Local. Check that the backend is running and try again.");
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export function checkHealth() {
  return request("/health");
}

export function createAudit(data) {
  return request("/api/v1/audits", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export { API_BASE_URL };