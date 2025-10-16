declare module "ultracite" {
  export type DeprecatedLevel = "ignore" | "warn" | "error" | string;

  export interface UltraciteRules {
    readonly deprecated?: DeprecatedLevel;
    readonly [key: string]: unknown;
  }

  export interface DeprecatedConfig {
    readonly warn?: boolean;
  }

  export interface UltraciteConfig {
    readonly deprecated?: DeprecatedConfig;
    readonly rules?: UltraciteRules;
  }

  export function defineConfig(config: UltraciteConfig): UltraciteConfig;
}
