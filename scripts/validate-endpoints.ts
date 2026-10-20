#!/usr/bin/env node
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import readline from 'node:readline';
import * as z from 'zod';

/**
 * Validates the MCP server against a running AudioBookRequest instance.
 *
 * It reads the tools the server actually registers, invokes each one against a
 * recording stub, and checks the real HTTP requests against the OpenAPI spec:
 * method, path, query names, body fields, enums and required fields.
 *
 * Run with ABR_BASE_URL pointing at the instance (defaults to localhost:8000).
 */

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type Endpoint = [Method, string];

interface JsonSchema {
    $ref?: string;
    type?: string;
    properties?: Record<string, JsonSchema>;
    required?: string[];
    enum?: unknown[];
    const?: unknown;
    items?: JsonSchema;
    anyOf?: JsonSchema[];
    oneOf?: JsonSchema[];
    additionalProperties?: unknown;
    [key: string]: unknown;
}

interface OpenAPIParameter {
    name?: string;
    in?: string;
    schema?: JsonSchema;
}

interface OpenAPIOperation {
    parameters?: OpenAPIParameter[];
    requestBody?: { content?: Record<string, { schema?: JsonSchema }> };
}

interface OpenAPISpec {
    paths: Record<string, Record<string, OpenAPIOperation | undefined>>;
    components?: { schemas?: Record<string, JsonSchema> };
}

interface McpTool {
    name: string;
    inputSchema?: JsonSchema;
}

interface StubRequest {
    method: string;
    url: string;
    body: string;
}

const TOOL_ENDPOINTS: Record<string, Endpoint[]> = {
    search_books: [['GET', '/api/search']],
    list_requests: [['GET', '/api/requests']],
    request_book: [['POST', '/api/requests/{asin_or_uuid}']],
    cancel_request: [['DELETE', '/api/requests/{asin_or_uuid}']],
    mark_downloaded: [['PATCH', '/api/requests/{asin_or_uuid}/downloaded']],
    get_download_sources: [['GET', '/api/requests/{asin_or_uuid}/sources']],
    download_book: [['POST', '/api/requests/{asin_or_uuid}/download']],
    auto_download: [['POST', '/api/requests/{asin_or_uuid}/auto-download']],
    list_manual_requests: [['GET', '/api/requests/manual']],
    create_manual_request: [['POST', '/api/requests/manual']],
    update_manual_request: [['PUT', '/api/requests/manual/{id}']],
    delete_manual_request: [['DELETE', '/api/requests/manual/{id}']],
    mark_manual_downloaded: [['PATCH', '/api/requests/manual/{id}/downloaded']],
    list_users: [['GET', '/api/users/']],
    get_user: [['GET', '/api/users/{username}']],
    create_user: [['POST', '/api/users/']],
    update_user: [['PUT', '/api/users/{username}']],
    delete_user: [['DELETE', '/api/users/{username}']],
    get_indexer_configurations: [['GET', '/api/indexers/configurations']],
    update_indexer: [['PATCH', '/api/indexers/{indexer}']],
    get_user_recommendations: [['GET', '/api/recommendations/user']],
    get_popular_recommendations: [['GET', '/api/recommendations/popular']],
    get_recent_recommendations: [['GET', '/api/recommendations/recent']],
    get_fallback_recommendations: [['GET', '/api/recommendations/fallback']],
    get_category_recommendations: [['GET', '/api/recommendations/categories']],
    get_author_recommendations: [['GET', '/api/recommendations/authors']],
    get_narrator_recommendations: [['GET', '/api/recommendations/narrators']],
    list_notifications: [['GET', '/api/settings/notifications']],
    create_notification: [['POST', '/api/settings/notifications']],
    delete_notification: [['DELETE', '/api/settings/notifications/{id}']],
    test_notification: [['POST', '/api/settings/notifications/{id}/test']],
    get_download_settings: [['GET', '/api/settings/download']],
    update_download_settings: [
        ['GET', '/api/settings/download'],
        ['PATCH', '/api/settings/download'],
    ],
    get_abs_settings: [['GET', '/api/settings/audiobookshelf']],
    update_abs_settings: [
        ['PUT', '/api/settings/audiobookshelf/base-url'],
        ['PUT', '/api/settings/audiobookshelf/api-token'],
        ['PUT', '/api/settings/audiobookshelf/library'],
        ['PUT', '/api/settings/audiobookshelf/check-downloaded'],
    ],
    get_prowlarr_settings: [['GET', '/api/settings/prowlarr']],
    update_prowlarr_settings: [
        ['PUT', '/api/settings/prowlarr/base-url'],
        ['PUT', '/api/settings/prowlarr/api-key'],
    ],
    get_security_settings: [['GET', '/api/settings/security']],
    update_security_settings: [
        ['GET', '/api/settings/security'],
        ['PATCH', '/api/settings/security'],
    ],
    health_check: [['GET', '/api/health']],
};

