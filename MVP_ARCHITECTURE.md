# Carriva MVP Architecture

This document summarizes the MVP foundation built for the AI-powered CV tailoring application.

## 1. Project Structure

The Next.js app has been bootstrapped in the `cv-app` folder with the following modular structure:

```text
cv-app/
├── prisma/
│   └── schema.prisma         # comprehensive DB schema
├── src/
│   ├── ai/                   # AI Orchestration
│   │   ├── provider.ts       # AIProvider interface
│   │   ├── service.ts        # AIService implementation (orchestrator)
│   │   └── providers/
│   │       ├── mock.ts       # Deterministic mock provider
│   │       ├── anthropic.ts  # (Stub for Anthropic implementation)
│   │       └── openai.ts     # (Stub for OpenAI implementation)
│   ├── app/                  # Next.js App Router (UI)
│   ├── components/           # Reusable UI components
│   ├── cache/                # Redis/Valkey cache utilities
│   ├── career/               # Profile management domain logic
│   └── lib/                  # Utilities (Prisma client, validation schemas)
└── .env.example              # Environment variables template
```

## 2. Setup Instructions

To run the application locally:
1. Navigate to the app directory: `cd cv-app`
2. Copy the environment variables: `cp .env.example .env`
3. Install dependencies: `npm install`
4. Ensure your Upstash Redis credentials are in `.env`.
5. Generate the Prisma Client: `npx prisma generate`
6. Start the development server: `npm run dev`

## 3. Environment Variables

```env
# Database & Cache
DATABASE_URL="mongodb+srv://user:password@cluster0.mongodb.net/carriva?retryWrites=true&w=majority"
# Redis Cache (Upstash)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# AI Configuration
AI_PROVIDER="mock" # Options: 'mock', 'anthropic', 'openai', 'google'
AI_MODEL="gpt-4o"

# API Keys
ANTHROPIC_API_KEY=""
OPENAI_API_KEY=""
GOOGLE_AI_API_KEY=""
```

## 4. Database Schema Summary

The database is designed around MongoDB with Prisma ORM. 

**Core Entities:**
- `User`: Base user account.
- `ResumeDocument`: Stores uploaded CV text/hashes.
- `CareerProfile`: The single source of truth for the user's background (versioned). Contains `Experience`, `Education`, `Project`.
- `Skill` / `UserSkill`: Normalized skills with confidence/source tracking ("confirmed", "inferred").
- `Job` / `JobRequirement`: Extracted requirements for targeting applications.
- `Application`: Tracks the workflow for a specific job target (Draft, Applied, etc.).
- `GeneratedResume` / `GeneratedCoverLetter`: Caches AI-generated JSON and HTML output for a specific application.
- `AIUsage`: Tracks tokens and provider costs.
- `CacheMetadata`: Fallback metadata caching for operations that don't need a full Redis setup.

## 5. AI Provider Architecture

The app uses a Provider Pattern to ensure zero vendor lock-in.
All AI operations funnel through the `AIService` which implements:

```typescript
export interface AIProvider {
  generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<T>;
  generateText(request: TextGenerationRequest): Promise<string>;
}
```
Business logic calls `aiService.extractResume()` which delegates to the active provider implementation, meaning changing vendors never requires rewriting domain code.

## 6. Caching Strategy

Aggressive caching is implemented to avoid repeating AI queries:
1. **CV Processing**: Keyed by `cv:<hash>:<version>`
2. **Job Analysis**: Keyed by `job:<normalized_title_company>:<version>`
3. **Tailoring**: Keyed by `tailor:<profile_version>:<job_hash>:<template_version>:<model>`
Cache invalidation is explicit—updating the profile invalidates tailored artifacts, but updating the visual template does not require re-running the AI.

## 7. How to Switch AI Providers

To switch the AI provider, simply change the `AI_PROVIDER` environment variable in your `.env` file to one of the supported strings (`mock`, `anthropic`, `openai`, `google`) and restart the application. The `AIService` acts as a factory, instantly routing to the correct SDK wrapper.

## 8. How to Run with the Mock Provider

Ensure your `.env` contains:
```env
AI_PROVIDER="mock"
```
When using the mock provider, `generateStructured` returns deterministic, hard-coded objects for schemas like `ResumeProfile` and `JobAnalysis`, allowing you to test UI rendering, PDF export, and database operations entirely offline without spending API credits.

## 9. How to Run Tests

Tests can be added using `Vitest` and `Playwright`.
Unit/Integration Tests (when written): `npm run test`
E2E (PDF generation): `npm run test:e2e`
*Make sure to set `AI_PROVIDER=mock` when running CI tests for deterministic results.*

## 10. Security & Orchestration

- **Authentication & Authorization**: Carriva uses **Better Auth** with its native MongoDB adapter as the sole authentication authority. API endpoints are secured behind `requireUser()` which validates the server session and strictly enforces domain ownership recursively (e.g., `profile.userId === authenticatedUser.id` and `application.userId === authenticatedUser.id`). Fake stub authentications and bearer tokens are strictly removed.
- **Rate Limiting**: Rate limits (e.g. 10 CV uploads per hour) are enforced via `@upstash/redis` to prevent abuse.
- **Workflow Orchestration**: Generation workflows are managed uniformly via `ApplicationService` handling safe document transition states instead of separate decoupled APIs.
- **Validation**: All API boundary payloads are strictly typed and parsed with `zod`.

## 11. Known Limitations (MVP phase)

- **Authentication UI**: No visual login UI is implemented yet, though backend authorization is enforced.
- **Visual PDF Render**: Implemented using a headless `puppeteer` instance in `download-pdf` route.

## 12. Hardening Pass Updates

- **AI Orchestration**: Fully provider-independent with OpenAI, Google, and Anthropic implementations. Strict fallbacks throw errors instead of hallucinating.
- **Deterministic Skill Matching**: Uses normalized aliases without LLM intervention to avoid hallucination. Unknown skills halt generation until explicitly confirmed.
- **Template Rendering**: Uses `cheerio` to inject structured data safely, preventing XSS and clearing mock personal data before injection.
- **Deduplication**: Job descriptions and generated artifacts are cached deterministically using cache-invalidation-safe version numbers (e.g., `promptVersion`, `profileVersion`).
- **Data Integrity**: MongoDB Unique Index constraints handle concurrent duplication via `P2002` Prisma codes.

