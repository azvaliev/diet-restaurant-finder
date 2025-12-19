# diet-locator-agent

An AI agent that helps you find diet-friendly food locations by searching for restaurants and retrieving calorie information for menu items.

## What it does

The agent searches for restaurants and food establishments using Google Maps Places API, retrieves nutritional information (calories and protein) for menu items using web search, and generates recommendations in a formatted markdown table.

## Prerequisites

- Node.js version 22 (use `nvm use` if you have nvm installed)
- Yarn package manager
- API keys for:
  - AI Gateway (for LLM access)
  - Google Maps Places API
  - Exa API (for web search)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn install
   ```

## Environment Setup

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Add your API keys to `.env`:
   ```
   AI_GATEWAY_API_KEY=your_ai_gateway_key
   GOOGLE_MAPS_API_KEY=your_google_maps_key
   EXA_API_KEY=your_exa_key
   ```

## Usage

Run the agent with a food query:

```bash
yarn start "Find healthy salad places in downtown Seattle, WA"
```

The agent will:

1. Search for restaurants matching your query
2. Retrieve calorie and protein information for menu items
3. Generate a markdown table with recommendations
4. Provide a summary of the findings
