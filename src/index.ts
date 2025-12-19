import "dotenv/config";
import { findDietFriendlyLocationAgent } from "./agent.ts";
import { GatewayInternalServerError } from "@ai-sdk/gateway";
import { APICallError } from "ai";

const input = process.argv[2];

if (!input) {
  console.error('Usage: yarn start "<your food query>"');
  console.error(
    'Example: yarn start "Find healthy salad places in downtown Seattle, WA"',
  );
  process.exit(1);
}

try {
  const result = await findDietFriendlyLocationAgent.stream({
    prompt: input,
  });

  for await (const part of result.fullStream) {
    switch (part.type) {
      case "text-delta":
        process.stdout.write(part.text);
        break;
      case "tool-call":
        console.log(`\n[Calling ${part.toolName}]`);
        console.log(JSON.stringify(part.input, null, 2));
        console.log();
        break;
      case "tool-result":
        break;
    }
  }
  console.log();
} catch (error) {
  if (
    error instanceof GatewayInternalServerError &&
    error.cause instanceof APICallError
  ) {
    console.error("request failed");
    console.error(error.message);
    console.error(JSON.stringify(error.cause.requestBodyValues, null, 2));
    process.exit(1);
  }

  throw error;
}
