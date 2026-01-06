import type { Config } from "vike/types";

export default {
  // Enable pre-rendering (SSG)
  prerender: true,

  // Client routing for SPA-like navigation
  clientRouting: true,

  // Hydration strategy
  hydrationCanBeAborted: true,

  passToClient: ["pageProps"],
} satisfies Config;
