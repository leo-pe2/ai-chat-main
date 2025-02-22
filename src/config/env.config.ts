// Updated to use import.meta.env for Vite (client-side)
interface EnvConfig {
  OPENAI_API_KEY: string | undefined;
  ANTHROPIC_API_KEY: string | undefined;
  GOOGLE_API_KEY: string | undefined;
  DEEPSEEK_API_KEY: string | undefined;
  DISCORD_WEBHOOK: string | undefined;
  TAVILY_API_KEY: string | undefined;
  SUPABASE_URL: string | undefined;
  SUPABASE_KEY: string | undefined;
  API_BASE_URL: string | undefined;
}

export const config: EnvConfig = {
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
  ANTHROPIC_API_KEY: import.meta.env.VITE_ANTHROPIC_API_KEY,
  GOOGLE_API_KEY: import.meta.env.VITE_GOOGLE_API_KEY,
  DEEPSEEK_API_KEY: import.meta.env.VITE_DEEPSEEK_API_KEY,
  DISCORD_WEBHOOK: import.meta.env.VITE_DISCORD_WEBHOOK,
  TAVILY_API_KEY: import.meta.env.VITE_TAVILY_API_KEY,
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_KEY: import.meta.env.VITE_SUPABASE_KEY,
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
};

export function validateConfig(): void {
  const required = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'GOOGLE_API_KEY',
    'DEEPSEEK_API_KEY',
    'TAVILY_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_KEY'
  ] as const;
  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing required environment variable: VITE_${key}`);
    }
  }
  if (!config.DISCORD_WEBHOOK) {
    throw new Error('Missing required environment variable: VITE_DISCORD_WEBHOOK');
  }
}

export default { config, validateConfig };
