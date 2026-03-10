import os
import asyncio
import json
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import aiohttp
import uuid
from datetime import datetime

# Load .env file
from dotenv import load_dotenv
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# History and Settings file paths
HISTORY_FILE = Path(__file__).parent / "chat_history.json"
SETTINGS_FILE = Path(__file__).parent / "settings.json"


# Settings Management
def get_settings() -> Dict[str, Any]:
    if not SETTINGS_FILE.exists():
        default_settings = {
            "llm_provider": "groq",
            "llm_model": "llama-3.1-8b-instant",
        }
        with open(SETTINGS_FILE, "w") as f:
            json.dump(default_settings, f, indent=2)
        return default_settings
    
    try:
        with open(SETTINGS_FILE, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return {
            "llm_provider": "groq",
            "llm_model": "llama-3.1-8b-instant",
        }

def save_settings(settings: Dict[str, Any]):
    with open(SETTINGS_FILE, "w") as f:
        json.dump(settings, f, indent=2)

# History Management
def save_conversation(messages: List[Dict[str, str]]):
    history = []
    if HISTORY_FILE.exists():
        try:
            with open(HISTORY_FILE, "r") as f:
                history = json.load(f)
        except json.JSONDecodeError:
            history = []
    
    history.append(messages)
    
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f, indent=2)

# Configuration
NVIDIA_API_URL = "https://ai.api.nvidia.com/v1/retrieval/nvidia/llama-nemotron-rerank-1b-v2/reranking"

# Free LLM API endpoints
FREE_LLM_APIS = {
    "groq": {
        "url": "https://api.groq.com/openai/v1/chat/completions",
        "models": ["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
        "key_env": "GROQ_API_KEY"
    } 

    }


def get_api_key(env_name: str) -> str:
    return os.getenv(env_name, "")

def get_available_provider() -> tuple:
    """Find first available free LLM provider"""
    for name, config in FREE_LLM_APIS.items():
        key = get_api_key(config["key_env"])
        if key:
            return name, config, key
    return None, None, None

async def rerank_passages(query: str, passages: List[str]) -> List[Dict[str, Any]]:
    """Call NVIDIA reranking API"""
    api_key = get_api_key("NVIDIA_API_KEY")
    if not api_key:
        return [{"index": i, "text": p, "score": 1.0 / (i + 1)} for i, p in enumerate(passages)]
    
    payload = {
        "model": "nvidia/llama-nemotron-rerank-1b-v2",
        "query": {"text": query},
        "passages": [{"text": p} for p in passages]
    }
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(NVIDIA_API_URL, json=payload, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                return data.get("results", [])
            else:
                return [{"index": i, "text": p, "score": 1.0 / (i + 1)} for i, p in enumerate(passages)]

async def call_free_llm(messages: List[Dict[str, str]], websocket: WebSocket) -> str:
    """Call a free LLM API"""
    settings = get_settings()
    provider_name = settings.get("llm_provider")
    model = settings.get("llm_model")

    # Determine provider and API key
    config = None
    api_key = None
    if provider_name and provider_name in FREE_LLM_APIS:
        _config = FREE_LLM_APIS[provider_name]
        _api_key = get_api_key(_config["key_env"])
        if _api_key:
            config = _config
            api_key = _api_key

    if not api_key:
        provider_name, config, api_key = get_available_provider()

    if not api_key:
        return """No free API key found. Please set one of these environment variables:

• GROQ_API_KEY 

Then restart the backend."""
    
    if not model or model not in config.get("models", []):
        model = config["models"][0]
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": 1024,
        "temperature": 0.7,
        "stream": True
    }
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    # Add provider-specific headers
    if provider_name == "openrouter":
        headers["HTTP-Referer"] = "https://jarvis.chat"
        headers["X-Title"] = "Jarvis Chat"
    
    full_response = ""
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(config["url"], json=payload, headers=headers) as response:
                if response.status == 200:
                    async for line in response.content:
                        line = line.decode('utf-8').strip()
                        if line.startswith('data: '):
                            data = line[6:]
                            if data == '[DONE]':
                                break
                            try:
                                chunk_data = json.loads(data)
                                if 'choices' in chunk_data and len(chunk_data['choices']) > 0:
                                    delta = chunk_data['choices'][0].get('delta', {})
                                    content = delta.get('content', '')
                                    if content:
                                        full_response += content
                                        await manager.send_message(json.dumps({
                                            "type": "chunk",
                                            "content": content
                                        }), websocket)
                            except json.JSONDecodeError:
                                continue
                else:
                    error_text = await response.text()
                    return f"Error from {provider_name}: {response.status}. Response: {error_text[:200]}"
    except Exception as e:
        return f"Error calling LLM: {str(e)}"
    
    return full_response if full_response else "No response generated."

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

manager = ConnectionManager()

@app.get("/health")
async def health_check():
    provider_name, _, _ = get_available_provider()
    settings = get_settings()
    configured_provider = settings.get("llm_provider", "none")
    
    active_provider = configured_provider
    if configured_provider not in FREE_LLM_APIS or not get_api_key(FREE_LLM_APIS[configured_provider]["key_env"]):
        fallback_provider, _, _ = get_available_provider()
        active_provider = fallback_provider or "none"

    return {
        "status": "healthy",
        "configured_llm_provider": configured_provider,
        "active_llm_provider": active_provider,
        "available_providers": [name for name, config in FREE_LLM_APIS.items() if get_api_key(config["key_env"])]
    }

@app.get("/settings")
async def read_settings():
    return get_settings()

@app.post("/settings")
async def write_settings(settings: Dict[str, Any]):
    current_settings = get_settings()
    current_settings.update(settings)
    save_settings(current_settings)
    return current_settings

@app.get("/search/history")
async def search_history(query: str):
    if not HISTORY_FILE.exists():
        return {"results": []}

    with open(HISTORY_FILE, "r") as f:
        try:
            history = json.load(f)
        except json.JSONDecodeError:
            history = []

    passages = []
    for conversation in history:
        full_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation])
        if query.lower() in full_text.lower():
            passages.append(full_text)

    if not passages:
        return {"results": []}

    ranked_results = await rerank_passages(query, passages[:50])
    return {"results": ranked_results}

