import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';
import { AudioBookRequestClient } from '../client.js';
import { toolName } from '../config.js';

export function registerManualRequestTools(server: McpServer, client: AudioBookRequestClient, prefix: string) {
    // List manual requests
    server.registerTool(
        toolName(prefix, 'list_manual_requests'),
        {
            description: 'List all manual audiobook requests (not from Audible)',
            inputSchema: z.object({})
        },
        async () => {
            try {
                const results = await client.get('/requests/manual');
                // Map API response to expected format (authors[]/narrators[] → author/narrator)
                const mapped = results.map((r: any) => ({
                    ...r,
                    author: r.authors?.join(', ') || '',
                    narrator: r.narrators?.join(', ') || '',
                }));
                return { content: [{ type: 'text', text: JSON.stringify(mapped, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error listing manual requests: ${e.message}` }], isError: true };
            }
        }
    );

    // Create manual request
    server.registerTool(
        toolName(prefix, 'create_manual_request'),
        {
            description: 'Create a manual audiobook request (for books not on Audible)',
            inputSchema: z.object({
                title: z.string().describe('Book title'),
                author: z.string().describe('Author name(s), comma-separated'),
                narrator: z.string().optional().describe('Narrator name(s), comma-separated'),
                subtitle: z.string().optional().describe('Subtitle'),
                publish_date: z.string().optional().describe('Publish date'),
                info: z.string().optional().describe('Additional info'),
            })
        },
        async ({ title, author, narrator, subtitle, publish_date, info }) => {
            try {
                await client.post('/requests/manual', { title, author, narrator, subtitle, publish_date, info });
                return { content: [{ type: 'text', text: `Manual request created for "${title}"` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error creating manual request: ${e.message}` }], isError: true };
            }
        }
    );

    // Update manual request
    server.registerTool(
        toolName(prefix, 'update_manual_request'),
        {
            description: 'Update a manual audiobook request',
            inputSchema: z.object({
                id: z.string().describe('UUID of the manual request'),
                title: z.string().describe('Book title'),
                author: z.string().describe('Author name(s), comma-separated'),
                narrator: z.string().optional().describe('Narrator name(s), comma-separated'),
                subtitle: z.string().optional().describe('Subtitle'),
                publish_date: z.string().optional().describe('Publish date'),
                info: z.string().optional().describe('Additional info'),
            })
        },
        async ({ id, title, author, narrator, subtitle, publish_date, info }) => {
            try {
                await client.put(`/requests/manual/${id}`, { title, author, narrator, subtitle, publish_date, info });
                return { content: [{ type: 'text', text: `Manual request ${id} updated` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error updating manual request: ${e.message}` }], isError: true };
            }
        }
    );

    // Delete manual request
    server.registerTool(
        toolName(prefix, 'delete_manual_request'),
        {
            description: 'Delete a manual audiobook request (admin only)',
            inputSchema: z.object({
                id: z.string().describe('UUID of the manual request'),
            })
        },
        async ({ id }) => {
            try {
                await client.delete(`/requests/manual/${id}`);
                return { content: [{ type: 'text', text: `Manual request ${id} deleted` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error deleting manual request: ${e.message}` }], isError: true };
            }
        }
    );

    // Mark manual as downloaded
    server.registerTool(
        toolName(prefix, 'mark_manual_downloaded'),
        {
            description: 'Mark a manual request as downloaded (admin only)',
            inputSchema: z.object({
                id: z.string().describe('UUID of the manual request'),
            })
        },
        async ({ id }) => {
            try {
                await client.patch(`/requests/manual/${id}/downloaded`);
                return { content: [{ type: 'text', text: `Manual request ${id} marked as downloaded` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error marking manual request as downloaded: ${e.message}` }], isError: true };
            }
        }
    );
}
