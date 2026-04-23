
# Explainit

Explainit helps teams create shareable AI chats powered by their own documentation. It combines a web client, an API, and document ingestion so developers can ask questions and get grounded answers quickly.

## Features

- Ingest documentation content and make it searchable through chat
- Share chat experiences for internal or public use cases
- Run locally with Docker for full-stack development
- Run client and server separately for faster local iteration
- Extend with your own auth, storage, and deployment setup

## Quick Start

### Docker (recommended)

1. Create required environment files:
   - `server/.env.local`
   - `client/.env.local`
2. Build and start all services:
   - `docker-compose up --build`
3. Access the app and API:
   - Client: `http://localhost:3000`
   - API: `http://localhost:4000`

### Local development

1. Start Postgres (or use your own database), then configure environment files:
   - `server/.env.local`
   - `client/.env.local`
2. Install dependencies:
   - `cd server && npm install`
   - `cd ../client && npm install`
3. Run the backend:
   - `cd ../server && npm run dev`
4. Run the frontend in a second terminal:
   - `cd ../client && npm run dev`

## Documentation

- [Architecture](docs/architecture.md)
- [Contributing and local/deployment workflows](CONTRIBUTING.md)

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before opening issues or pull requests.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
