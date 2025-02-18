// Make this file a module by adding explicit exports
interface EnvConfig {
  OPENAI_API_KEY: string | undefined;
  ANTHROPIC_API_KEY: string | undefined;
  GOOGLE_API_KEY: string | undefined;
  DEEPSEEK_API_KEY: string | undefined;  // Added DEEPSEEK_API_KEY
  DISCORD_WEBHOOK: string | undefined;
  TAVILY_API_KEY: string | undefined;
  SUPABASE_URL: string | undefined;   // New supabase key
  SUPABASE_KEY: string | undefined;    // New supabase key
}

export const config: EnvConfig = {
  OPENAI_API_KEY: process.env.REACT_APP_OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.REACT_APP_ANTHROPIC_API_KEY,
  GOOGLE_API_KEY: process.env.REACT_APP_GOOGLE_API_KEY,
  DEEPSEEK_API_KEY: process.env.REACT_APP_DEEPSEEK_API_KEY,  // Added DEEPSEEK_API_KEY assignment
  DISCORD_WEBHOOK: process.env.REACT_APP_DISCORD_WEBHOOK,
  TAVILY_API_KEY: process.env.REACT_APP_TAVILY_API_KEY,
  SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,   // New assignment
  SUPABASE_KEY: process.env.REACT_APP_SUPABASE_KEY,     // New assignment
};


export function validateConfig(): void {
  const required = [
    'OPENAI_API_KEY', 
    'ANTHROPIC_API_KEY', 
    'GOOGLE_API_KEY',
    'DEEPSEEK_API_KEY',
    'TAVILY_API_KEY',
    'SUPABASE_URL',    // New required variable
    'SUPABASE_KEY'     // New required variable
  ] as const;
  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing required environment variable: REACT_APP_${key}`);
    }
  }
  if (!process.env.REACT_APP_DISCORD_WEBHOOK) {
    throw new Error('REACT_APP_DISCORD_WEBHOOK is not defined. Check your .env file.');
  }
  if (!config.DISCORD_WEBHOOK) {
    throw new Error('Discord webhook URL is missing');
  }
}

// Ensure this is treated as a module
export default { config, validateConfig };
