# AudioBookRequest MCP Server

A Model Context Protocol (MCP) server for [AudioBookRequest](https://github.com/markbeep/AudioBookRequest) — the lightweight audiobook request management tool for Plex/Audiobookshelf/Jellyfin.

This MCP server exposes AudioBookRequest's REST API as MCP tools, allowing AI assistants to search for audiobooks, manage requests, track downloads, get recommendations, and administer your audiobook library.

## Features

- 🔍 Search audiobooks via the Audible API
- 📋 Manage audiobook requests (create, list, cancel)
- ⬇️ Track and trigger downloads via Prowlarr
- 👥 User management (create, update, delete users)
- 📚 Manual request handling for non-Audible books
- 🏥 Health checks
- ⚙️ Indexer configuration management
- 📊 Recommendations (user-based, popular, recent, categories, authors, narrators)
- 🔔 Notification configuration management
- ⬇️ Download quality settings management
- 🎧 Audiobookshelf integration settings
- 🔗 Prowlarr integration settings
- 🔐 Security settings (OIDC, login type)

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

### Validate API Endpoints

To verify that all MCP tools match the AudioBookRequest OpenAPI spec:

```bash
npm run validate:endpoints
```

This fetches the OpenAPI spec from your instance and validates all 43 endpoints.

```bash
npx @modelcontextprotocol/inspector npx @spaghetgaming/audiobookrequest-mcp
```

This opens a web UI where you can test all tools interactively.

## Available Tools

### Search

| Tool | Description |
|------|-------------|
| `search_books` | Search for audiobooks by title, author, or narrator |

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

### Recommendations

| Tool | Description |
|------|-------------|
| `get_user_recommendations` | Personalized recommendations based on user history |
| `get_popular_recommendations` | Popular recommendations by request frequency |
| `get_recent_recommendations` | Recently requested recommendations |
| `get_fallback_recommendations` | Fallback popular recommendations from Audible |
| `get_category_recommendations` | Recommendations by popular categories |
| `get_author_recommendations` | Recommendations based on popular authors |
| `get_narrator_recommendations` | Recommendations based on popular narrators |

### Settings Management (Admin)

| Tool | Description |
|------|-------------|
| `list_notifications` | List all notification configurations |
| `create_notification` | Create or update a notification configuration |
| `delete_notification` | Delete a notification configuration |
| `test_notification` | Send a test notification |
| `get_download_settings` | Get download and quality settings |
| `update_download_settings` | Update download and quality settings |
| `get_abs_settings` | Get Audiobookshelf integration settings |
| `update_abs_settings` | Update Audiobookshelf integration settings |
| `get_prowlarr_settings` | Get Prowlarr integration settings |
| `update_prowlarr_settings` | Update Prowlarr integration settings |
| `get_security_settings` | Get security settings (OIDC, login type) |
| `update_security_settings` | Update security settings (OIDC, login type) |

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

### Get personalized recommendations

```json
{
  "tool": "get_user_recommendations",
  "arguments": {
    "limit": 10
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

### Configure notifications

```json
{
  "tool": "create_notification",
  "arguments": {
    "name": "Discord Notifications",
    "url": "https://discord.com/api/webhooks/...",
    "event_type": "request_created",
    "body": "{\"content\": \"New request: {{book.title}}\"}",
    "body_type": "json"
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