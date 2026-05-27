const SECRET_KEY_PATTERN = /(secret|token|api[_-]?key|apikey|authorization|password|credential|client[_-]?secret|private[_-]?key|session)/i;
const SECRET_VALUE_PATTERNS = [
  /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/g,
  /\bproofticket_[A-Za-z0-9._:-]{8,}/g,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}/g,
  /\bsk-[A-Za-z0-9_-]{20,}/g,
  /\b(?=[A-Za-z0-9+/=]{32,}\b)(?=[A-Za-z0-9+/=]*[+/=])[A-Za-z0-9+/]{32,}={0,2}\b/g,
];

export function redact(value) {
  if (Array.isArray(value)) return value.map((entry) => redact(entry));

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        SECRET_KEY_PATTERN.test(key) ? "[REDACTED]" : redact(entry),
      ])
    );
  }

  if (typeof value !== "string") return value;

  return SECRET_VALUE_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, "[REDACTED]"),
    value
  );
}

export function parseJsonField(value, fallback = {}) {
  if (!value || typeof value !== "string") return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}
