import { env } from "./env.ts";
import { createGateway, ToolLoopAgent } from "ai";
import type { GatewayProviderOptions } from "@ai-sdk/gateway";
import { searchGoogleMapsTool } from "./tools/places.ts";
import { getCalorieCountInfoTool } from "./tools/calories.ts";

const vercelAIProvider = createGateway({
  apiKey: env.aiGateway.apiKey,
});

const model = vercelAIProvider("openai/gpt-oss-120b");

const providerOptions = {
  gateway: {
    order: ["groq", "bedrock"],
    only: ["groq", "bedrock"],
  } satisfies GatewayProviderOptions,
} as const;

export const findDietFriendlyLocationAgent = new ToolLoopAgent({
  model,
  maxOutputTokens: 100_000,
  instructions:
    "the user will ask you to help find diet-friendly food locations. Use the tool to find locations and return the best options\n" +
    "include google maps links in your response, and estimate the calorie count of the food",
  tools: {
    searchGoogleMaps: searchGoogleMapsTool,
    getCalorieCountInfo: getCalorieCountInfoTool,
  },
  providerOptions,
});
