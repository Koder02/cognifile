from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np

try:
    from sentence_transformers import SentenceTransformer
    import faiss
except Exception as e:
    # When dependencies are not installed, the service will raise informative errors on startup calls
    SentenceTransformer = None
    faiss = None

app = FastAPI(title='Semantic Search Service')

# Allow the frontend dev server origins to call this microservice
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

model = None
index = None
id_map = []  # list of dicts with id, name, path, meta


class Doc(BaseModel):
    id: str
    text: str
    name: Optional[str] = None
    path: Optional[str] = None
    meta: Optional[dict] = None


class SearchRequest(BaseModel):
    q: str
    top_k: Optional[int] = 5


@app.on_event('startup')
async def load_model():
    global model
    if SentenceTransformer is None:
        app.state.model_error = 'sentence-transformers or faiss not installed'
        return
    try:
        model = SentenceTransformer('all-MiniLM-L6-v2')
        app.state.model_error = None
    except Exception as e:
        app.state.model_error = str(e)


@app.post('/index')
async def index_documents(docs: List[Doc]):
    """Index a batch of documents. Each doc should include `id` and `text`.
    The service stores embeddings in an in-memory FAISS Index and keeps a metadata map.
    """
    global index, id_map
    if app.state.model_error:
        raise HTTPException(status_code=500, detail=f'Model not available: {app.state.model_error}')
    if model is None:
        raise HTTPException(status_code=500, detail='Model not loaded')
    if not docs:
        return {'added': 0}

    texts = [d.text for d in docs]
    embs = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    # Normalize embeddings for cosine similarity
    faiss.normalize_L2(embs)
    dim = embs.shape[1]

    if index is None:
        index = faiss.IndexFlatIP(dim)
    try:
        index.add(embs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to add embeddings to index: {e}')

    for d in docs:
        id_map.append({'id': d.id, 'name': d.name, 'path': d.path, 'meta': d.meta})

    return {'added': len(docs)}


@app.post('/search')
async def search(req: SearchRequest):
    """Search the indexed documents by query string. Accepts a JSON body { q: str, top_k?: int }.
    Returns top_k results ranked by cosine similarity."""
    if app.state.model_error:
        raise HTTPException(status_code=500, detail=f'Model not available: {app.state.model_error}')
    if model is None or index is None:
        return {'results': []}

    q = req.q
    top_k = req.top_k or 5

    q_emb = model.encode([q], convert_to_numpy=True, show_progress_bar=False)
    faiss.normalize_L2(q_emb)
    try:
        D, I = index.search(q_emb, top_k)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'FAISS search failed: {e}')

    results = []
    for score, idx in zip(D[0], I[0]):
        if idx < 0 or idx >= len(id_map):
            continue
        meta = id_map[int(idx)]
        results.append({'id': meta['id'], 'score': float(score), 'name': meta.get('name'), 'path': meta.get('path'), 'meta': meta.get('meta')})

    return {'results': results}


@app.post('/clear')
async def clear_index():
    global index, id_map
    index = None
    id_map = []
    return {'cleared': True}
