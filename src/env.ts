export const env = {
  aiGateway: {
    apiKey: getRequiredEnv("AI_GATEWAY_API_KEY"),
  },
  googleMaps: {
    apiKey: getRequiredEnv("GOOGLE_MAPS_API_KEY"),
  },
  exa: {
    apiKey: getRequiredEnv("EXA_API_KEY"),
  },
} as const;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
