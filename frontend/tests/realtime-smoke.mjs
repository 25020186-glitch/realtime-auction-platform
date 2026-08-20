import assert from "node:assert/strict";
import { Client } from "@stomp/stompjs";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const credentials = { email: "buyer.demo@bidora.local", password: "Buyer123!" };

async function json(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, options);
  assert.ok(response.ok, `${options.method || "GET"} ${path} returned ${response.status}`);
  return response.status === 204 ? undefined : response.json();
}

const session = await json("/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(credentials),
});
const auctions = await json("/api/v1/auctions?status=ACTIVE&size=1");
assert.ok(auctions.content.length > 0, "Expected one active demo auction");
const auction = auctions.content[0];

await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => {
    client.deactivate();
    reject(new Error("Timed out waiting for WebSocket bid update"));
  }, 12000);

  const client = new Client({
    brokerURL: apiBase.replace(/^http/, "ws") + "/ws",
    connectHeaders: { Authorization: `Bearer ${session.accessToken}` },
    reconnectDelay: 0,
    onStompError: (frame) => reject(new Error(frame.headers.message || "STOMP error")),
    onWebSocketError: reject,
    onConnect: () => {
      client.subscribe(`/topic/auctions/${auction.id}`, async (message) => {
        try {
          const update = JSON.parse(message.body);
          assert.equal(update.type, "BID_PLACED");
          assert.equal(update.auctionId, auction.id);
          assert.ok(Number(update.currentPrice) > Number(auction.currentPrice));
          clearTimeout(timeout);
          await client.deactivate();
          resolve();
        } catch (error) { reject(error); }
      });

      setTimeout(async () => {
        try {
          await json(`/api/v1/auctions/${auction.id}/bids`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessToken}` },
            body: JSON.stringify({ amount: Number(auction.currentPrice) + Number(auction.minimumIncrement), clientRequestId: crypto.randomUUID() }),
          });
        } catch (error) { reject(error); }
      }, 250);
    },
  });
  client.activate();
});

console.log(`Realtime smoke test passed for auction #${auction.id}`);
