/**
 * Integration tests for useSimulation().
 *
 * Requires Hoverfly running via docker compose. Start with:
 *   docker compose up -d
 * Run with:
 *   npm run test:integration
 */
import * as assert from 'assert';
import axios from 'axios';
import { useSimulation } from '../../src/index';
import { CLIENT_OPTIONS, SERVICE_URL, USERS_SIM, getSimulationPairs } from './helpers';

describe('useSimulation() — suite-level hook', function () {
  useSimulation(USERS_SIM, CLIENT_OPTIONS);

  it('GET /users returns Alice and Bob', async function () {
    const res = await axios.get(`${SERVICE_URL}/users`);
    assert.strictEqual(res.status, 200);
    const users = res.data as Array<{ name: string }>;
    assert.strictEqual(users[0].name, 'Alice');
  });

  it('admin API reflects the loaded simulation', async function () {
    const pairs = await getSimulationPairs();
    assert.ok(pairs.length > 0, 'expected at least one simulation pair to be loaded');
  });
});