// Optional arguments needed to exercise tools whose inputs are all optional.
const ARG_OVERRIDES: Record<string, Record<string, unknown>> = {
    get_user_recommendations: { seed_asins: ['B000000001', 'B000000002'] },
    update_download_settings: { min_seeders: 5 },
    update_security_settings: { min_password_length: 8 },
    update_abs_settings: {
        abs_base_url: 'http://127.0.0.1:9/abs',
        abs_api_token: 'token',
        abs_library_id: 'lib',
        abs_check_downloaded: true,
    },
    update_prowlarr_settings: { base_url: 'http://127.0.0.1:9/prowlarr', api_key: 'key' },
};

const JsonSchemaSchema: z.ZodType<JsonSchema> = z.lazy(() =>
    z
        .object({
            $ref: z.string().optional(),
            type: z.string().optional(),
            properties: z.record(z.string(), JsonSchemaSchema).optional(),
            required: z.array(z.string()).optional(),
            enum: z.array(z.unknown()).optional(),
            const: z.unknown().optional(),
            items: JsonSchemaSchema.optional(),
            anyOf: z.array(JsonSchemaSchema).optional(),
            oneOf: z.array(JsonSchemaSchema).optional(),
        })
        .loose(),
);

const OperationSchema: z.ZodType<OpenAPIOperation> = z
    .object({
        parameters: z
            .array(
                z.object({ name: z.string().optional(), in: z.string().optional(), schema: JsonSchemaSchema.optional() }).loose(),
            )
            .optional(),
        requestBody: z
            .object({
                content: z.record(z.string(), z.object({ schema: JsonSchemaSchema.optional() }).loose()).optional(),
            })
            .loose()
            .optional(),
    })
    .loose();

const SpecSchema: z.ZodType<OpenAPISpec> = z
    .object({
        paths: z.record(z.string(), z.record(z.string(), OperationSchema)),
        components: z.object({ schemas: z.record(z.string(), JsonSchemaSchema).optional() }).loose().optional(),
    })
    .loose();

const ToolSchema = z.object({ name: z.string(), inputSchema: JsonSchemaSchema.optional() }).loose();
const ToolsResultSchema = z.object({ tools: z.array(ToolSchema) }).loose();
const RpcMessageSchema = z.object({ id: z.number().optional(), result: z.unknown().optional(), error: z.unknown().optional() }).loose();
const CallResultSchema = z
    .object({ content: z.array(z.object({ type: z.string(), text: z.string().optional() }).loose()).optional(), isError: z.boolean().optional() })
    .loose();

