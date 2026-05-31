export interface FeatherConfig {
  port: number;
  host: string;
  featherDir: string;
}

export function loadConfig(): FeatherConfig {
  return {
    port: process.env.FEATHER_PORT ? parseInt(process.env.FEATHER_PORT, 10) : 0,
    host: process.env.FEATHER_HOST ?? "127.0.0.1",
    featherDir: process.env.FEATHER_DIR ?? ".feather",
  };
}
