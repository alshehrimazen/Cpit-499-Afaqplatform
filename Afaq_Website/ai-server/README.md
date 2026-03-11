# Afaq AI Server

Backend that generates **study plans**, **flashcards**, **quizzes**, **final exams**, and **module slides** for the Afaq Platform. It can use **OpenAI** when an API key is set, or return **mock data** so the app works without any key.

## Quick start

```bash
cd ai-server
npm install
cp .env.example .env
# Optional: add OPENAI_API_KEY=sk-... to .env for real AI generation
npm run dev
```

Server runs at **http://localhost:4000**.

## Frontend setup

In the project root, copy `.env.example` to `.env` and set:

```env
VITE_AI_API_BASE_URL=http://localhost:4000
```

Then run the website (`npm run dev`). After completing **diagnostic + preferences**, the app will request a plan from this server.

## API endpoints

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/ai/plan` | `{ level, preferences }` | Returns an array of study plans |
| POST | `/ai/flashcards` | `{ moduleId, topic? }` | Returns array of `{ id, front, back }` |
| POST | `/ai/quiz` | `{ moduleId, topic? }` | Returns `{ title, questions[] }` |
| POST | `/ai/final-exam` | `{ planId, level? }` | Returns array of exam questions |
| POST | `/ai/module-content` | `{ moduleId, topic? }` | Returns `{ title, slides[] }` |
| GET | `/health` | – | Health check |

## Environment variables

- **PORT** – Server port (default `4000`).
- **OPENAI_API_KEY** – If set, content is generated with OpenAI; otherwise mock data is returned.
- **OPENAI_MODEL** – Model name (default `gpt-4o-mini`).

## Using the generated content in the app

- **Plans**: Already wired in `App.tsx` – after preferences, the app calls `generatePlan()` and uses the result if the API is configured.
- **Flashcards / Quiz / Exam / Slides**: Use the functions in `src/services/aiApi.ts` from your components (`LessonFlashcards`, `QuizInterface`, `FinalExam`, `StudyModule`). Call the API when the user opens a module; if the response is `null`, keep using your existing static data.
