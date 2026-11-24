# Offer Catcher AI proxy

Small Express service that keeps AI provider keys off the device.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | /api/health | Chat/embedding configuration and RAG stats |
| POST | /api/ai/analyze | Resume + JD + local analysis → AI analysis, semantic score, RAG examples |
| POST | /api/ai/chat | Conversation + profile/context → reply |
| POST | /api/ai/embed | Embedding utility |

## Run

~~~bash
cp ../.env.example ../.env
# Fill DEEPSEEK_API_KEY and EMBEDDING_API_KEY in ../.env
npm install
npm run dev
# http://localhost:3001/api/health
~~~

The service reads the repository-root .env. It never exposes keys to the client.

## Models

- Chat: deepseek-flash (default), deepseek-v4-pro fallback for analysis.
- Embeddings: qwen3.7-text-embedding (1024 dimensions).
- RAG: excellent_resumes/*.txt, lazily embedded and cached in .cache/rag-embeddings.json.

## Tests

~~~bash
npm test
~~~

10 tests cover JSON extraction/repair, validation, cosine similarity and semantic mapping.

## Security notes

- CORS allows localhost, private LAN and Capacitor origins.
- Inputs are truncated; rate limiting is in-memory.
- JSON is schema-validated; failures fall back to the local result on the client.
- .env is git-ignored.
