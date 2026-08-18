import { describe, expect, it } from "vitest";
import { getConfirmationMessage, getConfirmationRedirect, hasConfirmedEmail } from "./authRedirect";

describe("auth confirmation redirect", () => {
  it("builds a deployed-origin confirmation URL without duplicate slashes", () => {
    expect(getConfirmationRedirect("https://streamvideo-h2f3nxnx.manus.space/")).toBe("https://streamvideo-h2f3nxnx.manus.space/?confirmed=1");
    expect(getConfirmationRedirect("https://a-test-ten.vercel.app/")).toBe("https://a-test-ten.vercel.app/?confirmed=1");
  });

  it("never sends confirmation email links to local or sandbox origins", () => {
    expect(getConfirmationRedirect("http://localhost:3000")).toBe("https://streamvideo-h2f3nxnx.manus.space/?confirmed=1");
    expect(getConfirmationRedirect("https://3000-example.us2.manus.computer")).toBe("https://streamvideo-h2f3nxnx.manus.space/?confirmed=1");
    expect(getConfirmationRedirect("http://127.0.0.1:5173/")).toBe("https://streamvideo-h2f3nxnx.manus.space/?confirmed=1");
  });

  it("recognizes only the explicit confirmation flag", () => {
    expect(hasConfirmedEmail("?confirmed=1")).toBe(true);
    expect(hasConfirmedEmail("?confirmed=0")).toBe(false);
    expect(getConfirmationMessage("?confirmed=1")).toContain("Email confirmed");
    expect(getConfirmationMessage("?mode=signup")).toBe("");
  });

  it("keeps the success state active when confirmation includes additional routing parameters", () => {
    expect(hasConfirmedEmail("?confirmed=1&source=email#access_token=redacted")).toBe(true);
    expect(getConfirmationMessage("?confirmed=1&source=email")).toBe("Email confirmed. Sign in to continue to your ELIZZY DOMAIN account.");
  });
});
