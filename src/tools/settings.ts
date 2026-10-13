import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';
import { AudioBookRequestClient } from '../client.js';
import { toolName } from '../config.js';

export function registerSettingsTools(server: McpServer, client: AudioBookRequestClient, prefix: string) {
    // Notification settings
    server.registerTool(
        toolName(prefix, 'list_notifications'),
        {
            description: 'List all notification configurations (admin only)',
            inputSchema: z.object({})
        },
        async () => {
            try {
                const results = await client.get('/settings/notifications');
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error listing notifications: ${e.message}` }], isError: true };
            }
        }
    );

    server.registerTool(
        toolName(prefix, 'create_notification'),
        {
            description: 'Create or update a notification configuration (admin only)',
            inputSchema: z.object({
                name: z.string().describe('Notification name'),
                url: z.string().describe('Notification webhook URL'),
                event_type: z.string().describe('Event type (e.g., request_created, download_completed)'),
                body: z.string().describe('Notification body template'),
                body_type: z.enum(['json', 'form']).describe('Body type'),
                headers: z.string().optional().default('{}').describe('JSON headers'),
            })
        },
        async ({ name, url, event_type, body, body_type, headers }) => {
            try {
                const result = await client.post('/settings/notifications', {
                    name, url, event_type, body, body_type, headers,
                });
                return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error creating notification: ${e.message}` }], isError: true };
            }
        }
    );

    server.registerTool(
        toolName(prefix, 'delete_notification'),
        {
            description: 'Delete a notification configuration (admin only)',
            inputSchema: z.object({
                id: z.string().describe('Notification UUID'),
            })
        },
        async ({ id }) => {
            try {
                await client.delete(`/settings/notifications/${id}`);
                return { content: [{ type: 'text', text: `Notification ${id} deleted` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error deleting notification: ${e.message}` }], isError: true };
            }
        }
    );

    server.registerTool(
        toolName(prefix, 'test_notification'),
        {
            description: 'Send a test notification (admin only)',
            inputSchema: z.object({
                id: z.string().describe('Notification UUID to test'),
            })
        },
        async ({ id }) => {
            try {
                await client.post(`/settings/notifications/${id}/test`);
                return { content: [{ type: 'text', text: `Test notification sent for ${id}` }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error testing notification: ${e.message}` }], isError: true };
            }
        }
    );

    // Download settings
    server.registerTool(
        toolName(prefix, 'get_download_settings'),
        {
            description: 'Get download and quality settings (admin only)',
            inputSchema: z.object({})
        },
        async () => {
            try {
                const results = await client.get('/settings/download');
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error getting download settings: ${e.message}` }], isError: true };
            }
        }
    );

    server.registerTool(
        toolName(prefix, 'update_download_settings'),
        {
            description: 'Update download and quality settings (admin only)',
            inputSchema: z.object({
                auto_download: z.boolean().describe('Enable auto-download'),
                flac_range: z.object({ min: z.number(), max: z.number() }).describe('FLAC quality range (kbps)'),
                m4b_range: z.object({ min: z.number(), max: z.number() }).describe('M4B quality range (kbps)'),
                mp3_range: z.object({ min: z.number(), max: z.number() }).describe('MP3 quality range (kbps)'),
                unknown_audio_range: z.object({ min: z.number(), max: z.number() }).describe('Unknown audio quality range'),
                unknown_range: z.object({ min: z.number(), max: z.number() }).describe('Unknown quality range'),
                min_seeders: z.number().describe('Minimum seeders required'),
                name_ratio: z.number().describe('Name match ratio (0-100)'),
                title_ratio: z.number().describe('Title match ratio (0-100)'),
            })
        },
        async (settings) => {
            try {
                await client.patch('/settings/download', settings);
                return { content: [{ type: 'text', text: 'Download settings updated' }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error updating download settings: ${e.message}` }], isError: true };
            }
        }
    );

    // Instance settings
    server.registerTool(
        toolName(prefix, 'get_instance_settings'),
        {
            description: 'Get instance settings (admin only)',
            inputSchema: z.object({})
        },
        async () => {
            try {
                const results = await client.get('/settings/instance');
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error getting instance settings: ${e.message}` }], isError: true };
            }
        }
    );

    server.registerTool(
        toolName(prefix, 'update_instance_settings'),
        {
            description: 'Update instance settings (admin only)',
            inputSchema: z.object({
                instance_name: z.string().optional().describe('Instance name'),
                instance_description: z.string().optional().describe('Instance description'),
            })
        },
        async (settings) => {
            try {
                await client.patch('/settings/instance', settings);
                return { content: [{ type: 'text', text: 'Instance settings updated' }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error updating instance settings: ${e.message}` }], isError: true };
            }
        }
    );

    // Audiobookshelf settings
    server.registerTool(
        toolName(prefix, 'get_abs_settings'),
        {
            description: 'Get Audiobookshelf integration settings (admin only)',
            inputSchema: z.object({})
        },
        async () => {
            try {
                const results = await client.get('/settings/audiobookshelf');
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error getting Audiobookshelf settings: ${e.message}` }], isError: true };
            }
        }
    );

    server.registerTool(
        toolName(prefix, 'update_abs_settings'),
        {
            description: 'Update Audiobookshelf integration settings (admin only)',
            inputSchema: z.object({
                abs_enabled: z.boolean().describe('Enable Audiobookshelf integration'),
                abs_url: z.string().optional().describe('Audiobookshelf server URL'),
                abs_token: z.string().optional().describe('Audiobookshelf API token'),
                abs_library: z.string().optional().describe('Target library name'),
            })
        },
        async (settings) => {
            try {
                await client.patch('/settings/audiobookshelf', settings);
                return { content: [{ type: 'text', text: 'Audiobookshelf settings updated' }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error updating Audiobookshelf settings: ${e.message}` }], isError: true };
            }
        }
    );

    // Prowlarr settings
    server.registerTool(
        toolName(prefix, 'get_prowlarr_settings'),
        {
            description: 'Get Prowlarr integration settings (admin only)',
            inputSchema: z.object({})
        },
        async () => {
            try {
                const results = await client.get('/settings/prowlarr');
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error getting Prowlarr settings: ${e.message}` }], isError: true };
            }
        }
    );

    server.registerTool(
        toolName(prefix, 'update_prowlarr_settings'),
        {
            description: 'Update Prowlarr integration settings (admin only)',
            inputSchema: z.object({
                prowlarr_enabled: z.boolean().describe('Enable Prowlarr integration'),
                prowlarr_url: z.string().optional().describe('Prowlarr server URL'),
                prowlarr_api_key: z.string().optional().describe('Prowlarr API key'),
            })
        },
        async (settings) => {
            try {
                await client.patch('/settings/prowlarr', settings);
                return { content: [{ type: 'text', text: 'Prowlarr settings updated' }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error updating Prowlarr settings: ${e.message}` }], isError: true };
            }
        }
    );

    // OIDC settings
    server.registerTool(
        toolName(prefix, 'get_oidc_settings'),
        {
            description: 'Get OpenID Connect settings (admin only)',
            inputSchema: z.object({})
        },
        async () => {
            try {
                const results = await client.get('/settings/oidc');
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error getting OIDC settings: ${e.message}` }], isError: true };
            }
        }
    );

    server.registerTool(
        toolName(prefix, 'update_oidc_settings'),
        {
            description: 'Update OpenID Connect settings (admin only)',
            inputSchema: z.object({
                oidc_enabled: z.boolean().describe('Enable OIDC authentication'),
                oidc_issuer: z.string().optional().describe('OIDC issuer URL'),
                oidc_client_id: z.string().optional().describe('OIDC client ID'),
                oidc_client_secret: z.string().optional().describe('OIDC client secret'),
            })
        },
        async (settings) => {
            try {
                await client.patch('/settings/oidc', settings);
                return { content: [{ type: 'text', text: 'OIDC settings updated' }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error updating OIDC settings: ${e.message}` }], isError: true };
            }
        }
    );

    // Login type
    server.registerTool(
        toolName(prefix, 'get_login_type'),
        {
            description: 'Get current login type configuration',
            inputSchema: z.object({})
        },
        async () => {
            try {
                const results = await client.get('/settings/login-type');
                return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error getting login type: ${e.message}` }], isError: true };
            }
        }
    );

    // Health check
    server.registerTool(
        toolName(prefix, 'health_check'),
        {
            description: 'Check if the AudioBookRequest instance is healthy',
            inputSchema: z.object({})
        },
        async () => {
            try {
                await client.get('/health');
                return { content: [{ type: 'text', text: 'AudioBookRequest is healthy' }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Health check failed: ${e.message}` }], isError: true };
            }
        }
    );
}
