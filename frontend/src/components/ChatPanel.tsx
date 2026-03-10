import { useEffect, useRef } from "react"
import { Bot } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion, AnimatePresence } from "framer-motion"
import { useChatStore } from "@/stores/chatStore"
import { MessageBubble } from "./MessageBubble"
import { ChatInput } from "./ChatInput"

export function ChatPanel() {
  const messages = useChatStore((s) => s.messages)
  const isLoading = useChatStore((s) => s.isLoading)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    // Respect settings: auto-scroll
    try {
      const raw = localStorage.getItem('app-settings')
      const parsed = raw ? JSON.parse(raw) : null
      const autoScroll = parsed?.state?.autoScroll ?? true
      if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    } catch {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  return (
    <div
      className="flex flex-col h-full glass-panel overflow-hidden"
      style={{ borderLeft: "1px solid oklch(0.78 0.18 200 / 12%)" }}
    >
      {/* Chat header */}
      <div
        className="flex items-center gap-2 px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid oklch(0.78 0.18 200 / 12%)" }}
      >
        <div className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
          CONVERSATION LOG
        </div>
        <div className="flex-1" />
        <div className="text-[9px] font-mono text-muted-foreground">
          {messages.length} messages
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 scrollbar-jarvis">
        <div className="py-4">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </AnimatePresence>
          )}

          {/* Typing indicator */}
          <AnimatePresence>
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <TypingIndicator />
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput />
    </div>
  )
}

function EmptyState() {
  const suggestions = [
    "What can you help me with today?",
    "Explain quantum computing in simple terms",
    "Write a Python script to sort a list",
    "What's the latest in AI research?",
  ]

  const addMessage = useChatStore((s) => s.addMessage)
  const setInput = (_: string) => {
    // We can't directly set the input from here, show as suggestions
  }
  void addMessage
  void setInput

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full min-h-[400px] gap-6 px-6"
    >
      {/* Icon */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{
          background: "oklch(0.78 0.18 200 / 10%)",
          border: "1px solid oklch(0.78 0.18 200 / 30%)",
        }}
      >
        <Bot size={28} style={{ color: "var(--jarvis-cyan)" }} />
      </div>

      <div className="text-center">
        <div
          className="text-lg font-semibold mb-1"
          style={{ color: "var(--jarvis-cyan)" }}
        >
          Good day. I'm JARVIS.
        </div>
        <div className="text-sm text-muted-foreground max-w-xs">
          Your advanced AI assistant, ready to help with any task or query.
        </div>
      </div>

      {/* Suggestions */}
      <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
        {suggestions.map((s) => (
          <SuggestionChip key={s} text={s} />
        ))}
      </div>
    </motion.div>
  )
}

function SuggestionChip({ text }: { text: string }) {
  return (
    <button
      className="text-left text-xs px-3 py-2 rounded-sm transition-all cursor-pointer"
      style={{
        background: "oklch(0.1 0.02 255 / 60%)",
        border: "1px solid oklch(0.78 0.18 200 / 15%)",
        color: "var(--muted-foreground)",
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.borderColor =
          "oklch(0.78 0.18 200 / 40%)"
        ;(e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.borderColor =
          "oklch(0.78 0.18 200 / 15%)"
        ;(e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)"
      }}
    >
      {text}
    </button>
  )
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-center gap-3 px-4 py-2"
    >
      <div
        className="w-8 h-8 rounded-sm flex items-center justify-center"
        style={{
          background: "oklch(0.78 0.18 200 / 15%)",
          border: "1px solid oklch(0.78 0.18 200 / 40%)",
        }}
      >
        <Bot size={14} style={{ color: "var(--jarvis-cyan)" }} />
      </div>
      <div
        className="px-4 py-3 rounded-md flex items-center gap-1.5"
        style={{
          background: "oklch(0.1 0.02 255 / 80%)",
          border: "1px solid oklch(0.78 0.18 200 / 15%)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--jarvis-cyan)" }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  )
}
