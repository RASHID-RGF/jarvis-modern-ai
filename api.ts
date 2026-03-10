export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export type StreamCallback = (chunk: string) => void;
export type DoneCallback = () => void;
export type ErrorCallback = (error: string) => void;

export class JarvisAPI {
    private ws: WebSocket | null = null;
    private url: string = 'ws://localhost:8000/ws/chat';
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    connect(
        onChunk: StreamCallback,
        onDone: DoneCallback,
        onError: ErrorCallback,
        onOpen?: () => void
    ) {
        if (this.ws) {
            this.ws.close();
        }

        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            this.reconnectAttempts = 0;
            if (onOpen) onOpen();
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'chunk') {
                    onChunk(data.content);
                } else if (data.type === 'done') {
                    onDone();
                } else if (data.type === 'error') {
                    onError(data.content);
                }
            } catch (e) {
                console.error('Failed to parse WebSocket message:', e);
            }
        };

        this.ws.onerror = (e) => {
            console.error('WebSocket error:', e);
            onError('Connection error');
        };
    }

    sendMessage(messages: Message[]) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ messages }));
        } else {
            console.error('WebSocket is not connected');
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

export const jarvisApi = new JarvisAPI();