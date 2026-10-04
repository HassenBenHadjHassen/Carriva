# Carriva MVP Architecture

This document summarizes the MVP foundation built for the AI-powered CV tailoring application.

## 1. Project Structure

The Next.js app is located in the root directory with the following modular structure:

```text
/
├── prisma/
│   └── schema.prisma         # comprehensive DB schema
├── src/
│   ├── ai/                   # AI Orchestration
│   │   ├── provider.ts       # AIProvider interface
│   │   ├── service.ts        # AIService implementation (orchestrator)
│   │   └── providers/
│   │       ├── mock.ts       # Deterministic mock provider
│   │       ├── anthropic.ts  # Anthropic implementation
│   │       └── openai.ts     # OpenAI implementation
│   ├── app/                  # Next.js App Router (UI)
│   ├── components/           # Reusable UI components
│   ├── cache/                # Redis/Valkey cache utilities
│   ├── career/               # Profile management domain logic
│   └── lib/                  # Utilities (Prisma client, validation schemas)
└── .github/workflows/        # CI/CD pipelines
```

## 2. Setup Instructions

To run the application locally:
1. Copy the environment variables: `cp .env.example .env`
2. Install dependencies: `npm install`
3. Ensure your Upstash Redis credentials are in `.env`.
4. Generate the Prisma Client: `npx prisma generate`
5. Start the development server: `npm run dev`

## 3. Database Schema Summary

The database is designed around MongoDB with Prisma ORM. 

**Core Entities:**
- `User`: Base user account.
- `ResumeDocument`: Stores uploaded CV text/hashes.
- `CareerProfile`: The single source of truth for the user's background (versioned).
- `Skill` / `UserSkill`: Normalized skills with confidence/source tracking ("confirmed", "inferred").
- `Job` / `JobRequirement`: Extracted requirements for targeting applications.
- `Application`: Tracks the workflow for a specific job target (Draft, Applied, etc.).
- `GeneratedResume` / `GeneratedCoverLetter`: Caches AI-generated JSON and HTML output.
- `AIUsage`: Tracks tokens and provider costs.

## 4. AI Provider Architecture & Fallback

The app uses a Provider Pattern to ensure zero vendor lock-in.
All AI operations funnel through the `AIService`.
An intelligent fallback mechanism distinguishes between actual model failures/authentication errors (which are thrown immediately) and rate-limit/quota exhaustion (which trigger the fallback provider seamlessly).

## 5. Security & Orchestration

- **Authentication & Authorization**: Carriva uses **Better Auth** with its native MongoDB adapter. API endpoints are secured behind `requireUser()`.
- **Rate Limiting**: Rate limits are enforced via `@upstash/redis` to prevent abuse.
- **Workflow Orchestration**: Generation workflows are managed uniformly via `ApplicationService`.
- **Validation**: All API boundary payloads are strictly typed and parsed with `zod`.
- **CV Uploads**: Strict validation ensuring only PDF documents are parsed to prevent malicious payloads.

## 6. Hardening Pass Updates

- **AI Orchestration**: Fully provider-independent with strict fallbacks.
- **Deterministic Skill Matching**: Uses normalized aliases without LLM intervention. Differentiates between 'matched', 'inferred', 'missing', and 'unknown'.
- **Template Rendering**: Uses `react-dom/server` to render and inject structured data safely.
- **Deduplication**: Job descriptions and generated artifacts are cached deterministically.
