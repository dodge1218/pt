const SECRET_KEY_PATTERN = /(secret|api[_-]?key|apikey|authorization|password|credential|client[_-]?secret|private[_-]?key|session)/i;
const TOKEN_KEY_PATTERN = /(^token$|^tokens$|[_-]token$|[_-]tokens$|^token[_-]|^tokens[_-]|auth[_-]?token|access[_-]?token|refresh[_-]?token)/i;

const SECRET_VALUE_PATTERNS = [
  /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/g,
  /\bproofticket_[A-Za-z0-9._:-]{8,}/g,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}/g,
  /\bsk-[A-Za-z0-9_-]{20,}/g,
  /\b(?=[A-Za-z0-9+/=]{32,}\b)(?=[A-Za-z0-9+/=]*[+/=])[A-Za-z0-9+/]{32,}={0,2}\b/g,
];

export function redactString(value: string) {
  return SECRET_VALUE_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, "[REDACTED]"),
    value
  );
}

export function redactValue<T>(value: T): T {
  if (Array.isArray(value)) return value.map((entry) => redactValue(entry)) as T;

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        isSecretKey(key) ? "[REDACTED]" : redactValue(entry),
      ])
    ) as T;
  }

  if (typeof value === "string") return redactString(value) as T;
  return value;
}

export function redactRecord<T extends Record<string, unknown>>(value: T): T {
  return redactValue(value);
}

function isSecretKey(key: string) {
  return SECRET_KEY_PATTERN.test(key) || TOKEN_KEY_PATTERN.test(key);
}
