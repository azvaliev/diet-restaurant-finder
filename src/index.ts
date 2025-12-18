import "dotenv/config";
import { findDietFriendlyLocationAgent } from "./agent.ts";
import { GatewayInternalServerError } from "@ai-sdk/gateway";
import { APICallError } from "ai";

const input = process.argv[2];

if (!input) {
  console.error("please provide input");
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
        break;
      case "tool-result":
        const output = "output" in part ? part.output : null;
        const places = Array.isArray(output) ? output : [];
        console.log(`[Found ${places.length} places]\n`);
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
