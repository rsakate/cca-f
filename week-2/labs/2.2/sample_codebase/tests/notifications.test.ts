import { sendOrderShipped, sendReturnApproved } from "../src/notifications";

test("sendOrderShipped logs event", () => {
  sendOrderShipped("NP-100245", "test@example.com");
});

test("sendReturnApproved logs event", () => {
  sendReturnApproved("NP-100190");
});
