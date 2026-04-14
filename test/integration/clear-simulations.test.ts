/**
 * Integration tests for HoverflyClient.clearSimulations().
 *
 * Requires Hoverfly running via docker compose. Start with:
 *   docker compose up -d
 * Run with:
 *   npm run test:integration
 */
import * as assert from 'assert';
import axios from 'axios';
import { loadSimulation, createClient } from '../../src/index';
import { CLIENT_OPTIONS, SERVICE_URL, USERS_SIM, getSimulationPairs } from './helpers';

describe('clearSimulations() — actual clearing behavior', function () {
  const client = createClient(CLIENT_OPTIONS);

  before(async function () {
    await loadSimulation(USERS_SIM, CLIENT_OPTIONS);
  });

  it('simulation is loaded and GET /users responds before clearing', async function () {
    const res = await axios.get(`${SERVICE_URL}/users`);
    assert.strictEqual(res.status, 200);
    const users = res.data as Array<{ name: string }>;
    assert.strictEqual(users[0].name, 'Alice');
  });

  it('admin API reports 0 pairs after clearSimulations()', async function () {
    await client.clearSimulations();
    const pairs = await getSimulationPairs();
    assert.strictEqual(pairs.length, 0, `expected 0 pairs after clear, got ${pairs.length}`);
  });

  it('GET /users returns no-match response after clearSimulations()', async function () {
    await assert.rejects(
      () => axios.get(`${SERVICE_URL}/users`),
      (err: unknown) => {
        assert.ok(err instanceof Error, 'expected an Error');
        return true;
      },
    );
  });
});
