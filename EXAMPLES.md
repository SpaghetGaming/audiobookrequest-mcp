# AudioBookRequest MCP — Examples

## Example 1: Search and Request a Book

**User asks:** "Can you find and request 'The Three-Body Problem' by Cixin Liu?"

**MCP tool calls:**
```json
// Step 1: Search for the book
{
  "tool": "search_books",
  "arguments": {
    "query": "The Three-Body Problem Cixin Liu",
    "num_results": 5
  }
}

// Step 2: Request the book (using ASIN from search results)
{
  "tool": "request_book",
  "arguments": {
    "asin": "B00JQKQ78W"
  }
}
```

## Example 2: Check Wishlist Status

**User asks:** "What audiobooks are waiting to be downloaded?"

**MCP tool call:**
```json
{
  "tool": "list_requests",
  "arguments": {
    "filter": "not_downloaded"
  }
}
```

## Example 3: Download a Specific Book

**User asks:** "Can you download 'Project Hail Mary'?"

**MCP tool calls:**
```json
// Step 1: Find the book in requests
{
  "tool": "list_requests",
  "arguments": {
    "filter": "not_downloaded"
  }
}

// Step 2: Start auto-download
{
  "tool": "auto_download",
  "arguments": {
    "asin": "B08F3Z8QXV"
  }
}
```

## Example 4: Create Manual Request

**User asks:** "Add a request for the audiobook 'Custom Book Title' by Jane Doe, narrated by John Smith."

**MCP tool call:**
```json
{
  "tool": "create_manual_request",
  "arguments": {
    "title": "Custom Book Title",
    "author": "Jane Doe",
    "narrator": "John Smith"
  }
}
```

## Example 5: User Management

**User asks:** "Create a new user 'alice' with trusted access."

**MCP tool call:**
```json
{
  "tool": "create_user",
  "arguments": {
    "username": "alice",
    "password": "tempPassword123",
    "group": "trusted"
  }
}
```

## Example 6: Check Download Sources

**User asks:** "What download options are available for 'Dune'?"

**MCP tool call:**
```json
{
  "tool": "get_download_sources",
  "arguments": {
    "asin": "B003ZQXK6O"
  }
}
```

## Example 7: Health Check

**User asks:** "Is AudioBookRequest running?"

**MCP tool call:**
```json
{
  "tool": "health_check",
  "arguments": {}
}
```

## Example 8: Mark as Downloaded

**User asks:** "Mark 'The Martian' as downloaded — I got it manually."

**MCP tool call:**
```json
{
  "tool": "mark_downloaded",
  "arguments": {
    "asin": "B00O7PWMSM"
  }
}
```

## Example 9: List All Users

**User asks:** "Who has access to the audiobook library?"

**MCP tool call:**
```json
{
  "tool": "list_users",
  "arguments": {}
}
```

## Example 10: Cancel a Request

**User asks:** "Cancel my request for 'Some Book'."

**MCP tool calls:**
```json
// Step 1: Find the book
{
  "tool": "list_requests",
  "arguments": {
    "filter": "not_downloaded"
  }
}

// Step 2: Cancel the request
{
  "tool": "cancel_request",
  "arguments": {
    "asin": "B012345678"
  }
}
```