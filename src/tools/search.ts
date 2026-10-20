import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';
import { AudioBookRequestClient } from '../client.js';
import { toolName } from '../config.js';

export function registerSearchTools(server: McpServer, client: AudioBookRequestClient, prefix: string) {
    server.registerTool(
        toolName(prefix, 'search_books'),
        {
            description: 'Search for audiobooks by title, author, or narrator using the Audible API',
            inputSchema: z.object({
                query: z.string().describe('Search query (title, author, narrator)'),
                num_results: z.number().optional().default(20).describe('Number of results to return (max 100)'),
                page: z.number().optional().default(0).describe('Page number for pagination'),
            })
        },
        async ({ query, num_results, page }) => {
            try {
                // Clamp num_results to max 100
                const clampedNumResults = Math.min(num_results, 100);
                const params = new URLSearchParams({
                    q: query,
                    num_results: String(clampedNumResults),
                    page: String(page),
                });
                const results = await client.get(`/search?${params}`);
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
                return { content: [{ type: 'text', text: `Error searching books: ${e.message}` }], isError: true };
            }
        }
    );
}
