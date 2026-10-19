import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { loadConfig } from './config.js';
import { AudioBookRequestClient } from './client.js';
import { registerSearchTools } from './tools/search.js';
import { registerRequestTools } from './tools/requests.js';
import { registerDownloadTools } from './tools/downloads.js';
import { registerManualRequestTools } from './tools/manual.js';
import { registerUserTools } from './tools/users.js';
import { registerIndexerTools } from './tools/indexers.js';
import { registerRecommendationTools } from './tools/recommendations.js';
import { registerSettingsTools } from './tools/settings.js';

function createServer() {
    const config = loadConfig();
    const client = new AudioBookRequestClient(config);
    const server = new McpServer({ name: 'audiobookrequest', version: '1.0.0' });

    // Register all tool modules
    registerSearchTools(server, client, config.toolPrefix);
    registerRequestTools(server, client, config.toolPrefix);
    registerDownloadTools(server, client, config.toolPrefix);
    registerManualRequestTools(server, client, config.toolPrefix);
    registerUserTools(server, client, config.toolPrefix);
    registerIndexerTools(server, client, config.toolPrefix);
    registerRecommendationTools(server, client, config.toolPrefix);
    registerSettingsTools(server, client, config.toolPrefix);

    return server;
}

void serveStdio(createServer);
console.error('AudioBookRequest MCP server running on stdio');
console.error(`Connected to: ${process.env.ABR_BASE_URL || 'http://localhost:8000'}`);
