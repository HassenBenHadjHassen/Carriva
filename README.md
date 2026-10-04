# Carriva

Carriva is an AI-powered CV tailoring web application designed to help users extract their career profiles and seamlessly tailor them to specific job descriptions.

## Features

- **CV Upload & Extraction**: Convert existing CVs into structured career profiles, automatically extracting work experience, education, skills, and contact information.
- **Job Analysis**: Compare your profile against job descriptions to identify missing and matching skills.
- **AI-Powered Tailoring**: Generate customized CVs and cover letters targeted to a specific job, with intelligent placeholder replacement.
- **Provider Agnostic & Resilient**: Switch seamlessly between AI providers (Google, Anthropic, OpenAI, HuggingFace) or use a local Mock provider. Features an automatic fallback system that distinguishes between rate-limits/quota exhaustion and actual failures.
- **Application Tracking**: Manage your job applications across different stages (Draft, Applied, Interview, Offer, Rejected, Archived) with color-coded status badges.
- **High-Performance PDF Generation**: Fast, low-latency PDF downloads powered by a highly optimized Puppeteer browser singleton.
- **Caching Layer**: Heavily caches AI responses (via Upstash Redis) and artifacts to optimize API costs and speed.

## Engineering & Architecture

We built Carriva using modern production-grade engineering practices:

- **Next.js App Router**: Optimized for server components and fast edge rendering.
- **TypeScript**: End-to-end type safety.
- **Prisma + MongoDB**: Flexible document model but strictly typed.
- **Better Auth**: Seamless authentication integration.
- **Redis/Upstash**: Powerful caching layer for AI responses and API rate limiting.
- **Multi-provider AI abstraction**: Hot-swappable AI layer (Mock, Google, OpenAI, Anthropic, HuggingFace).
- **Zod validation**: Runtime schema validation for all AI outputs and API boundaries.
- **Deterministic skill matching**: Ensures AI does not hallucinate skills you don't possess.
- **Puppeteer PDF rendering**: Fast, headless Chromium service for crisp PDF export.
- **Automated CI/CD Tests**: Integrated GitHub Actions for linting and testing.

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

For more detailed information regarding the database schema, caching strategy, and AI service orchestration, please see the `MVP_ARCHITECTURE.md` document in the root workspace.
