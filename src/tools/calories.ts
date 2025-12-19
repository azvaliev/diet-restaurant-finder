import { Output, stepCountIs, tool, ToolLoopAgent } from "ai";
import { z } from "zod";
import { webSearch } from "@exalabs/ai-sdk";
import { env } from "../env.ts";
import { model, providerOptions } from "../model.ts";
import pRetry from "p-retry";

export const getCalorieCountInfoInputSchema = z.object({
  food: z.string().describe("The name of the food item to search for."),
  quantity: z
    .number()
    .min(0)
    .describe("The quantity of the food item to search for."),
  unit: z.string().describe("The unit of the food item to search for."),
  additionalDetails: z
    .string()
    .optional()
    .describe("Additional details about the food item."),
});

const getCalorieCountInfoOutputSchema = z.discriminatedUnion("success", [
  z
    .object({
      success: z.literal(true),
      calories: z.number().min(0).describe("rough estimate of calories"),
      protein: z.number().min(0).describe("rough estimate of grams of protein"),
    })
    .describe("this is returned when we succesfuly got the information"),
  z
    .object({
      success: z.literal(false),
      error: z
        .string()
        .describe(
          "error message to describe why we could not determine an answer",
        ),
      clarification_request: z
        .string()
        .optional()
        .describe("prompting questions for the caller to add more details"),
    })
    .describe(
      "this is returned when the user did not provide enough information for us to resolve the request",
    ),
]);

const getCalorieCountInfoAgent = new ToolLoopAgent({
  instructions:
    `Based on the user's input, we need to determine a rough macronutrient estimate of the food item\n` +
    `You can use the search tools to search for the food item and its nutritional information,\n` +
    `breaking it down into components to search if necessary.\n` +
    `IMPORTANT: If unsure, we would rather lean towards overestimating than underestimating`,
  tools: {
    webSearch: webSearch({
      apiKey: env.exa.apiKey,
      numResults: 5,
      contents: {
        livecrawl: "never",
      },
      excludeDomains: ["reddit.com"],
    }),
  },
  stopWhen: stepCountIs(6),
  model,
  providerOptions,
  output: Output.object({
    schema: getCalorieCountInfoOutputSchema,
  }),
});

/**
 * Tool for retrieving calorie and macronutrient information for food items.
 * Uses a nested agent with web search capabilities to find nutritional data.
 * Returns either successful nutritional information or an error with optional clarification request.
 *
 * @example
 * ```typescript
 * const result = await getCalorieCountInfoTool.execute({
 *   food: "neopolitan pizza with pepperoni and sausage",
 *   quantity: 1,
 *   unit: "whole pizza"
 * });
 * ```
 */
export const getCalorieCountInfoTool = tool({
  description: "Get information about the calorie count of a food item",
  inputSchema: getCalorieCountInfoInputSchema,
  inputExamples: [
    {
      input: {
        food: "neopolitan pizza with pepperoni and sausage",
        quantity: 1,
        unit: "whole pizza",
      },
    },
  ],
  execute: async (input) => {
    const res = await pRetry(
      () =>
        getCalorieCountInfoAgent.generate({
          prompt: JSON.stringify(input),
        }),
      { retries: 2 },
    );

    return res.output;
  },
  outputSchema: getCalorieCountInfoOutputSchema,
});