async function loadSpec(): Promise<OpenAPISpec> {
    const baseUrl = (process.env.ABR_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');
    const response = await fetch(`${baseUrl}/openapi.json`, { redirect: 'manual' });
    if (response.status >= 300 && response.status < 400) {
        throw new Error(`OpenAPI redirected to ${response.headers.get('location')}; finish the AudioBookRequest setup first.`);
    }
    if (!response.ok) {
        throw new Error(`Failed to fetch ${baseUrl}/openapi.json (${response.status}). Check ABR_BASE_URL and ABR_APP__OPENAPI_ENABLED.`);
    }
    return SpecSchema.parse(await response.json());
}

function resolveRef(spec: OpenAPISpec, schema: JsonSchema | undefined): JsonSchema {
    let current = schema;
    const seen = new Set<string>();
    while (current?.$ref) {
        if (seen.has(current.$ref)) break;
        seen.add(current.$ref);
        current = spec.components?.schemas?.[current.$ref.split('/').pop() ?? ''];
    }
    return current ?? {};
}

function enumValues(spec: OpenAPISpec, schema: JsonSchema | undefined): unknown[] | null {
    const resolved = resolveRef(spec, schema);
    if (Array.isArray(resolved.enum)) return resolved.enum;
    if (resolved.const !== undefined) return [resolved.const];
    const branches = resolved.anyOf ?? resolved.oneOf;
    if (Array.isArray(branches)) {
        const values = branches.flatMap((branch) => enumValues(spec, branch) ?? []);
        if (values.length > 0) return values;
    }
    return null;
}

function typeNames(schema: JsonSchema | undefined): string[] {
    if (!schema) return [];
    if (typeof schema.type === 'string') return [schema.type];
    const branches = schema.anyOf ?? schema.oneOf;
    if (Array.isArray(branches)) return branches.flatMap((branch) => typeNames(branch));
    return [];
}

function findOperation(spec: OpenAPISpec, method: string, requestPath: string) {
    const wanted = requestPath.split('/');
    for (const [specPath, item] of Object.entries(spec.paths)) {
        const actual = specPath.split('/');
        if (actual.length !== wanted.length) continue;
        if (!actual.every((segment, index) => (segment.startsWith('{') ? wanted[index].length > 0 : segment === wanted[index]))) {
            continue;
        }
        const operation = item[method.toLowerCase()];
        if (operation) return { specPath, operation };
    }
    return null;
}

function sampleValue(schema: JsonSchema): unknown {
    if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[schema.enum.length - 1];
    const types = typeNames(schema);
    if (types.includes('array')) return [sampleValue(schema.items ?? {})];
    if (types.includes('integer') || types.includes('number')) return 1;
    if (types.includes('boolean')) return true;
    if (types.includes('object')) {
        const properties = schema.properties ?? {};
        return Object.fromEntries(
            (schema.required ?? []).filter((name) => properties[name]).map((name) => [name, sampleValue(properties[name])]),
        );
    }
    return 'value';
}

function sampleArgs(tool: McpTool, name: string): Record<string, unknown> {
    const properties = tool.inputSchema?.properties ?? {};
    const args: Record<string, unknown> = {};
    for (const required of tool.inputSchema?.required ?? []) {
        if (properties[required]) args[required] = sampleValue(properties[required]);
    }
    return { ...args, ...ARG_OVERRIDES[name] };
}

const STUB_BODIES: Record<string, unknown> = {
    '/api/settings/download': {
        auto_download: false,
        flac_range: { from_kbits: 20, to_kbits: 400 },
        m4b_range: { from_kbits: 20, to_kbits: 400 },
        mp3_range: { from_kbits: 20, to_kbits: 400 },
        unknown_audio_range: { from_kbits: 20, to_kbits: 400 },
        unknown_range: { from_kbits: 20, to_kbits: 400 },
        min_seeders: 2,
        name_ratio: 75,
        title_ratio: 90,
        indexer_flags: [],
    },
    '/api/settings/security': {
        login_type: 'forms',
        access_token_expiry: 10080,
        min_password_length: 1,
        oidc_endpoint: '',
        oidc_client_secret: '',
        oidc_client_id: '',
        oidc_scope: '',
        oidc_username_claim: '',
        oidc_group_claim: '',
        oidc_redirect_scheme: 'http',
        oidc_logout_url: '',
        force_login_type: null,
    },
    '/api/settings/audiobookshelf': {
        abs_base_url: '',
        abs_api_token: '',
        abs_library_id: '',
        abs_check_downloaded: false,
        abs_libraries: [],
    },
    '/api/settings/prowlarr': { base_url: '', api_key: '' },
    '/api/users/': { users: [], total: 0 },
    '/api/recommendations/user': { recommendations: [], total: 0 },
};

const LIST_ENDPOINTS: Record<string, true> = {
    '/api/search': true,
    '/api/requests': true,
    '/api/requests/manual': true,
    '/api/settings/notifications': true,
    '/api/recommendations/popular': true,
    '/api/recommendations/recent': true,
    '/api/recommendations/fallback': true,
    '/api/recommendations/authors': true,
    '/api/recommendations/narrators': true,
};

function stubBody(method: string, pathname: string): { status: number; body?: unknown } {
    if (method !== 'GET') return { status: 204 };
    if (pathname in STUB_BODIES) return { status: 200, body: STUB_BODIES[pathname] };
    if (LIST_ENDPOINTS[pathname]) return { status: 200, body: [] };
    if (pathname.startsWith('/api/users/')) return { status: 200, body: { username: 'validator' } };
    return { status: 200, body: {} };
}

function startStub() {
    const requests: StubRequest[] = [];
    const server = http.createServer((request, response) => {
        let body = '';
        request.on('data', (chunk: Buffer) => {
            body += String(chunk);
        });
        request.on('end', () => {
            const url = request.url ?? '/';
            const method = request.method ?? 'GET';
            requests.push({ method, url, body });
            const result = stubBody(method, new URL(url, 'http://stub').pathname);
            response.writeHead(result.status, { 'Content-Type': 'application/json' });
            response.end(result.body === undefined ? '' : JSON.stringify(result.body));
        });
    });
    const ready = Promise.withResolvers<{ baseUrl: string; requests: StubRequest[]; close: () => Promise<void> }>();
    server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        if (!address || typeof address === 'string') {
            ready.reject(new Error('Stub server did not bind to a TCP port'));
            return;
        }
        ready.resolve({
            baseUrl: `http://127.0.0.1:${address.port}`,
            requests,
            close: () => {
                const closed = Promise.withResolvers<void>();
                server.close(() => closed.resolve());
                return closed.promise;
            },
        });
    });
    server.on('error', ready.reject);
    return ready.promise;
}

