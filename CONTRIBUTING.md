# Contributing to AudioBookRequest MCP

## Development Setup

```bash
# Clone the repository
git clone https://github.com/spaghetgaming/audiobookrequest-mcp.git
cd audiobookrequest-mcp

# Install dependencies
npm install

# Run locally with environment variables
export ABR_BASE_URL=http://your-instance:8000
export ABR_API_KEY=your-api-key
npm start
```

## Validating Endpoints

```bash
export ABR_BASE_URL=http://your-instance:8000
npm run validate:endpoints
```

This checks every registered tool against the instance's OpenAPI spec and exercises the real HTTP calls against a recording stub.

## Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector npx @spaghetgaming/audiobookrequest-mcp
```

This opens the MCP Inspector web UI where you can test all tools interactively.

## Building for Publishing

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory and adds a shebang to the entry point for npx execution.

## Publishing to npm

```bash
# Build first
npm run build

# Login to npm
npm login

# Publish
npm publish
```

## Code Style

- Use TypeScript with strict mode
- Follow existing tool registration patterns
- Add descriptive tool descriptions for AI assistants
- Use Zod schemas for input validation
- Handle errors gracefully with try/catch

## Adding New Tools

1. Identify the AudioBookRequest API endpoint
2. Create a Zod schema for input parameters
3. Register the tool using `server.registerTool()`
4. Implement the handler with proper error handling
5. Add the tool to `TOOL_CALLS` and `INVOCATIONS` in `scripts/validate-endpoints.ts`
6. Run `npx tsc --noEmit` and `npm run validate:endpoints`
7. Update documentation (README.md, USAGE.md, EXAMPLES.md)

## License

MIT License - see LICENSE file for details.