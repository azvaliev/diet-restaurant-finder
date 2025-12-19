import { createGateway } from "ai";
import type { GatewayProviderOptions } from "@ai-sdk/gateway";
import { env } from "./env.ts";

const vercelAIProvider = createGateway({
  apiKey: env.aiGateway.apiKey,
});

// Using gpt-oss-120b to enable local inference eventually
export const model = vercelAIProvider("openai/gpt-oss-120b");

export const providerOptions = {
  gateway: {
    order: ["groq", "bedrock"],
    only: ["groq", "bedrock"],
  } satisfies GatewayProviderOptions,
} as const;
