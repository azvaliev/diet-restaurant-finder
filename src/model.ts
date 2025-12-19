import { createGateway } from "ai";
import type { GatewayProviderOptions } from "@ai-sdk/gateway";
import { env } from "./env.ts";

const vercelAIProvider = createGateway({
  apiKey: env.aiGateway.apiKey,
});

export const model = vercelAIProvider("openai/gpt-oss-120b");

export const providerOptions = {
  gateway: {
    order: ["groq", "bedrock"],
    only: ["groq", "bedrock"],
  } satisfies GatewayProviderOptions,
} as const;
