import { useState, useRef, useCallback, useEffect } from "react"
import { Send, Mic, MicOff, Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useChatStore } from "@/stores/chatStore"
import { streamChat, uploadFile } from "@/lib/api"
import { speechService } from "@/lib/speech"
import { useSearchHistoryStore } from "@/stores/searchHistoryStore"

// Web Speech API type declarations
// Using 'any' to avoid circular references with TypeScript lib definitions
type SpeechRecognitionType = {
  new(): {
    continuous: boolean
    interimResults: boolean
    lang: string
    onstart: (() => void) | null
    onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void) | null
    onend: (() => void) | null
    onerror: (() => void) | null
    start: () => void
    stop: () => void
    abort: () => void
  }
}

export function ChatInput() {
  const [input, setInput] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cancelRef = useRef<(() => void) | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { history, addQuery, clear } = useSearchHistoryStore()

  const { messages, isLoading, addMessage, appendToMessage, finishMessage, setOrbState, setIsLoading, voiceEnabled } =
    useChatStore()

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      // Record in search history
      addQuery(trimmed)

      setInput("")

      // Add user message
      addMessage({ role: "user", content: trimmed })
      setIsLoading(true)
      setOrbState("thinking")

      // Prepare history for API
      const history = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: trimmed },
      ]

      // Add streaming placeholder
      const assistantId = addMessage({ role: "assistant", content: "", isStreaming: true })

      setOrbState("responding")

      cancelRef.current = streamChat(history, {
        onChunk: (chunk) => appendToMessage(assistantId, chunk),
        onDone: () => {
          finishMessage(assistantId)
          setIsLoading(false)
          setOrbState("idle")

          // Speak the response if voice is enabled
          const allMessages = useChatStore.getState().messages
          const assistantMsg = allMessages.find(m => m.id === assistantId)
          if (voiceEnabled && assistantMsg?.content) {
            speechService.speak(assistantMsg.content)
          }

          cancelRef.current = null
        },
        onError: (err) => {
          appendToMessage(assistantId, `\n\n⚠️ ${err}`)
          finishMessage(assistantId)
          setIsLoading(false)
          setOrbState("idle")
          cancelRef.current = null
        },
      })
    },
    [messages, isLoading, addMessage, appendToMessage, finishMessage, setIsLoading, setOrbState, voiceEnabled]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void sendMessage(input)
    }
  }

  const toggleVoice = useCallback(() => {
    // Use type assertion to access SpeechRecognition
    const SpeechRec = (window as unknown as { SpeechRecognition?: SpeechRecognitionType; webkitSpeechRecognition?: SpeechRecognitionType }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionType }).webkitSpeechRecognition

    if (!SpeechRec) {
      alert("Speech recognition not supported in this browser.")
      return
    }

    if (isListening) {
      setIsListening(false)
      setOrbState("idle")
      return
    }

    const recognition = new SpeechRec()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"

    recognition.onstart = () => {
      setIsListening(true)
      setOrbState("listening")
    }

    recognition.onresult = (event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript
      setInput((prev) => (prev ? prev + " " + transcript : transcript))
      setIsListening(false)
      setOrbState("idle")
    }

    recognition.onend = () => {
      setIsListening(false)
      setOrbState("idle")
    }

    recognition.onerror = () => {
      setIsListening(false)
      setOrbState("idle")
    }

    recognition.start()
  }, [isListening, setOrbState])

  // Handle file upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        // Add to local state for immediate feedback
        setUploadedFiles((prev) => [...prev, file])

        // Upload to backend
        await uploadFile(file)
      }
    } catch (error) {
      console.error("Upload failed:", error)
      alert("Failed to upload file. Please try again.")
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }, [])

  // File upload handling - commented out for now
  // const _removeFile = useCallback((index: number) => {
  // setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  // }, [])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = "auto"
      ta.style.height = Math.min(ta.scrollHeight, 140) + "px"
    }
  }, [input])

  return (
    <div
      className="px-4 py-3 glass-panel"
      style={{ borderTop: "1px solid oklch(0.78 0.18 200 / 15%)" }}
    >
      <div
        className="flex items-end gap-3 p-2 rounded-md relative"
        style={{
          background: "oklch(0.08 0.02 255 / 60%)",
          border: "1px solid oklch(0.78 0.18 200 / 20%)",
        }}
      >
        {/* Voice button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "w-9 h-9 shrink-0 mb-0.5 transition-all",
            isListening
              ? "text-red-400 hover:text-red-300"
              : "text-muted-foreground hover:text-primary"
          )}
          style={isListening ? { background: "oklch(0.65 0.22 27 / 15%)" } : undefined}
          onClick={toggleVoice}
          title={isListening ? "Stop listening" : "Voice input"}
        >
          {isListening ? (
            <MicOff size={16} />
          ) : (
            <Mic size={16} />
          )}
        </Button>

        {/* File upload button */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.pdf,.doc,.docx,.json,.csv,.xml"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "w-9 h-9 shrink-0 mb-0.5 transition-all relative",
            uploadedFiles.length > 0
              ? "text-emerald-400 hover:text-emerald-300"
              : "text-muted-foreground hover:text-primary"
          )}
          onClick={() => fileInputRef.current?.click()}
          title={uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s) attached` : "Upload files"}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
        </Button>

        {/* Text area */}
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setShowHistory(true)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowHistory(true)}
          onBlur={() => setTimeout(() => setShowHistory(false), 150)}
          placeholder={
            isListening
              ? "Listening... speak now"
              : isLoading
                ? "JARVIS is responding..."
                : "Ask JARVIS anything... (Enter to send, Shift+Enter for new line)"
          }
          disabled={isLoading}
          rows={1}
          className={cn(
            "resize-none border-0 bg-transparent p-1.5 text-sm leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 min-h-0",
            "scrollbar-jarvis"
          )}
          style={{ maxHeight: 140 }}
        />

        {/* Search history dropdown */}
        {showHistory && !isLoading && (
          <div
            className="absolute left-14 right-14 bottom-16 z-40 rounded-md shadow-md glass-panel"
            style={{ border: "1px solid oklch(0.78 0.18 200 / 25%)", background: "oklch(0.08 0.02 255 / 92%)" }}
          >
            <div className="max-h-56 overflow-auto">
              {(() => {
                const list = (input.trim()
                  ? history.filter((h) => h.toLowerCase().includes(input.toLowerCase()))
                  : history).slice(0, 8)
                if (list.length === 0) {
                  return (
                    <div className="px-3 py-2 text-xs text-muted-foreground">No recent queries</div>
                  )
                }
                return list.map((item) => (
                  <button
                    key={item}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-white/5"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setInput(item)
                      setShowHistory(false)
                    }}
                  >
                    {item}
                  </button>
                ))
              })()}
            </div>
            <div className="flex items-center justify-between px-3 py-2 border-t border-white/10">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">History</span>
              <button
                className="text-[10px] text-muted-foreground hover:text-foreground"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => clear()}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Send button */}
        <Button
          size="icon"
          className={cn(
            "w-9 h-9 shrink-0 mb-0.5 transition-all",
            (!input.trim() || isLoading) && "opacity-40"
          )}
          style={{
            background: "oklch(0.78 0.18 200 / 20%)",
            border: "1px solid oklch(0.78 0.18 200 / 40%)",
            color: "var(--jarvis-cyan)",
          }}
          onClick={() => void sendMessage(input)}
          disabled={!input.trim() || isLoading}
          title="Send message"
        >
          {isLoading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
        </Button>
      </div>

      <div className="flex items-center justify-between mt-1.5 px-1">
        <span className="text-[10px] text-muted-foreground/50 tracking-wide">
          ENTER to send · SHIFT+ENTER for newline
        </span>
        <span className="text-[10px] text-muted-foreground/50 font-mono tracking-wider">
          {input.length > 0 ? `${input.length} chars` : ""}
        </span>
      </div>
    </div>
  )
}
