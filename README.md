# AudioBookRequest MCP Server

A Model Context Protocol (MCP) server for [AudioBookRequest](https://github.com/markbeep/AudioBookRequest) — the lightweight audiobook request management tool for Plex/Audiobookshelf/Jellyfin.

This MCP server exposes AudioBookRequest's REST API as MCP tools, allowing AI assistants to search for audiobooks, manage requests, track downloads, and administer your audiobook library.

## Features

- 🔍 Search audiobooks via the Audible API
- 📋 Manage audiobook requests (create, list, cancel)
- ⬇️ Track and trigger downloads via Prowlarr
- 👥 User management (create, update, delete users)
- 📚 Manual request handling for non-Audible books
- ⚙️ Indexer configuration management
- 🏥 Health checks

## Prerequisites

- Node.js 20+
- An AudioBookRequest instance with API access
- An API key from your AudioBookRequest instance (Settings > API Keys)

## Installation

```bash
# Clone or download this repository
cd audiobookrequest-mcp

# Install dependencies
npm install
```

## Configuration

Set the following environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `ABR_BASE_URL` | Yes | Your AudioBookRequest instance URL (e.g., `http://localhost:8000`) |
| `ABR_API_KEY` | Yes | Your AudioBookRequest API key |
| `TOOL_PREFIX` | No | Optional prefix for all tool names (e.g., `audiobook` → `audiobook_search_books`) |

Example:
```bash
export ABR_BASE_URL=http://192.168.1.159:8765
export ABR_API_KEY=your-api-key-here
```

## Running the Server

### Via npx (recommended)

```bash
ABR_BASE_URL=http://your-instance:8000 ABR_API_KEY=your-api-key npx @spaghetgaming/audiobookrequest-mcp
```

This runs the latest published version without installing anything locally.

### Local development

```bash
# Clone or download this repository
cd audiobookrequest-mcp

# Install dependencies
npm install

# Run locally
export ABR_BASE_URL=http://your-instance:8000
export ABR_API_KEY=your-api-key
npm start
```

### With the MCP Inspector (for testing)

```bash
npx @modelcontextprotocol/inspector npx @spaghetgaming/audiobookrequest-mcp
```

This opens a web UI where you can test all tools interactively.

## Available Tools

### Search

| Tool | Description |
|------|-------------|
| `search_books` | Search for audiobooks by title, author, or narrator |
| `get_request` | Get details of a specific request by ASIN |

### Request Management

| Tool | Description |
|------|-------------|
| `list_requests` | List all requests with optional filter (all/downloaded/not_downloaded) |
| `request_book` | Create a new request by ASIN |
| `cancel_request` | Cancel a request by ASIN |
| `mark_downloaded` | Mark a book as downloaded (admin) |

### Download Management

| Tool | Description |
|------|-------------|
| `get_download_sources` | Get available download sources from Prowlarr |
| `download_book` | Start downloading a specific source (admin) |
| `auto_download` | Start auto-download using quality heuristics |

### Manual Requests

| Tool | Description |
|------|-------------|
| `list_manual_requests` | List manual requests (non-Audible books) |
| `create_manual_request` | Create a manual request |
| `update_manual_request` | Update a manual request |
| `delete_manual_request` | Delete a manual request (admin) |
| `mark_manual_downloaded` | Mark manual request as downloaded (admin) |

### User Management (Admin)

| Tool | Description |
|------|-------------|
| `list_users` | List all users |
| `get_user` | Get user details |
| `create_user` | Create a new user |
| `update_user` | Update a user |
| `delete_user` | Delete a user |

### System

| Tool | Description |
|------|-------------|
| `get_indexer_configurations` | Get indexer config options |
| `update_indexer` | Update indexer configuration |
| `health_check` | Check instance health |

## Examples

### Search for a book

```json
{
  "tool": "search_books",
  "arguments": {
    "query": "Project Hail Mary Andy Weir",
    "num_results": 5
  }
}
```

### Request a book

```json
{
  "tool": "request_book",
  "arguments": {
    "asin": "B08F3Z8QXV"
  }
}
```

### List pending requests

```json
{
  "tool": "list_requests",
  "arguments": {
    "filter": "not_downloaded"
  }
}
```

### Create a manual request

```json
{
  "tool": "create_manual_request",
  "arguments": {
    "title": "Custom Audiobook",
    "author": "Author Name",
    "narrator": "Narrator Name",
    "info": "Special edition, 2024"
  }
}
```

### Start auto-download

```json
{
  "tool": "auto_download",
  "arguments": {
    "asin": "B08F3Z8QXV"
  }
}
```

## Integration with MCP Clients

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "audiobookrequest": {
      "command": "npx",
      "args": ["@spaghetgaming/audiobookrequest-mcp"],
      "env": {
        "ABR_BASE_URL": "http://your-instance:8000",
        "ABR_API_KEY": "your-api-key"
      }
    }
  }
}
```

### VS Code (with MCP extension)

Configure in your MCP settings:

```json
{
  "servers": {
    "audiobookrequest": {
      "type": "stdio",
      "command": "npx",
      "args": ["@spaghetgaming/audiobookrequest-mcp"],
      "env": {
        "ABR_BASE_URL": "http://your-instance:8000",
        "ABR_API_KEY": "your-api-key"
      }
    }
  }
}
```

## License

MIT

## Credits

Built on top of [AudioBookRequest](https://github.com/markbeep/AudioBookRequest) by markbeep.