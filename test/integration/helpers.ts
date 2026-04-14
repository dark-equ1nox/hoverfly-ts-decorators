import * as path from 'path';
import axios from 'axios';

export const ADMIN_PORT = 18888;
export const SERVICE_PORT = 18500;
export const ADMIN_URL = `http://localhost:${ADMIN_PORT}`;
export const SERVICE_URL = `http://localhost:${SERVICE_PORT}`;

export const CLIENT_OPTIONS = { port: ADMIN_PORT };

const FIXTURES = path.resolve(__dirname, '../fixtures');
export const USERS_SIM = path.join(FIXTURES, 'users.json');
export const PRODUCTS_SIM = path.join(FIXTURES, 'products.json');

export async function getSimulationPairs(): Promise<unknown[]> {
  const res = await axios.get(`${ADMIN_URL}/api/v2/simulation`);
  const data = res.data as { data: { pairs: unknown[] } };
  return data.data.pairs;
}
