#!/usr/bin/env node
import { readFileSync } from 'fs';

interface OpenAPISpec {
    paths: Record<string, any>;
}

async function loadSpec(): Promise<OpenAPISpec> {
    // Try to load from local file first (faster, more reliable)
    try {
        const localSpec = readFileSync('/tmp/abr-openapi3.json', 'utf-8');
        console.log('Loaded OpenAPI spec from local file');
        return JSON.parse(localSpec);
    } catch (e) {
        console.log('Local spec file not found, fetching from instance...');
    }

    // Fall back to fetching
    const url = process.env.ABR_URL || 'http://localhost:3000';
    console.log(`Fetching OpenAPI spec from ${url}/openapi.json...`);

    let response: Response;
    try {
        response = await fetch(`${url}/openapi.json`);
    } catch (e: any) {
        throw new Error(`Failed to fetch OpenAPI spec: ${e.message}`);
    }

    if (!response.ok) {
        throw new Error(`Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`);
    }

    const spec = await response.json();
    console.log('OpenAPI spec loaded successfully');
    return spec;
}


async function main() {
    console.log('=== AudioBookRequest MCP Endpoint Validation ===');

    const spec = await loadSpec();

    const paths = Object.keys(spec.paths);

    // All MCP tool endpoints to validate
    const endpoints = [
        { method: 'GET', path: '/api/search', tool: 'search_books' },
        { method: 'GET', path: '/api/requests', tool: 'list_requests' },
        { method: 'POST', path: '/api/requests/{asin}', tool: 'request_book' },
        { method: 'DELETE', path: '/api/requests/{asin}', tool: 'cancel_request' },
        { method: 'PATCH', path: '/api/requests/{asin}/downloaded', tool: 'mark_downloaded' },
        { method: 'GET', path: '/api/requests/{asin}/sources', tool: 'get_download_sources' },
        { method: 'POST', path: '/api/requests/{asin}/download', tool: 'download_book' },
        { method: 'POST', path: '/api/requests/{asin}/auto-download', tool: 'auto_download' },
        { method: 'GET', path: '/api/requests/manual', tool: 'list_manual_requests' },
        { method: 'POST', path: '/api/requests/manual', tool: 'create_manual_request' },
        { method: 'PUT', path: '/api/requests/manual/{id}', tool: 'update_manual_request' },
        { method: 'DELETE', path: '/api/requests/manual/{id}', tool: 'delete_manual_request' },
        { method: 'PATCH', path: '/api/requests/manual/{id}/downloaded', tool: 'mark_manual_downloaded' },
        { method: 'GET', path: '/api/users/', tool: 'list_users' },
        { method: 'GET', path: '/api/users/me', tool: 'get_my_profile' },
        { method: 'POST', path: '/api/users/', tool: 'create_user' },
        { method: 'PUT', path: '/api/users/{username}', tool: 'update_user' },
        { method: 'DELETE', path: '/api/users/{username}', tool: 'delete_user' },
        { method: 'GET', path: '/api/indexers/configurations', tool: 'get_indexer_configurations' },
        { method: 'PATCH', path: '/api/indexers/{indexer}', tool: 'update_indexer' },
        { method: 'GET', path: '/api/recommendations/user', tool: 'get_user_recommendations' },
        { method: 'GET', path: '/api/recommendations/popular', tool: 'get_popular_recommendations' },
        { method: 'GET', path: '/api/recommendations/recent', tool: 'get_recent_recommendations' },
        { method: 'GET', path: '/api/recommendations/categories', tool: 'get_category_recommendations' },
        { method: 'GET', path: '/api/recommendations/authors', tool: 'get_author_recommendations' },
        { method: 'GET', path: '/api/recommendations/narrators', tool: 'get_narrator_recommendations' },
        { method: 'GET', path: '/api/settings/notifications', tool: 'list_notifications' },
        { method: 'POST', path: '/api/settings/notifications', tool: 'create_notification' },
        { method: 'DELETE', path: '/api/settings/notifications/{id}', tool: 'delete_notification' },
        { method: 'POST', path: '/api/settings/notifications/test', tool: 'test_notification' },
        { method: 'GET', path: '/api/settings/download', tool: 'get_download_settings' },
        { method: 'PATCH', path: '/api/settings/download', tool: 'update_download_settings' },
        { method: 'GET', path: '/api/settings/audiobookshelf', tool: 'get_abs_settings' },
        { method: 'PUT', path: '/api/settings/audiobookshelf/base-url', tool: 'update_abs_settings' },
        { method: 'PUT', path: '/api/settings/audiobookshelf/api-token', tool: 'update_abs_settings' },
        { method: 'PUT', path: '/api/settings/audiobookshelf/library', tool: 'update_abs_settings' },
        { method: 'PUT', path: '/api/settings/audiobookshelf/check-downloaded', tool: 'update_abs_settings' },
        { method: 'GET', path: '/api/settings/prowlarr', tool: 'get_prowlarr_settings' },
        { method: 'PUT', path: '/api/settings/prowlarr/api-key', tool: 'update_prowlarr_settings' },
        { method: 'PUT', path: '/api/settings/prowlarr/base-url', tool: 'update_prowlarr_settings' },
        { method: 'GET', path: '/api/settings/security', tool: 'get_security_settings' },
        { method: 'PATCH', path: '/api/settings/security', tool: 'update_security_settings' },
        { method: 'GET', path: '/api/health', tool: 'health_check' },
    ];

    console.log('Validating endpoints against OpenAPI spec...\n');

    let successes = 0;
    let failures = 0;

    for (const ep of endpoints) {
        // Find matching path in spec by comparing segment structure
        const epSegments = ep.path.split('/');
        let found = null;
        
        for (const specPath of paths) {
            const specSegments = specPath.split('/');
            
            // Must have same number of segments
            if (specSegments.length !== epSegments.length) continue;
            
            // Compare each segment
            let matches = true;
            for (let i = 0; i < epSegments.length; i++) {
                const epSeg = epSegments[i];
                const specSeg = specSegments[i];
                
                // Empty segments match
                if (epSeg === '' && specSeg === '') continue;
                
                // Both are path parameters (start with {)
                if (epSeg.startsWith('{') && specSeg.startsWith('{')) continue;
                
                // Exact match
                if (epSeg === specSeg) continue;
                
                // No match
                matches = false;
                break;
            }
            
            if (matches) {
                found = specPath;
                break;
            }
        }

        if (found) {
            const pathSpec = spec.paths[found];
            const methodKey = ep.method.toLowerCase();
            if (pathSpec[methodKey]) {
                console.log(`✓ ${ep.method} ${ep.path} (${ep.tool})`);
                successes++;
            } else {
                console.log(`✗ ${ep.method} ${ep.path} (${ep.tool}) - method not supported (matched: ${found}, found: ${Object.keys(pathSpec).join(', ')})`);
                failures++;
            }
        } else {
            console.log(`✗ ${ep.method} ${ep.path} (${ep.tool}) - path not found in spec`);
            failures++;
        }
    }

    console.log(`\n=== Results ===`);
    console.log(`Successes: ${successes}`);
    console.log(`Failures: ${failures}`);

    if (failures > 0) {
        console.log('\n⚠️  Some endpoints do not match the OpenAPI spec!');
        process.exit(1);
    } else {
        console.log('\n✓ All endpoints match the OpenAPI spec!');
    }
}

main().catch(e => {
    console.error(`Error: ${e.message}`);
    process.exit(1);
});