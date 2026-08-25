import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { generateImage } from "./_core/imageGeneration";
import { z } from "zod";

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
});

export type AppRouter = typeof appRouter;
