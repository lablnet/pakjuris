# PakJuris

PakJuris is a comprehensive legal information system that consists of a web application, server API, and document scrapers to process and make legal documents accessible.

## Project Structure

```
PakJuris/
├── web/                  # Frontend web application (React/TypeScript)
│   ├── src/              # Source code
│   ├── public/           # Public assets
│   ├── package.json      # Frontend dependencies
│   └── .env              # Environment variables
│
├── server/               # Backend API server (Node.js/TypeScript)
│   ├── src/              # Source code
│   ├── package.json      # Backend dependencies
│   └── .env              # Environment variables
│
├── scraper/              # Document scraping and processing scripts
│   ├── scrapers/         # Individual scrapers for different sources
│   ├── helper/           # Helper functions for scraping
│   ├── pdfs/             # PDF storage directory
│   └── package.json      # Scraper dependencies
│
└── downloads/            # Downloaded document storage
```

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- pnpm (preferred package manager)
- Database (as specified in server/.env)


## Key Features

- Legal document search and retrieval
- Document vectorization and semantic search
- User-friendly web interface
- API for accessing legal documents

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, TypeScript
- **Data Processing**: Document vectorization, PDF processing
- **Storage**: Database, S3 compatible storage
