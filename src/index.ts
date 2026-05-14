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

async function loadMultiple(
  filePaths: string[],
  options: SimulationOptions | undefined,
  clearSimulations: boolean,
): Promise<void> {
  if (filePaths.length === 0) {
    throw new Error(
      'hoverfly-ts-decorators: loadSimulations() requires at least one file path, but received an empty array',
    );
  }
  const appendClient = createClient({ ...options, append: true });
  if (clearSimulations) {
    await appendClient.clearSimulations();
  }
  for (const filePath of filePaths) {
    await appendClient.loadSimulation(filePath);
  }
}

/**
 * Clears all Hoverfly simulations (unless `clearSimulations` is `false`) and
 * loads each file in `filePaths` in order by appending to Hoverfly.
 *
 * ```typescript
 * await loadSimulations(['./simulations/users.json', './simulations/products.json']);
 * ```
 */
export async function loadSimulations(
  filePaths: string[],
  options?: SimulationOptions,
  clearSimulations = true,
): Promise<void> {
  await loadMultiple(filePaths, options, clearSimulations);
}

/**
 * Registers a Mocha `before()` hook that clears all Hoverfly simulations
 * (unless `clearSimulations` is `false`) and loads each file in `filePaths`
 * in order before all tests in the enclosing `describe` block.
 *
 * ```typescript
 * describe('API suite', function() {
 *   useSimulations(['./simulations/users.json', './simulations/products.json']);
 *   it('...', async function() { ... });
 * });
 * ```
 */
export function useSimulations(
  filePaths: string[],
  options?: SimulationOptions,
  clearSimulations = true,
): void {
  before(async () => {
    await loadMultiple(filePaths, options, clearSimulations);
  });
}

export { HoverflyClient, createClient } from './client/hoverfly-client';
export type { SimulationOptions, ResolvedSimulationOptions } from './types';
