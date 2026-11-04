import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';
import { AudioBookRequestClient } from '../client.js';
import { toolName } from '../config.js';

export function registerRecommendationTools(server: McpServer, client: AudioBookRequestClient, prefix: string) {
    // User-based recommendations
    server.registerTool(
        toolName(prefix, 'get_user_recommendations'),
        {
            description: 'Get personalized audiobook recommendations based on user request history',
            inputSchema: z.object({
                seed_asins: z.array(z.string()).optional().describe('Optional seed ASINs to base recommendations on'),
                limit: z.number().optional().default(20).describe('Max recommendations to return'),
                offset: z.number().optional().default(0).describe('Offset for pagination'),
            })
        },
        async ({ seed_asins, limit, offset }) => {
            try {
                const params = new URLSearchParams({
                    limit: String(limit),
                    offset: String(offset),
                });
                for (const asin of seed_asins ?? []) {
                    params.append('seed_asins', asin);
                }
                const results = await client.get(`/recommendations/user?${params}`);
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error getting user recommendations: ${e.message}` }], isError: true };
            }
        }
    );

    // Popular recommendations
    server.registerTool(
        toolName(prefix, 'get_popular_recommendations'),
        {
            description: 'Get popular audiobook recommendations based on request frequency',
            inputSchema: z.object({
                min_requests: z.number().optional().default(1).describe('Minimum number of requests to include'),
                limit: z.number().optional().default(10).describe('Max recommendations to return'),
                exclude_downloaded: z.boolean().optional().default(true).describe('Exclude already downloaded books'),
            })
        },
        async ({ min_requests, limit, exclude_downloaded }) => {
            try {
                const results = await client.get(
                    `/recommendations/popular?min_requests=${min_requests}&limit=${limit}&exclude_downloaded=${exclude_downloaded}`
                );
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error getting popular recommendations: ${e.message}` }], isError: true };
            }
        }
    );

    // Recently requested recommendations
    server.registerTool(
        toolName(prefix, 'get_recent_recommendations'),
        {
            description: 'Get recently requested audiobook recommendations',
            inputSchema: z.object({
                limit: z.number().optional().default(10).describe('Max recommendations to return'),
                days_back: z.number().optional().default(30).describe('Look back this many days'),
                exclude_downloaded: z.boolean().optional().default(true).describe('Exclude already downloaded books'),
            })
        },
        async ({ limit, days_back, exclude_downloaded }) => {
            try {
                const results = await client.get(
                    `/recommendations/recent?limit=${limit}&days_back=${days_back}&exclude_downloaded=${exclude_downloaded}`
                );
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error getting recent recommendations: ${e.message}` }], isError: true };
            }
        }
    );

    // Fallback recommendations
    server.registerTool(
        toolName(prefix, 'get_fallback_recommendations'),
        {
            description: 'Get fallback popular recommendations from Audible search (not based on user history)',
            inputSchema: z.object({
                limit: z.number().optional().default(10).describe('Max recommendations to return'),
            })
        },
        async ({ limit }) => {
            try {
                const results = await client.get(`/recommendations/fallback?limit=${limit}`);
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error getting fallback recommendations: ${e.message}` }], isError: true };
            }
        }
    );

    // Category recommendations
    server.registerTool(
        toolName(prefix, 'get_category_recommendations'),
        {
            description: 'Get recommendations by popular categories from Audible',
            inputSchema: z.object({})
        },
        async () => {
            try {
                const results = await client.get('/recommendations/categories');
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error getting category recommendations: ${e.message}` }], isError: true };
            }
        }
    );

    // Popular authors recommendations
    server.registerTool(
        toolName(prefix, 'get_author_recommendations'),
        {
            description: 'Get recommendations based on popular authors from request history',
            inputSchema: z.object({
                limit: z.number().optional().default(10).describe('Max recommendations to return'),
                exclude_downloaded: z.boolean().optional().default(true).describe('Exclude already downloaded books'),
                personal_favorites: z.boolean().optional().default(true).describe('Use personal request history'),
            })
        },
        async ({ limit, exclude_downloaded, personal_favorites }) => {
            try {
                const results = await client.get(
                    `/recommendations/authors?limit=${limit}&exclude_downloaded=${exclude_downloaded}&personal_favorites=${personal_favorites}`
                );
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error getting author recommendations: ${e.message}` }], isError: true };
            }
        }
    );

    // Popular narrators recommendations
    server.registerTool(
        toolName(prefix, 'get_narrator_recommendations'),
        {
            description: 'Get recommendations based on popular narrators from request history',
            inputSchema: z.object({
                limit: z.number().optional().default(10).describe('Max recommendations to return'),
                exclude_downloaded: z.boolean().optional().default(true).describe('Exclude already downloaded books'),
                personal_favorites: z.boolean().optional().default(true).describe('Use personal request history'),
            })
        },
        async ({ limit, exclude_downloaded, personal_favorites }) => {
            try {
                const results = await client.get(
                    `/recommendations/narrators?limit=${limit}&exclude_downloaded=${exclude_downloaded}&personal_favorites=${personal_favorites}`
                );
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error getting narrator recommendations: ${e.message}` }], isError: true };
            }
        }
    );
}
