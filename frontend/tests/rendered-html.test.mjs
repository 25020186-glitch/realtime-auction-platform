import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Bidora landing page and social metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Bidora/);
  assert.match(html, /Giá trị/);
  assert.match(html, /Đấu giá theo thời gian thực/i);
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Your site is taking shape/);
});

test("keeps the backend integration and accessibility hooks in source", async () => {
  const [page, layout, provider, detail] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/providers.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/auctions/[id]/AuctionDetailClient.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /\/api\/v1\/auctions/);
  assert.match(layout, /lang="vi"/);
  assert.match(provider, /bidora\.auth/);
  assert.match(detail, /@stomp\/stompjs/);
  assert.match(detail, /crypto\.randomUUID/);
  assert.doesNotMatch(`${page}${layout}`, /codex-preview|_sites-preview/);
});
