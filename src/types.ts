export interface SimulationOptions {
  /** Hoverfly admin API host. Defaults to HOVERFLY_HOST env var or 'localhost'. */
  host?: string;
  /** Hoverfly admin API port. Defaults to HOVERFLY_PORT env var or 8500. */
  port?: number;
  /** Bearer token for authenticated Hoverfly instances. Defaults to HOVERFLY_AUTH_TOKEN env var. */
  authToken?: string;
  /**
   * When true, uses POST /api/v2/simulation (append) instead of PUT (replace)
   * and skips the DELETE /api/v2/simulation clear step.
   * Defaults to false.
   */
  append?: boolean;
}

export interface ResolvedSimulationOptions {
  host: string;
  port: number;
  authToken?: string;
  append: boolean;
}
