import { RhinoComputeConfig, DEFAULT_PORTS, ComputePayload } from './index';

export class RhinoComputeClient {
  private config: RhinoComputeConfig;
  private activePortUrl: string | null = null;

  constructor(config: Partial<RhinoComputeConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:5000',
      apiKey: config.apiKey || 'MarioSalen_2024_Security',
      timeoutMs: config.timeoutMs || 30000
    };
  }

  public async discoverServer(): Promise<string | null> {
    const ports = DEFAULT_PORTS;
    for (const port of ports) {
      const url = `http://localhost:${port}/`;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(`${url}version`, {
          method: 'GET',
          headers: { RhinoComputeKey: this.config.apiKey },
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (response.status === 200 || response.status === 401) {
          this.activePortUrl = url;
          return url;
        }
      } catch (e) {
        // Continuar buscando puertos alternativos
      }
    }
    return null;
  }

  public async getIOStructure(ghBase64: string): Promise<any> {
    const url = this.activePortUrl || (await this.discoverServer());
    if (!url) {
      throw new Error('Servidor Rhino Compute no encontrado en los puertos configurados.');
    }

    const response = await fetch(`${url}io`, {
      method: 'POST',
      headers: {
        RhinoComputeKey: this.config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ algo: ghBase64, pointer: null })
    });

    if (!response.ok) {
      throw new Error(`Error en endpoint /io (${response.status}): ${await response.text()}`);
    }

    return await response.json();
  }

  public async computeGrasshopper(payload: ComputePayload): Promise<any> {
    const url = this.activePortUrl || (await this.discoverServer());
    if (!url) {
      throw new Error('Servidor Rhino Compute no encontrado.');
    }

    const response = await fetch(`${url}grasshopper`, {
      method: 'POST',
      headers: {
        RhinoComputeKey: this.config.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Error en endpoint /grasshopper (${response.status}): ${await response.text()}`);
    }

    return await response.json();
  }
}
