import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';
import { AudioBookRequestClient } from '../client.js';
import { toolName } from '../config.js';

export function registerIndexerTools(server: McpServer, client: AudioBookRequestClient, prefix: string) {
    // Get indexer configurations
    server.registerTool(
        toolName(prefix, 'get_indexer_configurations'),
        {
            description: 'Get configuration options for all indexers (admin only)',
            inputSchema: z.object({})
        },
        async () => {
            try {
                const results = await client.get('/indexers/configurations');
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error getting indexer configurations: ${e.message}` }], isError: true };
            }
        }
    );

    // Update indexer
    server.registerTool(
        toolName(prefix, 'update_indexer'),
        {
            description: 'Update indexer configuration values (admin only)',
            inputSchema: z.object({
                indexer: z.string().describe('Indexer name'),
                config: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).describe('Configuration values by key; use the types reported by get_indexer_configurations'),
            })
        },
        async ({ indexer, config }) => {
            try {
                await client.patch(`/indexers/${indexer}`, config);
                return { content: [{ type: 'text', text: `Indexer ${indexer} updated` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error updating indexer: ${e.message}` }], isError: true };
            }
        }
    );
}
