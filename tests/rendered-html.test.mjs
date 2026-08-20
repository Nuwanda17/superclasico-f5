import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the Superclásico F5 application shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Superclásico F5<\/title>/i);
  assert.match(html, /Superclásico F5/i);
  assert.match(html, /og\.png/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("keeps simulation and persistence separate from the UI", async () => {
  const [engine, storage, commentary] = await Promise.all([
    readFile(new URL("../lib/simulationEngine.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/storage.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/commentary.ts", import.meta.url), "utf8"),
  ]);
  assert.match(engine, /export function simulateMatch/);
  assert.match(engine, /seededRandom/);
  assert.match(storage, /window\.localStorage/);
  assert.match(commentary, /COMMENTARY/);
});
