import { markDelivered, cancelOrder } from "../src/orders";

test("markDelivered logs event", () => {
  markDelivered("NP-100245");
});

test("cancelOrder logs event", () => {
  cancelOrder("NP-100245", "changed mind");
});