# File Upload Management
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# In-memory storage for uploaded files metadata
uploaded_files: Dict[str, Dict[str, Any]] = {}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a file to the system"""
    file_id = str(uuid.uuid4())
    file_ext = Path(file.filename).suffix
    
    # Save file to disk
    file_path = UPLOAD_DIR / f"{file_id}{file_ext}"
    content = await file.read()
    
    # Try to decode as text, fallback to storing binary
    try:
        text_content = content.decode("utf-8")
    except UnicodeDecodeError:
        # For binary files, store base64 or just mark as binary
        text_content = content.hex()
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Store metadata
    file_data = {
        "id": file_id,
        "filename": file.filename,
        "content": text_content,
        "uploaded_at": datetime.now().isoformat(),
        "file_path": str(file_path),
    }
    uploaded_files[file_id] = file_data
    
    return {
        "id": file_id,
        "filename": file.filename,
        "content": text_content,
        "uploaded_at": file_data["uploaded_at"],
    }

@app.get("/files")
async def list_files():
    """List all uploaded files"""
    return [
        {
            "id": fid,
            "filename": f["filename"],
            "uploaded_at": f["uploaded_at"],
        }
        for fid, f in uploaded_files.items()
    ]

@app.delete("/files/{file_id}")
async def delete_file(file_id: str):
    """Delete an uploaded file"""
    if file_id not in uploaded_files:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_data = uploaded_files[file_id]
    file_path = Path(file_data["file_path"])
    
    if file_path.exists():
        file_path.unlink()
    
    del uploaded_files[file_id]
    return {"status": "deleted"}

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            messages = message_data.get("messages", [])
            
            if messages:
                # Call the free LLM
                response_text = await call_free_llm(messages, websocket)
                
                # Save conversation to history if successful
                if response_text and not response_text.startswith("Error"):
                    full_conversation = messages + [{"role": "assistant", "content": response_text}]
                    save_conversation(full_conversation)
                
                await manager.send_message(json.dumps({
                    "type": "done"
                }), websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        await manager.send_message(json.dumps({
            "type": "error",
            "content": str(e)
        }), websocket)
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
