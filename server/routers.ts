import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { generateImage } from "./_core/imageGeneration";
import { z } from "zod";
import { generateWebDraft, renderWebDraftHtml, WebDraftSchema } from "./webBuilder";
import { storagePut } from "./storage";
import { cloneAuthorizedWebsite } from "./webClone";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  image: router({
    generate: protectedProcedure
      .input(z.object({ prompt: z.string().trim().min(3).max(1200), quality: z.enum(["medium", "high"]).default("medium") }))
      .mutation(async ({ input }) => {
        const result = await generateImage({ prompt: input.prompt, quality: input.quality });
        if (!result.url) throw new Error("Image generation returned no image file.");
        return { url: result.url };
      }),
  }),

  webClone: router({
    clone: protectedProcedure
      .input(z.object({ targetUrl: z.string().trim().min(8).max(2000), authorized: z.literal(true) }))
      .mutation(async ({ input }) => cloneAuthorizedWebsite(input.targetUrl)),
  }),

  webBuilder: router({
    generate: protectedProcedure
      .input(z.object({ prompt: z.string().trim().min(12).max(1200) }))
      .mutation(async ({ input }) => generateWebDraft(input.prompt)),
    publish: protectedProcedure
      .input(z.object({ draft: WebDraftSchema }))
      .mutation(async ({ input, ctx }) => {
        const html = renderWebDraftHtml(input.draft);
        const slug = input.draft.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "site";
        const uploaded = await storagePut(`web-builder/${ctx.user.id}/${slug}.html`, html, "text/html; charset=utf-8");
        return { url: uploaded.url, key: uploaded.key, title: input.draft.title };
      }),
  }),
});

export type AppRouter = typeof appRouter;
