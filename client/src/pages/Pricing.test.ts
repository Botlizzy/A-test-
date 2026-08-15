import { describe, expect, it } from "vitest";
import { getWhatsAppPremiumUrl } from "./Pricing";

describe("Premium WhatsApp request link", () => {
  it("includes the exact Customer/User ID in the encoded message", () => {
    const customerId = "483aff58-3bbf-4e87-9849-19528de38e86";
    const url = getWhatsAppPremiumUrl(customerId);
    expect(url.startsWith("https://wa.me/2349039727490?text=")).toBe(true);
    expect(decodeURIComponent(url)).toContain(`Customer/User ID is: ${customerId}`);
  });
});
