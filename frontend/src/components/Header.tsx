import { useEffect, useState, useRef } from "react"
import { Cpu, Wifi, WifiOff, Trash2, Volume2, VolumeX, Settings, LogIn, LogOut, Info, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useChatStore } from "@/stores/chatStore"
import { checkHealth } from "@/lib/api"
import { speechService } from "@/lib/speech"
import { cn } from "@/lib/utils"
import { useSettingsStore, applyTheme } from "@/stores/settingsStore"
import { useAuthStore } from "@/stores/authStore"
import { signInWithGoogle, logOut } from "@/lib/firebase"
import { AboutModal } from "@/components/AboutModal"
import { BlogModal } from "@/components/BlogModal"

export function Header() {
  const clearMessages = useChatStore((s) => s.clearMessages)
  const messages = useChatStore((s) => s.messages)
  const setVoiceEnabled = useChatStore((s) => s.setVoiceEnabled)
  const settings = useSettingsStore()
  const { user, isAuthenticated } = useAuthStore()
  const [time, setTime] = useState(new Date())
  const [online, setOnline] = useState<boolean | null>(null)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [openSettings, setOpenSettings] = useState(false)
  const [openAbout, setOpenAbout] = useState(false)
  const [openBlog, setOpenBlog] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])

  // Close settings dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setOpenSettings(false)
      }
    }
    if (openSettings) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [openSettings])

  useEffect(() => {
    const tick = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    checkHealth()
      .then(() => setOnline(true))
      .catch(() => setOnline(false))

    // Check speech support
    setSpeechSupported(speechService.isSupported())
  }, [])

  useEffect(() => {
    setVoiceEnabled(settings.voiceEnabled)
  }, [settings.voiceEnabled, setVoiceEnabled])

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechService.getVoices()
      setAvailableVoices(voices)
    }

    loadVoices()

    // Voices may load asynchronously
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  // Sync selected voice with speech service
  useEffect(() => {
    speechService.setSelectedVoice(settings.selectedVoice)
  }, [settings.selectedVoice])

  const formattedTime = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  const formattedDate = time.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <header
      className="flex items-center justify-between px-6 py-3 glass-panel shrink-0 z-50"
      style={{ borderBottom: "1px solid oklch(0.78 0.18 200 / 20%)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-sm"
          style={{
            background: "oklch(0.78 0.18 200 / 15%)",
            border: "1px solid oklch(0.78 0.18 200 / 40%)",
          }}
        >
          <Cpu
            size={16}
            style={{ color: "var(--jarvis-cyan)" }}
          />
        </div>
        <div>
          <div className="text-sm font-bold tracking-[0.2em] uppercase text-cyan-glow">
            JARVIS MODERN AI
          </div>
          <div className="text-[10px] tracking-widest uppercase text-muted-foreground leading-none">
            Made by Raoq1p9w
          </div>
        </div>
      </div>

      {/* Center metrics */}
      <div className="hidden md:flex items-center gap-6">
        <StatusPill label="AI ENGINE" value={settings.model === "default" ? "GPT-4o Mini" : settings.model} />
        <Separator orientation="vertical" className="h-5 opacity-30" />
        <StatusPill label="MESSAGES" value={String(messages.length)} />
        <Separator orientation="vertical" className="h-5 opacity-30" />
        <StatusPill label="DATE" value={formattedDate} />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Online status */}
        <div className="flex items-center gap-2">
          {online === null ? (
            <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
          ) : online ? (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <Wifi size={14} className="text-emerald-400" />
              <span className="text-[11px] text-emerald-400 tracking-wider uppercase">Online</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <WifiOff size={14} className="text-red-400" />
              <span className="text-[11px] text-red-400 tracking-wider uppercase">Offline</span>
            </>
          )}
        </div>

        <Separator orientation="vertical" className="h-5 opacity-30" />

        {/* About */}
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-muted-foreground hover:text-foreground"
          onClick={() => setOpenAbout(true)}
          title="About"
        >
          <Info size={14} />
        </Button>

        {/* Blog */}
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 text-muted-foreground hover:text-foreground"
          onClick={() => setOpenBlog(true)}
          title="Blog"
        >
          <FileText size={14} />
        </Button>

        <Separator orientation="vertical" className="h-5 opacity-30" />

        {/* Clock */}
        <div
          className="font-mono text-sm tracking-widest"
          style={{ color: "var(--jarvis-cyan)" }}
        >
          {formattedTime}
        </div>

        <Separator orientation="vertical" className="h-5 opacity-30" />

        {/* Voice toggle */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "w-8 h-8",
            !speechSupported && "opacity-30 pointer-events-none",
            settings.voiceEnabled
              ? "text-emerald-400 hover:text-emerald-300"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => {
            const next = !settings.voiceEnabled
            settings.setVoiceEnabled(next)
            setVoiceEnabled(next)
          }}
          title={settings.voiceEnabled ? "Disable voice output" : "Enable voice output"}
        >
          {settings.voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </Button>

        {/* Settings */}
        <div className="relative" ref={settingsRef}>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-muted-foreground hover:text-foreground"
            onClick={() => setOpenSettings((v) => !v)}
            title="Settings"
          >
            <Settings size={14} />
          </Button>

          {openSettings && (
            <div
              className="absolute right-0 mt-2 w-60 max-h-[70vh] overflow-y-auto p-3 rounded-md shadow-lg z-[100] glass-panel"
              style={{ border: "1px solid oklch(0.78 0.18 200 / 25%)", background: "oklch(0.08 0.02 255 / 85%)" }}
            >
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Settings</div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-muted-foreground">Voice output</span>
                <input
                  type="checkbox"
                  checked={settings.voiceEnabled}
                  onChange={(e) => {
                    settings.setVoiceEnabled(e.target.checked)
                    setVoiceEnabled(e.target.checked)
                  }}
                />
              </div>

              {settings.voiceEnabled && (
                <div className="py-1.5">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Voice</div>
                  <select
                    className="w-full bg-transparent text-xs border rounded-sm px-2 py-1"
                    value={settings.selectedVoice || ''}
                    onChange={(e) => settings.setSelectedVoice(e.target.value || null)}
                  >
                    <option value="">Default (Auto)</option>
                    {availableVoices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-1 text-[10px] h-6"
                    onClick={() => {
                      speechService.speak("This is a test of the selected voice.")
                    }}
                  >
                    Test Voice
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-muted-foreground">Auto-scroll</span>
                <input
                  type="checkbox"
                  checked={settings.autoScroll}
                  onChange={(e) => settings.setAutoScroll(e.target.checked)}
                />
              </div>

              <div className="py-1.5">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Model</div>
                <select
                  className="w-full bg-transparent text-xs border rounded-sm px-2 py-1"
                  value={settings.model}
                  onChange={(e) => settings.setModel(e.target.value)}
                >
                  <option value="default">GPT-4o Mini</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>

              <div className="py-1.5">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Theme</div>
                <select
                  className="w-full bg-transparent text-xs border rounded-sm px-2 py-1"
                  value={settings.theme}
                  onChange={(e) => {
                    const t = e.target.value as any
                    settings.setTheme(t)
                    applyTheme(t)
                  }}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Clear chat */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "w-8 h-8 text-muted-foreground hover:text-destructive",
            messages.length === 0 && "opacity-30 pointer-events-none"
          )}
          onClick={clearMessages}
          title="Clear conversation"
        >
          <Trash2 size={14} />
        </Button>

        <Separator orientation="vertical" className="h-5 opacity-30" />

        {/* Auth */}
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="w-7 h-7 rounded-full border border-cyan-500/30"
                title={user.displayName || "Signed in"}
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 text-muted-foreground hover:text-destructive"
              onClick={() => logOut()}
              title="Sign out"
            >
              <LogOut size={14} />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1.5"
            onClick={() => signInWithGoogle()}
            title="Sign in with Google"
          >
            <LogIn size={14} />
            <span className="hidden sm:inline">Sign In</span>
          </Button>
        )}
      </div>

      <AboutModal isOpen={openAbout} onClose={() => setOpenAbout(false)} />
      <BlogModal isOpen={openBlog} onClose={() => setOpenBlog(false)} />
    </header>
  )
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="tech-label" style={{ fontSize: '9px' }}>
        {label}
      </span>
      <span
        className="text-[11px] font-mono font-medium"
        style={{ color: "var(--jarvis-cyan)" }}
      >
        {value}
      </span>
    </div>
  )
}
