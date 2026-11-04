import { Config } from './config.js';

export class AudioBookRequestClient {
    private config: Config;

    constructor(config: Config) {
        this.config = { ...config, baseUrl: config.baseUrl.replace(/\/+$/, '') };
    }

    async request(endpoint: string, options: RequestInit = {}) {
        const url = `${this.config.baseUrl}/api${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            ...options.headers,
        };

        try {
            const response = await fetch(url, { redirect: 'manual', ...options, headers });

            if (response.status >= 300 && response.status < 400) {
                throw new ABRClientError(
                    `ABR API redirected (${response.status}) to ${response.headers.get('location') ?? 'unknown'}; check ABR_BASE_URL and your API key`,
                    response.status
                );
            }

            if (!response.ok) {
                const errorBody = await response.text().catch(() => '');
                throw new ABRClientError(
                    `ABR API error ${response.status}: ${errorBody || response.statusText}`,
                    response.status
                );
            }

            const text = await response.text();
            if (!text) return null;
            try {
                return JSON.parse(text);
            } catch {
                throw new ABRClientError(
                    `ABR API returned non-JSON from ${endpoint}: ${text.slice(0, 200)}`,
                    response.status
                );
            }
        } catch (e) {
            if (e instanceof ABRClientError) throw e;
            throw new ABRClientError(`Failed to connect to AudioBookRequest at ${this.config.baseUrl}: ${e}`);
        }
    }

    async get(endpoint: string) {
        return this.request(endpoint);
    }

    async post(endpoint: string, body?: any) {
        return this.request(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async put(endpoint: string, body?: any) {
        return this.request(endpoint, {
            method: 'PUT',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async patch(endpoint: string, body?: any) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    async delete(endpoint: string) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

export class ABRClientError extends Error {
    status: number;

    constructor(message: string, status?: number) {
        super(message);
        this.name = 'ABRClientError';
        this.status = status || 0;
    }
}
