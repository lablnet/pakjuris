# PakJuris Server

## Overview

This directory contains the **backend API** for the PakJuris platform.  It is a Node.js + TypeScript service built with Express that powers user authentication, conversational search, and vector-based retrieval over legal documents.

Key tech stack:

- **Node.js 20** & **Express 4**
- **TypeScript** for type-safe code
- **MongoDB / Mongoose** for persistent data
- **JWT** authentication with email verification & password reset flows
- **OpenAI** OR **Google Gemini** language models (pluggable)
- **Pinecone** vector database for embeddings (optional)
- **Nodemailer** for transactional email
- **pnpm** package manager + **Docker** container

---

## Getting Started

### 1. Prerequisites

- Node.js **v20** or later
- **pnpm** ( `npm i -g pnpm` )
- A MongoDB instance (local or cloud)
- API keys / credentials for any optional services you intend to use (OpenAI, Gemini, Pinecone, SMTP …)

### 2. Installation

```bash
# clone the repo and enter the server directory
cd pakjuris/server

# install dependencies
pnpm install
```

### 3. Configuration

Copy the example environment file and fill in your secrets:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | no | Port the server listens on (default **8000**) |
| `MONGODB_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Secret used for signing JWT tokens |
| `SMTP_HOST` | yes | SMTP server host |
| `SMTP_PORT` | yes | SMTP port (e.g. 587) |
| `SMTP_SECURE` | no | `true` if the SMTP server requires TLS |
| `SMTP_USER` | yes | SMTP username |
| `SMTP_PASS` | yes | SMTP password |
| `FROM_EMAIL` | yes | The “from” address for outgoing mail |
| `OPENAI_API_KEY` | conditional | Required when using OpenAI models |
| `OPENAI_MODEL` | no | Default model ID (e.g. `gpt-4o-mini`) |
| `GEMINI_API_KEY` | conditional | Required when using Google Gemini |
| `GEMINI_EMBEDDING_MODEL` | no | Gemini embed model (default `embedding-001`) |
| `GEMINI_GENERATION_MODEL` | no | Gemini chat model (default `gemini-1.5-pro`) |
| `PINECONE_API_KEY` | optional | Your Pinecone API key |
| `PINECONE_INDEX_NAME` | optional | Pinecone index (defaults to `pakistan-legal-docs`) |
| `AZURE_OPENAI_ENDPOINT` | optional | If using Azure OpenAI |
| `AZURE_OPENAI_API_KEY` | optional | – |
| `AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME` | optional | – |
| `AZURE_API_VERSION` | optional | – |
| `NODE_ENV` | no | `development` \| `production` (affects cookies & logging) |

### 4. Running in Development

```bash
# transpile & run with automatic reload
pnpm dev
```

Open http://localhost:8000 in your browser; the API will be available under `/api`.

### 5. Building & Running for Production

```bash
# compile TypeScript to JS
pnpm build

# run the compiled output
pnpm start
```

A **PM2** profile is also included:

```bash
pnpm start:prod  # uses ecosystem.config.js
```

---

## Docker

A production-grade image can be built with the provided `Dockerfile`:

```bash
# build the image
docker build -t pakjuris-server .

# run the container (remember to pass your env file)
docker run --env-file .env -p 8000:8000 pakjuris-server
```

---

## Available npm Scripts

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Start the server with **nodemon** + **ts-node** |
| `pnpm build` | Compile TypeScript into `dist/` |
| `pnpm start` | Run the compiled JS (production mode) |
| `pnpm start:prod` | Launch via **PM2** with no warnings |

---

## API Reference

All endpoints are prefixed with `/api`.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/signup` | Register a new user |
| `POST` | `/auth/login` | Login and receive Access / Refresh tokens |
| `POST` | `/auth/verify-email` | Verify email with OTP |
| `POST` | `/auth/resend-otp` | Resend verification OTP |
| `POST` | `/auth/logout` | Invalidate tokens |
| `POST` | `/auth/refresh-token` | Get a new access token |

### Password Reset

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/reset/request` | Request a reset OTP |
| `POST` | `/auth/reset/verify` | Verify the OTP |
| `POST` | `/auth/reset/update` | Set a new password |

### User

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/user/me` | Fetch current user profile |
| `PUT` | `/user/me` | Update profile |

### Chat / Conversations (requires auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat/query` | Submit a prompt/query |
| `GET` | `/chat/conversations` | List conversations |
| `GET` | `/chat/conversations/:id` | Get a single conversation |
| `POST` | `/chat/conversations` | Create a new conversation |
| `PUT` | `/chat/conversations/:id` | Update title or archive flag |
| `DELETE` | `/chat/conversations/:id` | Delete conversation |
| `POST` | `/chat/conversations/:id/share` | Generate a shareable link |
| `POST` | `/chat/feedback` | Create feedback on a message |
| `GET` | `/chat/feedback/:messageId` | Retrieve feedback |

---

## Interactive API Docs (Swagger)

A live, interactive version of this API reference is available via **Swagger UI**:

```text
http://localhost:8000/api-docs
```

Open that URL after running the server (`pnpm dev` or `pnpm start`) to explore endpoints, schemas, and even execute requests directly from your browser.

The docs are powered by [`swagger-ui-express`](https://www.npmjs.com/package/swagger-ui-express) and a handcrafted OpenAPI 3 specification defined in `src/swagger.ts`.

---

## Project Structure (high-level)

```
server/
├─ src/
│  ├─ apps/          # Domain modules (chat, user …)
│  ├─ middleware/    # Express middlewares
│  ├─ services/      # External service wrappers (OpenAI, Gemini, Pinecone …)
│  ├─ utils/         # Helpers & error handling
│  ├─ lib/           # Shared libs (email, helpers …)
│  └─ index.ts       # Application entry point
├─ Dockerfile
├─ package.json
└─ tsconfig.json
```

---

## Contributing

1. Fork / clone the repo
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes with conventional commits
4. Open a pull request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
