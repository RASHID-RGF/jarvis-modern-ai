import { motion } from "framer-motion"
import { Cpu, User } from "lucide-react"
import { type ChatMessage } from "@/stores/chatStore"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"

  const time = message.timestamp.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("flex gap-3 px-4 py-2", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center self-end mb-1"
        style={{
          background: isUser
            ? "oklch(0.22 0.07 240 / 80%)"
            : "oklch(0.78 0.18 200 / 15%)",
          border: `1px solid ${isUser ? "oklch(0.22 0.07 240)" : "oklch(0.78 0.18 200 / 40%)"}`,
        }}
      >
        {isUser ? (
          <User size={14} className="text-blue-300" />
        ) : (
          <Cpu size={14} style={{ color: "var(--jarvis-cyan)" }} />
        )}
      </div>

      {/* Bubble */}
      <div className={cn("flex flex-col gap-1 max-w-[75%]", isUser && "items-end")}>
        {/* Sender label */}
        <span
          className="text-[9px] tracking-[0.15em] uppercase px-1"
          style={{
            color: isUser ? "oklch(0.7 0.1 240)" : "var(--jarvis-cyan)",
          }}
        >
          {isUser ? "YOU" : "JARVIS"}
        </span>

        {/* Content */}
        <div
          className="px-4 py-3 rounded-md text-sm leading-relaxed relative"
          style={{
            background: isUser
              ? "oklch(0.22 0.07 240 / 60%)"
              : "oklch(0.1 0.02 255 / 80%)",
            border: `1px solid ${isUser ? "oklch(0.22 0.07 240 / 50%)" : "oklch(0.78 0.18 200 / 15%)"}`,
            color: "var(--foreground)",
          }}
        >
          <FormattedContent content={message.content} />
          {message.isStreaming && (
            <motion.span
              className="inline-block w-0.5 h-4 ml-0.5 align-middle rounded-full"
              style={{ background: "var(--jarvis-cyan)" }}
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[9px] text-muted-foreground px-1 font-mono">{time}</span>
      </div>
    </motion.div>
  )
}

function FormattedContent({ content }: { content: string }) {
  if (!content) return null

  // Split by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g)

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const lines = part.slice(3).split("\n")
          const lang = lines[0]
          const code = lines.slice(1, -1).join("\n")
          return (
            <pre
              key={i}
              className="mt-2 mb-2 p-3 rounded-sm overflow-x-auto text-xs font-mono"
              style={{
                background: "oklch(0.06 0.015 270)",
                border: "1px solid oklch(0.78 0.18 200 / 20%)",
                color: "oklch(0.85 0.12 200)",
              }}
            >
              {lang && (
                <div className="text-[9px] uppercase tracking-widest mb-2 opacity-60">{lang}</div>
              )}
              {code}
            </pre>
          )
        }
        // Inline bold/italic handling
        return <span key={i}>{part}</span>
      })}
    </>
  )
}
