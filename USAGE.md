# AudioBookRequest MCP Server — Usage Guide

## Quick Start

1. **Get your API key**: In AudioBookRequest, go to Settings > Account > API Keys and create a new key.

2. **Configure environment**:
   ```bash
   export ABR_BASE_URL=http://your-instance:8000
   export ABR_API_KEY=your-api-key-here
   ```

3. **Run the server**:
   ```bash
   npx @spaghetgaming/audiobookrequest-mcp
   ```

4. **Connect your MCP client** to the server.

## Common Workflows

### Finding and Requesting a Book

1. Search for the book:
   ```json
   {"tool": "search_books", "arguments": {"query": "Dune Frank Herbert"}}
   ```

2. Note the ASIN from the results.

3. Request the book:
   ```json
   {"tool": "request_book", "arguments": {"asin": "B08XYZ1234"}}
   ```

### Managing the Wishlist

**See all pending requests:**
```json
{"tool": "list_requests", "arguments": {"filter": "not_downloaded"}}
```

**See what's been downloaded:**
```json
{"tool": "list_requests", "arguments": {"filter": "downloaded"}}
```

**Remove a request:**
```json
{"tool": "cancel_request", "arguments": {"asin": "B08XYZ1234"}}
```

### Downloading Books

**Check available sources:**
```json
{"tool": "get_download_sources", "arguments": {"asin": "B08XYZ1234"}}
```

**Start auto-download (best quality):**
```json
{"tool": "auto_download", "arguments": {"asin": "B08XYZ1234"}}
```

**Download a specific source:**
```json
{
  "tool": "download_book",
  "arguments": {
    "asin": "B08XYZ1234",
    "guid": "source-guid-here",
    "indexer_id": 1
  }
}
```

**Mark as downloaded manually:**
```json
{"tool": "mark_downloaded", "arguments": {"asin": "B08XYZ1234"}}
```

### Manual Requests (Non-Audible Books)

For books not available on Audible:

```json
{
  "tool": "create_manual_request",
  "arguments": {
    "title": "My Custom Book",
    "author": "Author Name",
    "narrator": "Narrator Name",
    "subtitle": "A Novel",
    "publish_date": "2024-01-15",
    "info": "Special edition"
  }
}
```

### User Management

**Create a new user:**
```json
{
  "tool": "create_user",
  "arguments": {
    "username": "newuser",
    "password": "securepassword",
    "group": "trusted"
  }
}
```

**List all users:**
```json
{"tool": "list_users", "arguments": {}}
```

**Change user group:**
```json
{
  "tool": "update_user",
  "arguments": {
    "username": "newuser",
    "group": "admin"
  }
}
```

### System Health

**Check if the instance is running:**
```json
{"tool": "health_check", "arguments": {}}
```

## Tool Reference

### search_books

Search for audiobooks using the Audible API.

**Parameters:**
- `query` (string, required): Search term (title, author, narrator)
- `num_results` (number, optional): Results per page (default: 20)
- `page` (number, optional): Page number (default: 0)

**Returns:** List of books with title, authors, ASIN, runtime, cover image, download status, and who requested them.

### list_requests

List all audiobook requests.

**Parameters:**
- `filter` (string, optional): "all", "downloaded", or "not_downloaded" (default: "all")

**Returns:** List of requests with book details and requesters.

### request_book

Create a new audiobook request.

**Parameters:**
- `asin` (string, required): ASIN of the book

**Returns:** Confirmation of request creation.

### cancel_request

Cancel/delete a request.

**Parameters:**
- `asin` (string, required): ASIN of the book

**Returns:** Confirmation of cancellation.

### mark_downloaded

Mark a book as downloaded (admin only).

**Parameters:**
- `asin` (string, required): ASIN of the book

**Returns:** Confirmation.

### get_download_sources

Get available download sources from Prowlarr.

**Parameters:**
- `asin` (string, required): ASIN of the book
- `only_cached` (boolean, optional): Only return cached results (default: false)

**Returns:** List of available sources with quality info.

### download_book

Start downloading a specific source (admin only).

**Parameters:**
- `asin` (string, required): ASIN of the book
- `guid` (string, required): GUID of the download source
- `indexer_id` (number, required): Indexer ID

**Returns:** Confirmation that download started.

### auto_download

Start auto-download using quality heuristics.

**Parameters:**
- `asin` (string, required): ASIN of the book

**Returns:** Confirmation that auto-download started.

### list_manual_requests

List manual audiobook requests.

**Parameters:** None

**Returns:** List of manual requests.

### create_manual_request

Create a manual request for a non-Audible book.

**Parameters:**
- `title` (string, required): Book title
- `author` (string, required): Author name(s), comma-separated
- `narrator` (string, optional): Narrator name(s), comma-separated
- `subtitle` (string, optional): Subtitle
- `publish_date` (string, optional): Publish date
- `info` (string, optional): Additional info

**Returns:** Confirmation of creation.

### update_manual_request

Update a manual request.

**Parameters:**
- `id` (string, required): UUID of the request
- `title` (string, required): Book title
- `author` (string, required): Author name(s)
- `narrator` (string, optional): Narrator name(s)
- `subtitle` (string, optional): Subtitle
- `publish_date` (string, optional): Publish date
- `info` (string, optional): Additional info

**Returns:** Confirmation of update.

### delete_manual_request

Delete a manual request (admin only).

**Parameters:**
- `id` (string, required): UUID of the request

**Returns:** Confirmation of deletion.

### mark_manual_downloaded

Mark a manual request as downloaded (admin only).

**Parameters:**
- `id` (string, required): UUID of the request

**Returns:** Confirmation.

### list_users

List all users (admin only).

**Parameters:**
- `limit` (number, optional): Max users to return (default: 50)
- `offset` (number, optional): Pagination offset (default: 0)

**Returns:** List of users with usernames and groups.

### get_user

Get details of a specific user (admin only).

**Parameters:**
- `username` (string, required): Username

**Returns:** User details including group and root status.

### create_user

Create a new user (admin only).

**Parameters:**
- `username` (string, required): Username
- `password` (string, required): Password
- `group` (string, optional): "untrusted", "trusted", or "admin" (default: "untrusted")
- `root` (boolean, optional): Make root admin (default: false)

**Returns:** Created user details.

### update_user

Update a user (admin only).

**Parameters:**
- `username` (string, required): Username to update
- `password` (string, optional): New password
- `group` (string, optional): New group

**Returns:** Updated user details.

### delete_user

Delete a user (admin only).

**Parameters:**
- `username` (string, required): Username to delete

**Returns:** Confirmation of deletion.

### get_indexer_configurations

Get configuration options for all indexers (admin only).

**Parameters:** None

**Returns:** Indexer configuration schema.

### update_indexer

Update indexer configuration (admin only).

**Parameters:**
- `indexer` (string, required): Indexer name
- `config` (object, required): Configuration values by key; use the types reported by `get_indexer_configurations`

**Returns:** Confirmation of update.

### health_check

Check if the AudioBookRequest instance is healthy.

**Parameters:** None

**Returns:** Health status.