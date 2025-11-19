# Skyjo

A multiplayer card game implementation of Skyjo built with Node.js, Express, and React.

## Features

- Real-time multiplayer gameplay
- Room-based game sessions
- Support for 2-8 players
- Complete game logic including initial flip phase, main play, and final round
- Responsive web interface
- No build process required (CDN-based React)

## Prerequisites

- Node.js 18.x or higher
- npm (comes with Node.js)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd 2025-11-Skyjo
```

2. Install dependencies:

```bash
npm install
```

## Running Locally

Start the development server:

```bash
npm run server
```

The server will start on `http://localhost:4000` by default.

Open your browser and navigate to `http://localhost:4000` to play.

## Running Tests

Run the test suite:

```bash
npm test
```

## Deployment

### Environment Variables

The following environment variables can be configured:

- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment mode: `development`, `production`, or `test` (default: `development`)

Example:

```bash
PORT=8080 NODE_ENV=production npm start
```

### Process Management with PM2

For production deployment, use PM2 to manage the Node.js process:

1. Install PM2 globally:

```bash
npm install -g pm2
```

2. Start the application:

```bash
pm2 start backend/server.js --name skyjo
```

3. Save PM2 configuration:

```bash
pm2 save
pm2 startup
```

4. Useful PM2 commands:

```bash
pm2 list              # List all processes
pm2 logs skyjo        # View logs
pm2 restart skyjo     # Restart the application
pm2 stop skyjo        # Stop the application
pm2 delete skyjo      # Remove from PM2
```

### Reverse Proxy with Nginx (Optional)

For production, you may want to set up Nginx as a reverse proxy:

1. Install Nginx:

```bash
sudo apt update
sudo apt install nginx
```

2. Create a configuration file `/etc/nginx/sites-available/skyjo`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/skyjo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Security Considerations

- The server listens on all interfaces (`0.0.0.0`) by default when deployed
- Use a reverse proxy (Nginx) with SSL/TLS certificates for HTTPS in production
- Consider using a firewall to restrict access to necessary ports only
- Game state is stored in memory and will be lost on server restart
- For production, consider implementing rate limiting and request validation

## API Endpoints

### Health Check

- `GET /health` - Returns server health status

### Rooms

- `GET /rooms` - List all active room IDs
- `POST /rooms` - Create a new room (optional `roomId` in body)
- `GET /rooms/:roomId` - Get room state
- `POST /rooms/:roomId/join` - Join a room (requires `name` in body)
- `POST /rooms/:roomId/start` - Start the game in a room
- `POST /rooms/:roomId/reset` - Reset a room

### Game Actions

- `POST /rooms/:roomId/initial-flip` - Reveal a card during initial flip phase (requires `playerName` and `position` in body)
- `POST /rooms/:roomId/main/draw` - Draw a card from deck or discard (requires `playerName` and `source` in body)
- `POST /rooms/:roomId/main/replace` - Replace a card with drawn card (requires `playerName` and `position` in body)
- `POST /rooms/:roomId/main/reveal` - Reveal a card after discarding (requires `playerName` and `position` in body)

## Project Structure

```
.
├── backend/          # Express server and API
│   ├── config/       # Configuration files
│   ├── controllers/  # Request handlers
│   ├── middleware/   # Express middleware
│   ├── models/       # Data models and serializers
│   ├── routes/       # API route definitions
│   └── services/     # Business logic
├── frontend/         # React frontend application
│   ├── assets/       # Static assets (images, styles)
│   ├── components/   # React components
│   ├── services/     # API client
│   └── utils/        # Utility functions
├── shared/           # Shared code between frontend and backend
│   ├── models/       # Shared game models
│   └── utils/        # Shared utilities
└── tests/            # Test utilities and setup
```

## License

This project is licensed under a free non-commercial license. You are free to use, modify, and distribute this software for non-commercial purposes only. Commercial use is prohibited without explicit permission.
