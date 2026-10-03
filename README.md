# Carriva

Carriva is an AI-powered CV tailoring web application designed to help users extract their career profiles and seamlessly tailor them to specific job descriptions.

## Features

- **CV Upload & Extraction**: Convert existing CVs into structured career profiles.
- **Job Analysis**: Compare your profile against job descriptions to identify missing and matching skills.
- **AI-Powered Tailoring**: Generate customized CVs and cover letters targeted to a specific job.
- **Provider Agnostic**: Switch seamlessly between AI providers (Anthropic, OpenAI, Google) or use a local Mock provider for cost-free development.
- **Caching Layer**: Heavily caches AI responses (via Upstash Redis) and artifacts to optimize API costs and speed.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB (via [Prisma ORM](https://www.prisma.io/))
- **Cache**: [Upstash Redis](https://upstash.com/)
- **Schema Validation**: Zod

## Getting Started

### 1. Environment Setup

Create a `.env` file in the root directory (you can copy `.env.example`):

```bash
cp .env.example .env
```

Ensure the following credentials are provided:
- `DATABASE_URL` (MongoDB connection string)
- `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` (Upstash Redis credentials)
- `AI_PROVIDER` (Set to `mock` for local testing, or `anthropic`, `openai`, etc.)
- Your chosen AI provider's API key.

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

Generate the Prisma client:

```bash
npx prisma generate
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Architecture

For more detailed information regarding the database schema, caching strategy, and AI service orchestration, please see the `MVP_ARCHITECTURE.md` document in the parent workspace.
