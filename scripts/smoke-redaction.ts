import { strict as assert } from "node:assert";
import { redactRecord, redactString } from "../src/lib/redact";

const rawToken = "proofticket_abcdefghijklmnopqrstuvwxyz123456";
const rawBearer = "Bearer abcdefghijklmnopqrstuvwxyz1234567890";
const rawOpenAiKey = "sk-abcdefghijklmnopqrstuvwxyz1234567890";
const commitSha = "0123456789abcdef0123456789abcdef01234567";

assert.equal(redactString(rawToken), "[REDACTED]");
assert.equal(redactString(`Authorization: ${rawBearer}`), "Authorization: [REDACTED]");
assert.equal(redactString(`key=${rawOpenAiKey}`), "key=[REDACTED]");
assert.equal(redactString(`Head SHA: ${commitSha}`), `Head SHA: ${commitSha}`);

const redacted = redactRecord({
  title: "Deploy check",
  content: `Token ${rawToken}`,
  metadata: {
    apiKey: rawToken,
    nested: {
      note: `Use ${rawBearer}`,
    },
  },
  artifacts: [
    {
      title: "Trace",
      summary: `OpenAI key ${rawOpenAiKey}`,
    },
  ],
});

assert.equal(redacted.title, "Deploy check");
assert.equal(redacted.content, "Token [REDACTED]");
assert.equal(redacted.metadata.apiKey, "[REDACTED]");
assert.equal(redacted.metadata.nested.note, "Use [REDACTED]");
assert.equal(redacted.artifacts[0].summary, "OpenAI key [REDACTED]");

console.log("redaction smoke ok");
