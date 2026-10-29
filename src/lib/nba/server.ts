import { NbaFeedCache, NbaQuotaGuard } from "./cache.ts";
import { createBalldontlieProvider } from "./provider.ts";

// Shared per Node.js runtime. CDN caching helps across visitors, but memory
// does NOT enforce an account-wide budget across serverless instances.
const quota = new NbaQuotaGuard();
export const nbaProvider = createBalldontlieProvider({
  beforeRequest: () => quota.beforeRequest(),
  onRateLimit: (seconds) => quota.block(seconds ?? 60),
});
export const nbaFeed = new NbaFeedCache(nbaProvider);
