import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

const ABR_BASE_URL = process.env.ABR_BASE_URL || 'http://localhost:8000';
const ABR_API_KEY = process.env.ABR_API_KEY || '';

async function abrRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${ABR_BASE_URL}/api${endpoint}`;
    const headers = {
        'Authorization': `Bearer ${ABR_API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`ABR API error ${response.status}: ${errorBody}`);
    }

    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text);
}

function createServer(): McpServer {
    const server = new McpServer({ name: 'audiobookrequest', version: '1.0.0' });

    // Search for audiobooks
    server.registerTool(
        'search_books',
        {
            description: 'Search for audiobooks by title, author, or narrator using the Audible API',
            inputSchema: z.object({
                query: z.string().describe('Search query (title, author, narrator)'),
                num_results: z.number().optional().default(20).describe('Number of results to return'),
                page: z.number().optional().default(0).describe('Page number for pagination'),
            })
        },
        async ({ query, num_results, page }) => {
            try {
                const results = await abrRequest(`/search?q=${encodeURIComponent(query)}&num_results=${num_results}&page=${page}`);
                const books = results.map((r: any) => ({
                    title: r.book.title,
                    subtitle: r.book.subtitle,
                    asin: r.book.asin,
                    authors: r.book.authors,
                    narrators: r.book.narrators,
                    runtime_min: r.book.runtime_length_min,
                    released: r.book.release_date,
                    cover: r.book.cover_image,
                    downloaded: r.book.downloaded,
                    requested_by: r.requests.map((req: any) => req.user_username),
                }));
                return { content: [{ type: 'text', text: JSON.stringify(books, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // List all requests (wishlist)
    server.registerTool(
        'list_requests',
        {
            description: 'List all audiobook requests (wishlist). Optionally filter by download status.',
            inputSchema: z.object({
                filter: z.enum(['all', 'downloaded', 'not_downloaded']).optional().default('all')
                    .describe('Filter by download status'),
            })
        },
        async ({ filter }) => {
            try {
                const results = await abrRequest(`/requests?filter=${filter}`);
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
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // Get specific request details
    server.registerTool(
        'get_request',
        {
            description: 'Get details of a specific audiobook request by ASIN',
            inputSchema: z.object({
                asin: z.string().describe('ASIN or UUID of the book'),
            })
        },
        async ({ asin }) => {
            try {
                const results = await abrRequest('/requests');
                const request = results.find((r: any) => r.book.asin === asin);
                if (!request) {
                    return { content: [{ type: 'text', text: `No request found for ASIN ${asin}` }] };
                }
                return { content: [{ type: 'text', text: JSON.stringify(request, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // Create a new request
    server.registerTool(
        'request_book',
        {
            description: 'Create a new audiobook request by ASIN',
            inputSchema: z.object({
                asin: z.string().describe('ASIN of the book to request'),
            })
        },
        async ({ asin }) => {
            try {
                await abrRequest(`/requests/${asin}`, { method: 'POST' });
                return { content: [{ type: 'text', text: `Successfully requested book with ASIN ${asin}` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // Cancel a request
    server.registerTool(
        'cancel_request',
        {
            description: 'Cancel/delete an audiobook request by ASIN',
            inputSchema: z.object({
                asin: z.string().describe('ASIN of the book to cancel'),
            })
        },
        async ({ asin }) => {
            try {
                await abrRequest(`/requests/${asin}`, { method: 'DELETE' });
                return { content: [{ type: 'text', text: `Successfully cancelled request for ASIN ${asin}` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // Mark as downloaded
    server.registerTool(
        'mark_downloaded',
        {
            description: 'Mark a book as downloaded (admin only)',
            inputSchema: z.object({
                asin: z.string().describe('ASIN of the book to mark as downloaded'),
            })
        },
        async ({ asin }) => {
            try {
                await abrRequest(`/requests/${asin}/downloaded`, { method: 'PATCH' });
                return { content: [{ type: 'text', text: `Marked ASIN ${asin} as downloaded` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // Get download sources
    server.registerTool(
        'get_download_sources',
        {
            description: 'Get available download sources for a book from Prowlarr',
            inputSchema: z.object({
                asin: z.string().describe('ASIN of the book'),
                only_cached: z.boolean().optional().default(false).describe('Only return cached results'),
            })
        },
        async ({ asin, only_cached }) => {
            try {
                const results = await abrRequest(`/requests/${asin}/sources?only_cached=${only_cached}`);
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // Download a book
    server.registerTool(
        'download_book',
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
                await abrRequest(`/requests/${asin}/download`, {
                    method: 'POST',
                    body: JSON.stringify({ guid, indexer_id }),
                });
                return { content: [{ type: 'text', text: `Download started for ASIN ${asin}` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // Auto-download
    server.registerTool(
        'auto_download',
        {
            description: 'Start auto-download for a book (uses quality heuristics)',
            inputSchema: z.object({
                asin: z.string().describe('ASIN of the book'),
            })
        },
        async ({ asin }) => {
            try {
                await abrRequest(`/requests/${asin}/auto-download`, { method: 'POST' });
                return { content: [{ type: 'text', text: `Auto-download started for ASIN ${asin}` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // List manual requests
    server.registerTool(
        'list_manual_requests',
        {
            description: 'List all manual audiobook requests (not from Audible)',
            inputSchema: z.object({})
        },
        async () => {
            try {
                const results = await abrRequest('/requests/manual');
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // Create manual request
    server.registerTool(
        'create_manual_request',
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
                await abrRequest('/requests/manual', {
                    method: 'POST',
                    body: JSON.stringify({ title, author, narrator, subtitle, publish_date, info }),
                });
                return { content: [{ type: 'text', text: `Manual request created for "${title}"` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // Update manual request
    server.registerTool(
        'update_manual_request',
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
                await abrRequest(`/requests/manual/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ title, author, narrator, subtitle, publish_date, info }),
                });
                return { content: [{ type: 'text', text: `Manual request ${id} updated` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // Delete manual request
    server.registerTool(
        'delete_manual_request',
        {
            description: 'Delete a manual audiobook request (admin only)',
            inputSchema: z.object({
                id: z.string().describe('UUID of the manual request'),
            })
        },
        async ({ id }) => {
            try {
                await abrRequest(`/requests/manual/${id}`, { method: 'DELETE' });
                return { content: [{ type: 'text', text: `Manual request ${id} deleted` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // Mark manual as downloaded
    server.registerTool(
        'mark_manual_downloaded',
        {
            description: 'Mark a manual request as downloaded (admin only)',
            inputSchema: z.object({
                id: z.string().describe('UUID of the manual request'),
            })
        },
        async ({ id }) => {
            try {
                await abrRequest(`/requests/manual/${id}/downloaded`, { method: 'PATCH' });
                return { content: [{ type: 'text', text: `Manual request ${id} marked as downloaded` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // List users
    server.registerTool(
        'list_users',
        {
            description: 'List all users (admin only)',
            inputSchema: z.object({
                limit: z.number().optional().default(50).describe('Max users to return'),
                offset: z.number().optional().default(0).describe('Offset for pagination'),
            })
        },
        async ({ limit, offset }) => {
            try {
                const results = await abrRequest(`/users/?limit=${limit}&offset=${offset}`);
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // Get user
    server.registerTool(
        'get_user',
        {
            description: 'Get details of a specific user (admin only)',
            inputSchema: z.object({
                username: z.string().describe('Username to look up'),
            })
        },
        async ({ username }) => {
            try {
                const results = await abrRequest(`/users/${username}`);
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // Create user
    server.registerTool(
        'create_user',
        {
            description: 'Create a new user (admin only)',
            inputSchema: z.object({
                username: z.string().describe('Username'),
                password: z.string().describe('Password'),
                group: z.enum(['untrusted', 'trusted', 'admin']).optional().default('untrusted')
                    .describe('User group'),
                root: z.boolean().optional().default(false).describe('Make root admin'),
            })
        },
        async ({ username, password, group, root }) => {
            try {
                const results = await abrRequest('/users/', {
                    method: 'POST',
                    body: JSON.stringify({ username, password, group, root }),
                });
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // Update user
    server.registerTool(
        'update_user',
        {
            description: 'Update a user (admin only)',
            inputSchema: z.object({
                username: z.string().describe('Username to update'),
                password: z.string().optional().describe('New password'),
                group: z.enum(['untrusted', 'trusted', 'admin']).optional().describe('New group'),
            })
        },
        async ({ username, password, group }) => {
            try {
                const results = await abrRequest(`/users/${username}`, {
                    method: 'PUT',
                    body: JSON.stringify({ password, group }),
                });
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // Delete user
    server.registerTool(
        'delete_user',
        {
            description: 'Delete a user (admin only)',
            inputSchema: z.object({
                username: z.string().describe('Username to delete'),
            })
        },
        async ({ username }) => {
            try {
                await abrRequest(`/users/${username}`, { method: 'DELETE' });
                return { content: [{ type: 'text', text: `User ${username} deleted` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // Get indexer configurations
    server.registerTool(
        'get_indexer_configurations',
        {
            description: 'Get configuration options for all indexers (admin only)',
            inputSchema: z.object({})
        },
        async () => {
            try {
                const results = await abrRequest('/indexers/configurations');
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // Update indexer
    server.registerTool(
        'update_indexer',
        {
            description: 'Update indexer configuration values (admin only)',
            inputSchema: z.object({
                indexer: z.string().describe('Indexer name'),
                config: z.record(z.string()).describe('Key-value pairs of configuration to update'),
            })
        },
        async ({ indexer, config }) => {
            try {
                await abrRequest(`/indexers/${indexer}`, {
                    method: 'PATCH',
                    body: JSON.stringify(config),
                });
                return { content: [{ type: 'text', text: `Indexer ${indexer} updated` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    // Health check
    server.registerTool(
        'health_check',
        {
            description: 'Check if the AudioBookRequest instance is healthy',
            inputSchema: z.object({})
        },
        async () => {
            try {
                await abrRequest('/health');
                return { content: [{ type: 'text', text: 'AudioBookRequest is healthy' }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
            }
        }
    );

    return server;
}

void serveStdio(createServer);
console.error('AudioBookRequest MCP server running on stdio');
console.error(`Connected to: ${ABR_BASE_URL}`);