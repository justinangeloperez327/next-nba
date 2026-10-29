import { createApiNbaProvider } from "./api-nba.ts";
import { createNbaPythonProvider } from "./nba-python.ts";
import { createBalldontlieProvider } from "./provider.ts";
import type { NbaDataSource, NbaProvider } from "./types.ts";

export type ProviderConfig = {
  source: NbaDataSource;
  plan: "free" | "pro";
};

export function readProviderConfig(env: Record<string, string | undefined> = process.env): ProviderConfig {
  // Use the no-subscription, self-hosted swar/nba_api bridge unless explicitly overridden.
  const raw = env.NBA_DATA_PROVIDER?.trim();
  if (raw && raw !== "balldontlie" && raw !== "api-nba" && raw !== "nba-api") {
    throw new Error("NBA_DATA_PROVIDER must be balldontlie, api-nba or nba-api");
  }
  const plan = env.API_NBA_PLAN === "pro" ? "pro" : "free";
  if (env.API_NBA_PLAN && !["free", "pro"].includes(env.API_NBA_PLAN)) {
    throw new Error("API_NBA_PLAN must be free or pro");
  }
  return { source: raw === "api-nba" ? "api-nba" : raw === "balldontlie" ? "balldontlie" : "nba-api", plan };
}

export type FactoryOptions = {
  beforeRequest?: () => void;
  onRateLimit?: (seconds?: number) => void;
  onQuotaExhausted?: () => void;
  env?: Record<string, string | undefined>;
  fetcher?: typeof fetch;
};

export function makeNbaProvider(options: FactoryOptions = {}): {
  provider: NbaProvider;
  source: NbaDataSource;
  plan: "free" | "pro";
} {
  const env = options.env ?? process.env;
  const config = readProviderConfig(env);
  const shared = {
    beforeRequest: options.beforeRequest,
    onRateLimit: options.onRateLimit,
    fetcher: options.fetcher,
  };
  if (config.source === "api-nba") {
    return {
      provider: createApiNbaProvider({
        ...shared, apiKey: env.API_NBA_KEY, plan: config.plan,
        onQuotaExhausted: options.onQuotaExhausted,
      }),
      ...config,
    };
  }
  if (config.source === "nba-api") {
    return {
      provider: createNbaPythonProvider({
        ...shared,
        baseUrl: env.NBA_API_BRIDGE_URL,
        token: env.NBA_API_BRIDGE_TOKEN,
      }),
      ...config,
    };
  }
  return {
    provider: createBalldontlieProvider({ ...shared, apiKey: env.BALLDONTLIE_API_KEY }),
    ...config,
  };
}
