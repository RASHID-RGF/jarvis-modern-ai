const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"
const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/chat"

export interface ApiMessage {
  role: string
  content: string
}

export async function checkHealth(): Promise<{ status: string; openai_configured: boolean }> {
  const res = await fetch(`${BASE_URL}/health`)
  return res.json() as Promise<{ status: string; openai_configured: boolean }>
}

// File upload API
export interface UploadedFile {
  id: string
  filename: string
  content: string
  uploaded_at: string
}

export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<UploadedFile>
}

export async function listFiles(): Promise<UploadedFile[]> {
  const res = await fetch(`${BASE_URL}/files`)
  return res.json() as Promise<UploadedFile[]>
}

export async function deleteFile(fileId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/files/${fileId}`, {
    method: "DELETE",
  })
  if (!res.ok) {
    throw new Error(`Delete failed: ${res.status} ${res.statusText}`)
  }
}

type StreamCallback = {
  onChunk: (chunk: string) => void
  onDone: () => void
  onError: (err: string) => void
}

export function streamChat(messages: ApiMessage[], callbacks: StreamCallback): () => void {
  const ws = new WebSocket(WS_URL)

  ws.onopen = () => {
    ws.send(JSON.stringify({ messages }))
  }

  ws.onmessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data as string) as { type: string; content?: string }
      if (data.type === "chunk" && data.content) {
        callbacks.onChunk(data.content)
      } else if (data.type === "done") {
        callbacks.onDone()
        ws.close()
      } else if (data.type === "error") {
        callbacks.onError(data.content ?? "Unknown error")
        ws.close()
      }
    } catch {
      /* ignore parse errors */
    }
  }

  ws.onerror = () => {
    callbacks.onError("Connection error — is the backend running?")
  }

  ws.onclose = () => {
    /* cleanup */
  }

  // Return cancel function
  return () => {
    if (ws.readyState === WebSocket.OPEN) ws.close()
  }
}
