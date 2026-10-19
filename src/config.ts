export interface Config {
    baseUrl: string;
    apiKey: string;
    toolPrefix: string;
}

export function loadConfig(): Config {
    const baseUrl = process.env.ABR_BASE_URL || 'http://localhost:8000';
    const apiKey = process.env.ABR_API_KEY || '';
    const toolPrefix = process.env.TOOL_PREFIX || '';

    if (!apiKey) {
        console.warn('Warning: ABR_API_KEY not set');
    }

    return { baseUrl, apiKey, toolPrefix };
}

export function toolName(prefix: string, name: string): string {
    return prefix ? `${prefix}_${name}` : name;
}
