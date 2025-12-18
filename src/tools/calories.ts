import { tool } from "ai";
import z from "zod";
import { webSearch } from "@exalabs/ai-sdk";
import { env } from "../env.ts";

export const getCalorieCountInfoInput = z.object({
  food: z.string().describe("The name of the food item to search for."),
  quantity: z
    .number()
    .min(0)
    .describe("The quantity of the food item to search for."),
  unit: z.string().describe("The unit of the food item to search for."),
});

export const getCalorieCountInfoTool = tool({
  description: "Get information about the calorie count of a food item",
  inputSchema: getCalorieCountInfoInput,
  inputExamples: [
    {
      input: {
        food: "neopolitan pizza with pepperoni and sausage",
        quantity: 1,
        unit: "whole pizza",
      },
    },
  ],
  execute: async ({ food, quantity, unit }, opts) => {
    const t = webSearch({
      apiKey: env.exa.apiKey,
    });

    return await t.execute!(
      {
        query: `calories in ${quantity} ${unit} ${food}`,
      },
      opts,
    );
  },
  // outputSchema: webSearch().outputSchema,
});
