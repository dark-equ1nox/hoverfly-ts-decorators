import axios, { AxiosError, AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { ResolvedSimulationOptions, SimulationOptions } from '../types';

export class HoverflyClient {
  private readonly http: AxiosInstance;
  private readonly baseURL: string;

  constructor(private readonly options: ResolvedSimulationOptions) {
    this.baseURL = `http://${options.host}:${options.port}`;
    this.http = axios.create({
      baseURL: this.baseURL,
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
    const url = `${this.baseURL}/api/v2/simulation`;
    try {
      await this.http[method]('/api/v2/simulation', simulation);
    } catch (err) {
      throw new Error(
        `hoverfly-ts-decorators: failed to load simulation from "${filePath}" via ${method.toUpperCase()} ${url}: ${formatError(err)}`,
      );
    }
  }

  async clearSimulations(): Promise<void> {
    const url = `${this.baseURL}/api/v2/simulation`;
    try {
      await this.http.delete('/api/v2/simulation');
    } catch (err) {
      throw new Error(
        `hoverfly-ts-decorators: failed to clear simulations via DELETE ${url}: ${formatError(err)}`,
      );
    }
  }
}

function formatError(err: unknown): string {
  if (err instanceof AxiosError) {
    const status = err.response?.status;
    const body = err.response?.data;
    const detail = body ? ` — response: ${JSON.stringify(body)}` : '';
    return status ? `HTTP ${status}${detail}` : err.message;
  }
  return err instanceof Error ? err.message : String(err);
}

export function createClient(options: SimulationOptions = {}): HoverflyClient {
  return new HoverflyClient({
    host: options.host ?? process.env['HOVERFLY_HOST'] ?? 'localhost',
    port: options.port ?? parseInt(process.env['HOVERFLY_PORT'] ?? '8888', 10),
    authToken: options.authToken ?? process.env['HOVERFLY_AUTH_TOKEN'],
    append: options.append ?? false,
  });
}
