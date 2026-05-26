# Teams Caption Backend

Backend server for processing Microsoft Teams captions sent from the Chrome extension.

## Folder Structure

```
backend/
├── src/
│   ├── config/       # Configuration files
│   ├── controllers/  # Request handlers
│   ├── middleware/   # Express middleware
│   ├── routes/       # API routes
│   └── utils/        # Utility functions
├── .env              # Environment variables
├── .gitignore        # Git ignore file
├── package.json      # Dependencies
└── server.js         # Main server entry point
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```

3. Start the server:
```bash
npm start          # Production
npm run dev        # Development (with hot reload)
```

The server will run on `http://localhost:3000`

## API Endpoints

### POST /api/caption
Receives captions from the Teams extension.

**Request:**
```json
{
  "text": "Caption text here"
}
```

**Response:**
```json
{
  "success": true,
  "caption": "Caption text here",
  "response": "Processing response",
  "timestamp": "2026-05-26T10:00:00.000Z"
}
```

**Headers:**
- `x-api-key: localSecretKey`
- `Content-Type: application/json`

### GET /api/caption/history
Retrieve all captions received.

### DELETE /api/caption/history
Clear caption history.

### GET /health
Health check endpoint.

## Configuration

Edit `.env` to change:
- `PORT` - Server port (default: 3000)
- `API_KEY` - API key for authentication
- `LOG_LEVEL` - Logging level (error, warn, info, debug)
- `NODE_ENV` - Environment (development/production)

## Development

For development with auto-reload:
```bash
npm run dev
```

This uses `nodemon` to restart the server on file changes.

## Notes

- The extension sends captions to `http://localhost:3000/api/caption`
- API key authentication is required for all endpoints except `/health`
- Caption history is stored in memory and will be lost on server restart
- For production, consider adding a database for persistent storage
