# Explainit

Explainit helps teams create shareable AI chats powered by their own documentation. It combines a web client, an API, and document ingestion so developers can ask questions and get grounded answers quickly.

Watch a short demo of Explainit in action [here](https://www.loom.com/share/4f5aac7836f44e27a3cdd1854b566d46).

## Features

- Ingest documentation content and make it searchable through chat
- Share chat experiences for internal or public use cases
- Run locally with Docker for full-stack development
- Self-host with a production Docker Compose stack
- Run client and server separately for faster local iteration

## Running your own Explainit instance

The easiest way to self-host is Docker Compose (dashboard, visitor API, and launcher on one origin):

```bash
cd deploy/compose
cp .env.example .env
# set PUBLIC_URL, OPENROUTER_API_KEY, HTTP_AUTH_USERNAME, HTTP_AUTH_PASSWORD, AUTH_SECRET
docker compose up -d
```

Open `PUBLIC_URL` (default `http://localhost`) and sign in. Full configuration, TLS, backups, and upgrades: [Docker deployment docs](docs/docker-deployment.md).

Images: `ghcr.io/matzapata/explainit-server` and `ghcr.io/matzapata/explainit-client` (or `docker compose up --build` from this repo).

## Documentation

- [Architecture](docs/architecture.md)
- [Docker deployment (self-host)](docs/docker-deployment.md)
- [Contributing and local workflows](CONTRIBUTING.md)

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before opening issues or pull requests.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
