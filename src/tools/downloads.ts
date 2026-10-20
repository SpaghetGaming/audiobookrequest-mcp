import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';
import { AudioBookRequestClient } from '../client.js';
import { toolName } from '../config.js';

export function registerDownloadTools(server: McpServer, client: AudioBookRequestClient, prefix: string) {
    // Get download sources
    server.registerTool(
        toolName(prefix, 'get_download_sources'),
        {
            description: 'Get available download sources for a book from Prowlarr (admin only)',
            inputSchema: z.object({
                asin: z.string().describe('ASIN of the book'),
                only_cached: z.boolean().optional().default(false).describe('Only return cached results'),
            })
        },
        async ({ asin, only_cached }) => {
            try {
                const results = await client.get(`/requests/${asin}/sources?only_cached=${only_cached}`);
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error getting download sources: ${e.message}` }], isError: true };
            }
        }
    );

    // Download specific source
    server.registerTool(
        toolName(prefix, 'download_book'),
        {
            description: 'Start downloading a specific source for a book (admin only)',
            inputSchema: z.object({
                asin: z.string().describe('ASIN of the book'),
                guid: z.string().describe('GUID of the download source'),
                indexer_id: z.number().describe('Indexer ID'),
            })
        },
        async ({ asin, guid, indexer_id }) => {
            try {
                await client.post(`/requests/${asin}/download`, { guid, indexer_id });
                return { content: [{ type: 'text', text: `Download started for ASIN ${asin}` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error starting download: ${e.message}` }], isError: true };
            }
        }
    );

    // Auto-download
    server.registerTool(
        toolName(prefix, 'auto_download'),
        {
            description: 'Start auto-download for a book using quality heuristics (trusted or admin only)',
            inputSchema: z.object({
                asin: z.string().describe('ASIN of the book'),
            })
        },
        async ({ asin }) => {
            try {
                await client.post(`/requests/${asin}/auto-download`);
                return { content: [{ type: 'text', text: `Auto-download started for ASIN ${asin}` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error starting auto-download: ${e.message}` }], isError: true };
            }
        }
    );
}
