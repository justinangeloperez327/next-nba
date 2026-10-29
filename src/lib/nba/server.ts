import { NbaFeedCache, NbaQuotaGuard } from "./cache.ts";
import { makeNbaProvider, readProviderConfig } from "./selection.ts";

// These quotas are PER SERVER RUNTIME, not global across regions, replicas or
// cold starts. Do not use this MVP as a high-traffic free-tier public service.
const selection = readProviderConfig();
const quota = selection.source === "api-nba"
  ? new NbaQuotaGuard(Date.now, selection.plan === "free" ? 8 : 120,
      selection.plan === "free" ? 90 : 7000)
  : new NbaQuotaGuard();

const { provider: nbaProvider, source: nbaSource } = makeNbaProvider({
  beforeRequest: () => quota.beforeRequest(),
  onRateLimit: (seconds) => quota.block(seconds ?? 60),
  onQuotaExhausted: () => quota.blockToNextUtcDay(),
});

export { nbaProvider, nbaSource };
export const nbaFeed = new NbaFeedCache(nbaProvider);
