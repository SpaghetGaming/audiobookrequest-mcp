import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';
import { AudioBookRequestClient } from '../client.js';
import { toolName } from '../config.js';

export function registerUserTools(server: McpServer, client: AudioBookRequestClient, prefix: string) {
    // List users
    server.registerTool(
        toolName(prefix, 'list_users'),
        {
            description: 'List all users (admin only)',
            inputSchema: z.object({
                limit: z.number().optional().default(50).describe('Max users to return'),
                offset: z.number().optional().default(0).describe('Offset for pagination'),
            })
        },
        async ({ limit, offset }) => {
            try {
                const results = await client.get(`/users/?limit=${limit}&offset=${offset}`);
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error listing users: ${e.message}` }], isError: true };
            }
        }
    );

    // Get user
    server.registerTool(
        toolName(prefix, 'get_user'),
        {
            description: 'Get details of a specific user (admin only)',
            inputSchema: z.object({
                username: z.string().describe('Username to look up'),
            })
        },
        async ({ username }) => {
            try {
                const user = await client.get(`/users/${username}`);
                return { content: [{ type: 'text', text: JSON.stringify(user, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error getting user: ${e.message}` }], isError: true };
            }
        }
    );

    // Create user
    server.registerTool(
        toolName(prefix, 'create_user'),
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
                const user = await client.post('/users/', { username, password, group, root });
                return { content: [{ type: 'text', text: JSON.stringify(user, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error creating user: ${e.message}` }], isError: true };
            }
        }
    );

    // Update user
    server.registerTool(
        toolName(prefix, 'update_user'),
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
                const user = await client.put(`/users/${username}`, { password, group });
                return { content: [{ type: 'text', text: JSON.stringify(user, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error updating user: ${e.message}` }], isError: true };
            }
        }
    );

    // Delete user
    server.registerTool(
        toolName(prefix, 'delete_user'),
        {
            description: 'Delete a user (admin only)',
            inputSchema: z.object({
                username: z.string().describe('Username to delete'),
            })
        },
        async ({ username }) => {
            try {
                await client.delete(`/users/${username}`);
                return { content: [{ type: 'text', text: `User ${username} deleted` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error deleting user: ${e.message}` }], isError: true };
            }
        }
    );
}
