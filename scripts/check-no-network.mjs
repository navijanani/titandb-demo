#!/usr/bin/env node
/**
 * Guard for the backend-free demo: fails if source code contains anything that can talk to a server.
 * Runs automatically before `npm run build` (see "prebuild" in package.json).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname, relative } from "node:path";

const ROOT = new URL("../src", import.meta.url).pathname;
const FORBIDDEN = [
  [/\bfetch\s*\(/, "fetch()"],
  [/XMLHttpRequest/, "XMLHttpRequest"],
  [/\bWebSocket\b/, "WebSocket"],
  [/\bEventSource\b/, "EventSource"],
  [/sendBeacon/, "navigator.sendBeacon"],
  [/\baxios\b/, "axios"],
  [/VITE_API/, "VITE_API_* env var"],
  [/["'`]\/api\/v1/, "/api/v1 path"],
];

const hits = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (![".ts", ".tsx", ".js", ".jsx"].includes(extname(p))) continue;
    const lines = readFileSync(p, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // ignore comments
      for (const [re, label] of FORBIDDEN) if (re.test(line)) hits.push(`${relative(ROOT, p)}:${i + 1}  ${label}`);
    });
  }
})(ROOT);

if (hits.length) {
  console.error("Network-capable code found in the demo:\n  " + hits.join("\n  "));
  process.exit(1);
}
console.log("check-no-network: OK (no fetch / XHR / WebSocket / API paths in src)");