async function withMcp<T>(baseUrl: string, run: (rpc: (method: string, params: Record<string, unknown>) => Promise<unknown>) => Promise<T>): Promise<T> {
    const child = spawn(process.execPath, [path.join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs'), 'src/index.ts'], {
        cwd: process.cwd(),
        env: { ...process.env, ABR_BASE_URL: baseUrl, ABR_API_KEY: process.env.ABR_API_KEY || 'validator' },
        stdio: ['pipe', 'pipe', 'pipe'],
    });
    const pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
    let nextId = 1;

    const rpc = (method: string, params: Record<string, unknown>) => {
        const id = nextId;
        nextId += 1;
        const deferred = Promise.withResolvers<unknown>();
        pending.set(id, deferred);
        const timer = setTimeout(() => {
            if (pending.delete(id)) deferred.reject(new Error(`Timed out waiting for ${method}`));
        }, 10000);
        deferred.promise.then(
            () => clearTimeout(timer),
            () => clearTimeout(timer),
        );
        child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
        return deferred.promise;
    };

    readline.createInterface({ input: child.stdout }).on('line', (line) => {
        if (!line.startsWith('{')) return;
        let json: unknown;
        try {
            json = JSON.parse(line);
        } catch {
            return;
        }
        const message = RpcMessageSchema.safeParse(json);
        if (!message.success || message.data.id === undefined) return;
        const call = pending.get(message.data.id);
        if (!call) return;
        pending.delete(message.data.id);
        if (message.data.error) call.reject(new Error(JSON.stringify(message.data.error)));
        else call.resolve(message.data.result);
    });

    child.on('exit', (code) => {
        for (const call of pending.values()) call.reject(new Error(`MCP server exited (${code})`));
        pending.clear();
    });

    try {
        await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'validator', version: '1.0.0' } });
        child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
        return await run(rpc);
    } finally {
        child.kill();
    }
}

