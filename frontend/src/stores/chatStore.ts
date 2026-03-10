import { create } from "zustand"
import { speechService } from "@/lib/speech"

export type MessageRole = "user" | "assistant"

export type OrbState = "idle" | "listening" | "thinking" | "responding"

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  isStreaming?: boolean
}

interface ChatStore {
  messages: ChatMessage[]
  orbState: OrbState
  isLoading: boolean
  voiceEnabled: boolean
  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => string
  appendToMessage: (id: string, chunk: string) => void
  finishMessage: (id: string) => void
  clearMessages: () => void
  setOrbState: (state: OrbState) => void
  setIsLoading: (loading: boolean) => void
  setVoiceEnabled: (enabled: boolean) => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  orbState: "idle",
  isLoading: false,
  voiceEnabled: true,

  addMessage: (msg) => {
    const id = crypto.randomUUID()
    set((state) => ({
      messages: [
        ...state.messages,
        { ...msg, id, timestamp: new Date() },
      ],
    }))

    // Speak the message if it's from assistant and voice is enabled
    if (msg.role === "assistant" && get().voiceEnabled) {
      speechService.speak(msg.content)
    }

    return id
  },

  appendToMessage: (id, chunk) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + chunk } : m
      ),
    }))
  },

  finishMessage: (id) => {
    const message = get().messages.find(m => m.id === id)
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, isStreaming: false } : m
      ),
    }))

    // Speak when streaming finishes (for assistant messages)
    if (message?.role === "assistant" && get().voiceEnabled) {
      speechService.speak(message.content)
    }
  },

  clearMessages: () => {
    speechService.stop()
    set({ messages: [] })
  },
  setOrbState: (orbState) => set({ orbState }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setVoiceEnabled: (voiceEnabled) => {
    speechService.setEnabled(voiceEnabled)
    set({ voiceEnabled })
  },
}))
