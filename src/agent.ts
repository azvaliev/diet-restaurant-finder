import { hasToolCall, stepCountIs, tool, ToolLoopAgent } from "ai";
import { searchGoogleMapsTool } from "./tools/places.ts";
import { getCalorieCountInfoTool } from "./tools/calories.ts";
import { model, providerOptions } from "./model.ts";
import z from "zod";

export const findDietFriendlyLocationAgent = new ToolLoopAgent({
  model,
  maxOutputTokens: 100_000,
  instructions:
    "the user will ask you to help find diet-friendly food locations. Use the tool to find locations and the best options, no more than 5\n" +
    "IMPORTANT: when you've generated the 5 locations with a summary, write DONE\n" +
    `Your response should have the following format:
    Markdown table with columns for "Restaurant Name", "Address" (with google maps link), "Reccomended Order - Calories, Protein"\n` +
    `A quick summary (2-3 sentences) followed by the word DONE`,
  tools: {
    searchGoogleMaps: searchGoogleMapsTool,
    getCalorieCountInfo: getCalorieCountInfoTool,
    done: tool({
      description: "Call this tool when you have finished",
      inputSchema: z.object(),
      execute: async () => {
        console.error("done tool call");
      },
    }),
  },
  providerOptions,
  stopWhen: [
    stepCountIs(20),
    hasToolCall("done"),
    ({ steps }) => steps.some((step) => step.text.includes("DONE")),
  ],
});
