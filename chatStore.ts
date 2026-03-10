import { create } from 'zustand';
import { jarvisApi, Message } from '../lib/api';

interface ChatState {
    messages: Message[];
    isStreaming: boolean;
    isConnected: boolean;
    input: string;
    error: string | null;

    // Actions
    setInput: (input: string) => void;
    sendMessage: () => void;
    initialize: () => void;
    disconnect: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    messages: [],
    isStreaming: false,
    isConnected: false,
    input: '',
    error: null,

    setInput: (input) => set({ input }),

    initialize: () => {
        jarvisApi.connect(
            // onChunk
            (chunk) => {
                set((state) => {
                    const messages = [...state.messages];
                    const lastMessage = messages[messages.length - 1];

                    if (lastMessage && lastMessage.role === 'assistant') {
                        // Append to existing assistant message
                        messages[messages.length - 1] = {
                            ...lastMessage,
                            content: lastMessage.content + chunk,
                        };
                        return { messages };
                    } else {
                        // Create new assistant message if one doesn't exist (shouldn't happen with current logic but safe to have)
                        return { messages: [...messages, { role: 'assistant', content: chunk }] };
                    }
                });
            },
            // onDone
            () => {
                set({ isStreaming: false });
            },
            // onError
            (error) => {
                set({ error, isStreaming: false });
            },
            // onOpen
            () => {
                set({ isConnected: true, error: null });
            }
        );
    },

    disconnect: () => {
        jarvisApi.disconnect();
        set({ isConnected: false });
    },

    sendMessage: () => {
        const { input, messages, isConnected } = get();
        if (!input.trim() || !isConnected) return;

        const userMsg: Message = { role: 'user', content: input };

        // Optimistically add user message and an empty assistant message placeholder
        const newMessages = [
            ...messages,
            userMsg,
            { role: 'assistant', content: '' } as Message
        ];

        set({
            messages: newMessages,
            input: '',
            isStreaming: true,
            error: null,
        });

        // Send the conversation history (excluding the empty assistant placeholder we just added)
        jarvisApi.sendMessage([...messages, userMsg]);
    },
}));