function validateRequests(spec: OpenAPISpec, name: string, requests: StubRequest[], expected: Endpoint[], errors: string[]) {
    const matched = new Set<number>();

    for (const request of requests) {
        const url = new URL(request.url, 'http://stub');
        const found = findOperation(spec, request.method, url.pathname);
        if (!found) {
            errors.push(`${name}: ${request.method} ${url.pathname} is not in the OpenAPI spec`);
            continue;
        }

        const index = expected.findIndex(([method, endpoint]) => method === request.method && endpoint === found.specPath);
        if (index === -1) errors.push(`${name}: unexpected call ${request.method} ${url.pathname}`);
        else matched.add(index);

        const queryParams = (found.operation.parameters ?? []).filter((param) => param.in === 'query');
        for (const [key, value] of url.searchParams) {
            const param = queryParams.find((candidate) => candidate.name === key);
            if (!param) {
                errors.push(`${name}: ${request.method} ${url.pathname} sends unknown query parameter ${key}`);
                continue;
            }
            const schema = resolveRef(spec, param.schema);
            const allowed = enumValues(spec, typeNames(schema).includes('array') ? schema.items : schema);
            if (allowed && !allowed.some((candidate) => String(candidate) === value)) {
                errors.push(`${name}: query ${key}=${value} is not one of ${allowed.join(', ')}`);
            }
        }

        if (request.body) {
            const rawSchema = found.operation.requestBody?.content?.['application/json']?.schema;
            if (!rawSchema) {
                errors.push(`${name}: ${request.method} ${url.pathname} sends a body but the spec has none`);
                continue;
            }
            const schema = resolveRef(spec, rawSchema);
            let json: unknown;
            try {
                json = JSON.parse(request.body);
            } catch {
                errors.push(`${name}: ${request.method} ${url.pathname} sent invalid JSON`);
                continue;
            }
            const body = z.record(z.string(), z.unknown()).safeParse(json);
            if (!body.success) {
                errors.push(`${name}: ${request.method} ${url.pathname} sent a non-object body`);
                continue;
            }
            const additional = schema.additionalProperties;
            const allowsAdditional = additional === true || (typeof additional === 'object' && additional !== null);
            for (const [key, value] of Object.entries(body.data)) {
                const property = schema.properties?.[key];
                if (!property) {
                    if (!allowsAdditional) errors.push(`${name}: ${url.pathname} sends unknown body field ${key}`);
                    continue;
                }
                const allowed = enumValues(spec, property);
                if (allowed && !allowed.includes(value)) {
                    errors.push(`${name}: ${key}=${JSON.stringify(value)} is not one of ${allowed.join(', ')}`);
                }
            }
            for (const required of schema.required ?? []) {
                if (!(required in body.data)) errors.push(`${name}: ${request.method} ${url.pathname} omits required body field ${required}`);
            }
        } else if (found.operation.requestBody && request.method !== 'GET' && request.method !== 'DELETE') {
            errors.push(`${name}: ${request.method} ${url.pathname} sends no body but the spec expects one`);
        }
    }

    expected.forEach(([method, endpoint], index) => {
        if (!matched.has(index)) errors.push(`${name}: did not call ${method} ${endpoint}`);
    });
}

async function main() {
    console.log('=== AudioBookRequest MCP validation ===');

    const spec = await loadSpec();
    const stub = await startStub();
    const prefix = process.env.TOOL_PREFIX ? `${process.env.TOOL_PREFIX}_` : '';

    try {
        const { tools, runs } = await withMcp(stub.baseUrl, async (rpc) => {
            const listed = ToolsResultSchema.parse(await rpc('tools/list', {}));
            const invoked: { name: string; text: string; isError: boolean; requests: StubRequest[] }[] = [];

            for (const tool of listed.tools) {
                const name = prefix && tool.name.startsWith(prefix) ? tool.name.slice(prefix.length) : tool.name;
                const before = stub.requests.length;
                const result = CallResultSchema.safeParse(await rpc('tools/call', { name: tool.name, arguments: sampleArgs(tool, name) }));
                const text = result.success
                    ? (result.data.content ?? []).map((item) => item.text ?? '').join('\n')
                    : JSON.stringify(result);
                invoked.push({
                    name,
                    text,
                    isError: result.success ? result.data.isError === true : true,
                    requests: stub.requests.slice(before),
                });
            }

            return { tools: listed.tools, runs: invoked };
        });

        const operationCount = Object.values(spec.paths).reduce((sum, item) => sum + Object.keys(item).length, 0);
        console.log(`OpenAPI operations: ${operationCount}`);
        console.log(`MCP tools: ${tools.length}\n`);

        const errors: string[] = [];
        for (const run of runs) {
            const before = errors.length;
            const expected = TOOL_ENDPOINTS[run.name];
            if (!expected) {
                errors.push(`${run.name}: tool has no endpoint mapping in this validator`);
            } else if (run.isError) {
                errors.push(`${run.name}: tool returned an error: ${run.text.slice(0, 500)}`);
            } else {
                validateRequests(spec, run.name, run.requests, expected, errors);
            }
            if (errors.length === before) console.log(`✓ ${run.name}`);
            else for (const error of errors.slice(before)) console.log(`✗ ${error}`);
        }

        for (const name of Object.keys(TOOL_ENDPOINTS)) {
            if (!runs.some((run) => run.name === name)) errors.push(`${name}: tool is not registered by the MCP server`);
        }

        console.log('\n=== Results ===');
        console.log(`Checked tools: ${runs.length}/${Object.keys(TOOL_ENDPOINTS).length}`);
        console.log(`Failures: ${errors.length}`);
        if (errors.length > 0) {
            console.log('\nValidation failed.');
            process.exitCode = 1;
        } else {
            console.log('\nAll tools match the OpenAPI spec and send valid requests.');
        }
    } finally {
        await stub.close();
    }
}

main().catch((error) => {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
