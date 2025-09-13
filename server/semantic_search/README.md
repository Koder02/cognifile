# Semantic Search Microservice

This microservice provides a simple FAISS-backed semantic search API using SentenceTransformers.

Requirements
- Python 3.8+
- Install dependencies: `pip install -r requirements.txt`

Run

```bash
cd server/semantic_search
uvicorn app:app --host 0.0.0.0 --port 8001 --reload
```

Endpoints
- POST `/index` - body: list of documents {id, text, name?, path?, meta?}
- POST `/search` - query param `q`, `top_k` (optional)
- POST `/clear` - clear the index

Note: This service loads the `all-MiniLM-L6-v2` model by default. Ensure you have enough download bandwidth.
