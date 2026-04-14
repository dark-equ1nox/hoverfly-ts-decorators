import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { ResolvedSimulationOptions, SimulationOptions } from '../types';

export class HoverflyClient {
  private readonly http: AxiosInstance;

  constructor(private readonly options: ResolvedSimulationOptions) {
    this.http = axios.create({
      baseURL: `http://${options.host}:${options.port}`,
      headers: options.authToken
        ? { Authorization: `Bearer ${options.authToken}` }
        : {},
    });
  }

  async loadSimulation(filePath: string): Promise<void> {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);

    const content = fs.readFileSync(absolutePath, 'utf-8');
    const simulation = JSON.parse(content);

    const method = this.options.append ? 'post' : 'put';
    await this.http[method]('/api/v2/simulation', simulation);
  }

  async clearSimulations(): Promise<void> {
    await this.http.delete('/api/v2/simulation');
  }
}

export function createClient(options: SimulationOptions = {}): HoverflyClient {
  return new HoverflyClient({
    host: options.host ?? process.env['HOVERFLY_HOST'] ?? 'localhost',
    port: options.port ?? parseInt(process.env['HOVERFLY_PORT'] ?? '8500', 10),
    authToken: options.authToken ?? process.env['HOVERFLY_AUTH_TOKEN'],
    append: options.append ?? false,
  });
}
