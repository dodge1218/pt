#!/usr/bin/env node

if (process.argv.includes("--input")) {
  process.stdout.write(
    frame({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "proofticket-smoke", version: "0.1.0" },
      },
    }) +
      frame({ jsonrpc: "2.0", method: "notifications/initialized" }) +
      frame({ jsonrpc: "2.0", id: 2, method: "tools/list" })
  );
  process.exit(0);
}

const output = await readStdin();
const responses = parseFrames(Buffer.from(output, "utf8"));
const initialize = responses.find((response) => response.id === 1);
const toolsList = responses.find((response) => response.id === 2);

if (initialize?.result?.serverInfo?.name !== "proofticket-mcp") {
  fail(`initialize response did not identify proofticket-mcp. responses=${responses.length}`);
}

const tools = toolsList?.result?.tools || [];
const names = tools.map((tool) => tool.name).sort();
const expected = [
  "proofticket_attach_artifact",
  "proofticket_create_action",
  "proofticket_list_actions",
  "proofticket_resolve_action",
];

for (const name of expected) {
  if (!names.includes(name)) fail(`Missing tool: ${name}`);
}

console.log(JSON.stringify({ ok: true, tools: names }, null, 2));

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function parseFrames(output) {
  const responses = [];
  let cursor = output;

  while (cursor.length > 0) {
    const headerEnd = cursor.indexOf("\r\n\r\n");
    if (headerEnd === -1) break;

    const header = cursor.subarray(0, headerEnd).toString("utf8");
    const match = /^Content-Length:\s*(\d+)$/im.exec(header);
    if (!match) fail("MCP response missing Content-Length header.");

    const length = Number(match[1]);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + length;
    if (cursor.length < bodyEnd) fail("MCP response body was truncated.");

    responses.push(JSON.parse(cursor.subarray(bodyStart, bodyEnd).toString("utf8")));
    cursor = cursor.subarray(bodyEnd);
  }

  return responses;
}

function frame(message) {
  const body = JSON.stringify(message);
  return `Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
