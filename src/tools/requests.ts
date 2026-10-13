import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';
import { AudioBookRequestClient } from '../client.js';
import { toolName } from '../config.js';

export function registerRequestTools(server: McpServer, client: AudioBookRequestClient, prefix: string) {
    // List requests
    server.registerTool(
        toolName(prefix, 'list_requests'),
        {
            description: 'List all audiobook requests (wishlist). Optionally filter by download status.',
            inputSchema: z.object({
                filter: z.enum(['all', 'downloaded', 'not_downloaded']).optional().default('all')
                    .describe('Filter by download status'),
            })
        },
        async ({ filter }) => {
            try {
                const results = await client.get(`/requests?filter=${filter}`);
                const requests = results.map((r: any) => ({
                    title: r.book.title,
                    asin: r.book.asin,
                    authors: r.book.authors,
                    downloaded: r.book.downloaded,
                    requested_by: r.requests.map((req: any) => req.user_username),
                    download_error: r.download_error,
                }));
                return { content: [{ type: 'text', text: JSON.stringify(requests, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error listing requests: ${e.message}` }], isError: true };
            }
        }
    );

    // Get specific request (FIXED: use direct endpoint)
    server.registerTool(
        toolName(prefix, 'get_request'),
        {
            description: 'Get details of a specific audiobook request by ASIN',
            inputSchema: z.object({
                asin: z.string().describe('ASIN or UUID of the book'),
            })
        },
        async ({ asin }) => {
            try {
                const request = await client.get(`/requests/${asin}`);
                if (!request) {
                    return { content: [{ type: 'text', text: `No request found for ASIN ${asin}` }] };
                }
                return { content: [{ type: 'text', text: JSON.stringify(request, null, 2) }] };
            } catch (e: any) {
                if (e.status === 404) {
                    return { content: [{ type: 'text', text: `No request found for ASIN ${asin}` }] };
                }
                return { content: [{ type: 'text', text: `Error getting request: ${e.message}` }], isError: true };
            }
        }
    );

    // Create request
    server.registerTool(
        toolName(prefix, 'request_book'),
        {
            description: 'Create a new audiobook request by ASIN',
            inputSchema: z.object({
                asin: z.string().describe('ASIN of the book to request'),
            })
        },
        async ({ asin }) => {
            try {
                await client.post(`/requests/${asin}`);
                return { content: [{ type: 'text', text: `Successfully requested book with ASIN ${asin}` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error requesting book: ${e.message}` }], isError: true };
            }
        }
    );

    // Cancel request
    server.registerTool(
        toolName(prefix, 'cancel_request'),
        {
            description: 'Cancel/delete an audiobook request by ASIN',
            inputSchema: z.object({
                asin: z.string().describe('ASIN of the book to cancel'),
            })
        },
        async ({ asin }) => {
            try {
                await client.delete(`/requests/${asin}`);
                return { content: [{ type: 'text', text: `Successfully cancelled request for ASIN ${asin}` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error cancelling request: ${e.message}` }], isError: true };
            }
        }
    );

    // Mark as downloaded
    server.registerTool(
        toolName(prefix, 'mark_downloaded'),
        {
            description: 'Mark a book as downloaded (admin only)',
            inputSchema: z.object({
                asin: z.string().describe('ASIN of the book to mark as downloaded'),
            })
        },
        async ({ asin }) => {
            try {
                await client.patch(`/requests/${asin}/downloaded`);
                return { content: [{ type: 'text', text: `Marked ASIN ${asin} as downloaded` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error marking as downloaded: ${e.message}` }], isError: true };
            }
        }
    );
}
