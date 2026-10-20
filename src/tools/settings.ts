import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod';
import { AudioBookRequestClient } from '../client.js';
import { toolName } from '../config.js';

// Helper to mask secrets
function maskSecret(value?: string, showLast = 4): string {
    if (!value) return '***';
    if (value.length <= showLast) return '***';
    return '***' + value.slice(-showLast);
}

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
                // Mask webhook URLs and headers for security
                const masked = results.map((n: any) => ({
                    ...n,
                    url: maskSecret(n.url),
                    headers: n.headers ? '***' : undefined,
                }));
                return { content: [{ type: 'text', text: JSON.stringify(masked, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error listing notifications: ${e.message}` }], isError: true };
            }
        }
    );

    server.registerTool(
        toolName(prefix, 'create_notification'),
        {
            description: 'Create or update a notification configuration (admin only). Set id to update an existing notification. WARNING: Allows registering arbitrary webhooks - use with trusted URLs only.',
            inputSchema: z.object({
                id: z.string().optional().describe('Notification UUID; set to update an existing notification'),
                name: z.string().describe('Notification name'),
                url: z.string().describe('Notification webhook URL'),
                event_type: z.enum(['onNewRequest', 'onSuccessfulDownload', 'onFailedDownload']).describe('Event that triggers the notification'),
                body: z.string().describe('Notification body template'),
                body_type: z.enum(['json', 'text']).describe('Body type'),
                headers: z.string().optional().default('{}').describe('JSON headers'),
            })
        },
        async ({ id, name, url, event_type, body, body_type, headers }) => {
            try {
                const result = await client.post('/settings/notifications', {
                    id, name, url, event_type, body, body_type, headers,
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
                auto_download: z.boolean().optional().describe('Enable auto-download'),
                flac_range: z.object({ from_kbits: z.number().optional(), to_kbits: z.number().optional() }).optional().describe('FLAC quality range (kbps)'),
                m4b_range: z.object({ from_kbits: z.number().optional(), to_kbits: z.number().optional() }).optional().describe('M4B quality range (kbps)'),
                mp3_range: z.object({ from_kbits: z.number().optional(), to_kbits: z.number().optional() }).optional().describe('MP3 quality range (kbps)'),
                unknown_audio_range: z.object({ from_kbits: z.number().optional(), to_kbits: z.number().optional() }).optional().describe('Unknown audio quality range'),
                unknown_range: z.object({ from_kbits: z.number().optional(), to_kbits: z.number().optional() }).optional().describe('Unknown quality range'),
                min_seeders: z.number().optional().describe('Minimum seeders required'),
                name_ratio: z.number().optional().describe('Name match ratio (0-100)'),
                title_ratio: z.number().optional().describe('Title match ratio (0-100)'),
            })
        },
        async (settings) => {
            try {
                const current: Record<string, unknown> = await client.get('/settings/download');
                const payload: Record<string, unknown> = { ...current };
                delete payload.indexer_flags;
                for (const [key, value] of Object.entries(settings)) {
                    if (value === undefined) continue;
                    // Nested quality ranges must keep their other bound.
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        const existing = current[key];
                        payload[key] = {
                            ...(typeof existing === 'object' && existing !== null ? existing : {}),
                            ...value,
                        };
                    } else {
                        payload[key] = value;
                    }
                }
                await client.patch('/settings/download', payload);
                return { content: [{ type: 'text', text: 'Download settings updated' }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error updating download settings: ${e.message}` }], isError: true };
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
                // Mask the API token for security
                const masked = {
                    ...results,
                    abs_api_token: maskSecret(results.abs_api_token),
                };
                return { content: [{ type: 'text', text: JSON.stringify(masked, null, 2) }] };
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
                abs_base_url: z.string().optional().describe('Audiobookshelf server URL'),
                abs_api_token: z.string().optional().describe('Audiobookshelf API token'),
                abs_library_id: z.string().optional().describe('Library ID to use'),
                abs_check_downloaded: z.boolean().optional().describe('Check if books are already downloaded'),
            })
        },
        async ({ abs_base_url, abs_api_token, abs_library_id, abs_check_downloaded }) => {
            try {
                // Backend uses per-field PUT endpoints
                if (abs_base_url !== undefined) {
                    await client.put('/settings/audiobookshelf/base-url', { base_url: abs_base_url });
                }
                if (abs_api_token !== undefined) {
                    await client.put('/settings/audiobookshelf/api-token', { api_token: abs_api_token });
                }
                if (abs_library_id !== undefined) {
                    await client.put('/settings/audiobookshelf/library', { library_id: abs_library_id });
                }
                if (abs_check_downloaded !== undefined) {
                    await client.put('/settings/audiobookshelf/check-downloaded', { check_downloaded: abs_check_downloaded });
                }
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
                // Mask the API key for security
                const masked = { ...results, api_key: maskSecret(results.api_key) };
                return { content: [{ type: 'text', text: JSON.stringify(masked, null, 2) }] };
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
                base_url: z.string().optional().describe('Prowlarr server URL'),
                api_key: z.string().optional().describe('Prowlarr API key'),
            })
        },
        async ({ base_url, api_key }) => {
            try {
                // Backend uses per-field PUT endpoints
                if (base_url !== undefined) {
                    await client.put('/settings/prowlarr/base-url', { base_url });
                }
                if (api_key !== undefined) {
                    await client.put('/settings/prowlarr/api-key', { api_key });
                }
                return { content: [{ type: 'text', text: 'Prowlarr settings updated' }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error updating Prowlarr settings: ${e.message}` }], isError: true };
            }
        }
    );

    // Security settings (includes OIDC and login type)
    server.registerTool(
        toolName(prefix, 'get_security_settings'),
        {
            description: 'Get security settings including OIDC and login type (admin only)',
            inputSchema: z.object({})
        },
        async () => {
            try {
                const results = await client.get('/settings/security');
                // Mask OIDC client secret for security
                const masked = {
                    ...results,
                    oidc_client_secret: maskSecret(results.oidc_client_secret),
                };
                return { content: [{ type: 'text', text: JSON.stringify(masked, null, 2) }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error getting security settings: ${e.message}` }], isError: true };
            }
        }
    );

    server.registerTool(
        toolName(prefix, 'update_security_settings'),
        {
            description: 'Update security settings including OIDC and login type (admin only)',
            inputSchema: z.object({
                login_type: z.enum(['basic', 'forms', 'oidc']).optional().describe('Login type'),
                oidc_endpoint: z.string().optional().describe('OIDC discovery endpoint URL'),
                oidc_client_id: z.string().optional().describe('OIDC client ID'),
                oidc_client_secret: z.string().optional().describe('OIDC client secret'),
                oidc_scope: z.string().optional().describe('OIDC scope'),
                oidc_username_claim: z.string().optional().describe('OIDC username claim'),
                oidc_group_claim: z.string().optional().describe('OIDC group claim'),
                oidc_redirect_scheme: z.enum(['http', 'https', 'auto']).optional().describe('OIDC redirect scheme'),
                oidc_logout_url: z.string().optional().describe('OIDC logout URL'),
                access_token_expiry: z.number().optional().describe('Access token expiry in minutes'),
                min_password_length: z.number().optional().describe('Minimum password length'),
            })
        },
        async (settings) => {
            try {
                // The API requires login_type on every patch, so merge with current values.
                const current: Record<string, unknown> = await client.get('/settings/security');
                const payload: Record<string, unknown> = { ...current };
                delete payload.force_login_type;
                for (const [key, value] of Object.entries(settings)) {
                    if (value !== undefined) payload[key] = value;
                }
                await client.patch('/settings/security', payload);
                return { content: [{ type: 'text', text: 'Security settings updated' }] };
            } catch (e: any) {
                return { content: [{ type: 'text', text: `Error updating security settings: ${e.message}` }], isError: true };
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
