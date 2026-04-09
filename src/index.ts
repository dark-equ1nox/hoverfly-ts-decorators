import { createClient } from './client/hoverfly-client';
import { SimulationOptions } from './types';

/**
 * Registers a Mocha `before()` hook that clears all Hoverfly simulations
 * and loads the specified simulation file before all tests in the enclosing
 * `describe` block.
 *
 * Call this inside a `describe` block:
 *
 * ```typescript
 * describe('User service', function() {
 *   useSimulation('./simulations/users.json');
 *   it('...', async function() { ... });
 * });
 * ```
 */
export function useSimulation(filePath: string, options?: SimulationOptions): void {
  const client = createClient(options);
  before(async () => {
    if (!options?.append) {
      await client.clearSimulations();
    }
    await client.loadSimulation(filePath);
  });
}

/**
 * Clears all Hoverfly simulations and loads the specified simulation file.
 * Call this directly inside an `it()` body when you need per-test control.
 *
 * ```typescript
 * it('product endpoint works', async function() {
 *   await loadSimulation('./simulations/products.json');
 *   // ...
 * });
 * ```
 */
export async function loadSimulation(filePath: string, options?: SimulationOptions): Promise<void> {
  const client = createClient(options);
  if (!options?.append) {
    await client.clearSimulations();
  }
  await client.loadSimulation(filePath);
}

export { HoverflyClient, createClient } from './client/hoverfly-client';
export type { SimulationOptions, ResolvedSimulationOptions } from './types';
