import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

export const BLOOD_GROUPS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];
export const CITIES = ["Kolkata", "Mumbai", "Delhi", "Bangalore", "Chennai"];
export const URGENCY = [
  { value: "critical", label: "Critical (< 2 hrs)" },
  { value: "high",     label: "High (< 6 hrs)"    },
  { value: "normal",   label: "Normal (< 24 hrs)" },
];

export async function streamChat({ session_id, message, language = "auto", onDelta, onDone, onError }) {
  try {
    const resp = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id, message, language }),
    });
    if (!resp.ok || !resp.body) throw new Error(`chat failed: ${resp.status}`);
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const p of parts) {
        const line = p.replace(/^data:\s*/, "").trim();
        if (!line) continue;
        try {
          const evt = JSON.parse(line);
          if (evt.delta) onDelta?.(evt.delta);
          if (evt.done)  onDone?.();
          if (evt.error) onError?.(evt.error);
        } catch (_) { /* ignore */ }
      }
    }
    onDone?.();
  } catch (e) {
    onError?.(e.message || String(e));
  }
}
