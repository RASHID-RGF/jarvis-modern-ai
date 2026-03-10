import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useChatStore, type OrbState } from "@/stores/chatStore"

const STATE_LABELS: Record<OrbState, string> = {
  idle: "STANDBY",
  listening: "LISTENING...",
  thinking: "PROCESSING...",
  responding: "RESPONDING",
}

const STATE_COLORS: Record<OrbState, string> = {
  idle: "oklch(0.78 0.18 200)",
  listening: "oklch(0.85 0.2 160)",
  thinking: "oklch(0.7 0.2 280)",
  responding: "oklch(0.78 0.18 200)",
}

export function JarvisOrb() {
  const orbState = useChatStore((s) => s.orbState)
  const color = STATE_COLORS[orbState]

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-8 select-none">
      {/* Orb container */}
      <div className="relative flex items-center justify-center">
        {/* Outer rings */}
        <PulseRing delay={0} size={280} color={color} orbState={orbState} />
        <PulseRing delay={0.4} size={240} color={color} orbState={orbState} />
        <PulseRing delay={0.8} size={200} color={color} orbState={orbState} />

        {/* Rotating arc (thinking state) */}
        <AnimatePresence>
          {orbState === "thinking" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{ rotate: { duration: 1.5, repeat: Infinity, ease: "linear" } }}
              className="absolute"
              style={{ width: 176, height: 176 }}
            >
              <svg width="176" height="176" viewBox="0 0 176 176">
                <circle
                  cx="88"
                  cy="88"
                  r="84"
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="60 200"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main sphere */}
        <motion.div
          className="relative rounded-full orb-glow z-10"
          style={{
            width: 160,
            height: 160,
            background: `radial-gradient(circle at 35% 35%, oklch(0.25 0.05 220), oklch(0.06 0.015 270) 70%)`,
            border: `1px solid ${color}40`,
          }}
          animate={
            orbState === "listening"
              ? {
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    `0 0 40px ${color}40, 0 0 80px ${color}20`,
                    `0 0 60px ${color}60, 0 0 100px ${color}30`,
                    `0 0 40px ${color}40, 0 0 80px ${color}20`,
                  ],
                }
              : orbState === "responding"
              ? { scale: [1, 1.03, 0.98, 1] }
              : { scale: [1, 1.01, 1] }
          }
          transition={{
            duration: orbState === "listening" ? 1.2 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Inner core glow */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle at 40% 40%, ${color}30, transparent 65%)`,
            }}
          />

          {/* Center HUD icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="20" fill="none" stroke={color} strokeWidth="0.5" opacity="0.4" />
              <circle cx="40" cy="40" r="32" fill="none" stroke={color} strokeWidth="0.5" opacity="0.3" strokeDasharray="4 4" />
              <circle cx="40" cy="40" r="6" fill={color} opacity="0.8" />
              <line x1="40" y1="14" x2="40" y2="22" stroke={color} strokeWidth="1.5" opacity="0.7" />
              <line x1="40" y1="58" x2="40" y2="66" stroke={color} strokeWidth="1.5" opacity="0.7" />
              <line x1="14" y1="40" x2="22" y2="40" stroke={color} strokeWidth="1.5" opacity="0.7" />
              <line x1="58" y1="40" x2="66" y2="40" stroke={color} strokeWidth="1.5" opacity="0.7" />
            </svg>
          </div>

          {/* Specular highlight */}
          <div
            className="absolute rounded-full"
            style={{
              width: 50,
              height: 30,
              top: 24,
              left: 28,
              background: "radial-gradient(ellipse, rgba(255,255,255,0.12) 0%, transparent 100%)",
              transform: "rotate(-30deg)",
            }}
          />
        </motion.div>
      </div>

      {/* State label */}
      <div className="flex flex-col items-center gap-2">
        <motion.div
          key={orbState}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs tracking-[0.3em] uppercase font-mono"
          style={{ color }}
        >
          {STATE_LABELS[orbState]}
        </motion.div>

        {/* Waveform bars */}
        <AnimatePresence>
          {(orbState === "listening" || orbState === "responding") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-end gap-1"
              style={{ height: 24 }}
            >
              {[3, 5, 7, 5, 8, 4, 6, 5, 3, 7, 5, 4].map((h, i) => (
                <motion.div
                  key={i}
                  className="w-0.5 rounded-full"
                  style={{ background: color }}
                  animate={{ height: [h, h * 2.5, h] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.05,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info pills */}
        <div className="flex gap-3 mt-4">
          <InfoPill label="NEURAL" value="v4.0" />
          <InfoPill label="UPTIME" value={useUptime()} />
          <InfoPill label="CORE" value="100%" />
        </div>
      </div>
    </div>
  )
}

function PulseRing({
  delay,
  size,
  color,
  orbState,
}: {
  delay: number
  size: number
  color: string
  orbState: OrbState
}) {
  const isActive = orbState !== "idle"
  return (
    <motion.div
      className="absolute rounded-full border"
      style={{ width: size, height: size, borderColor: `${color}20` }}
      animate={
        isActive
          ? { scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }
          : { scale: [1, 1.03, 1], opacity: [0.15, 0.3, 0.15] }
      }
      transition={{ duration: isActive ? 1.5 : 4, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-sm"
      style={{
        background: "oklch(0.1 0.02 255 / 60%)",
        border: "1px solid oklch(0.78 0.18 200 / 15%)",
      }}
    >
      <span className="text-[8px] tracking-[0.15em] uppercase text-muted-foreground">{label}</span>
      <span className="text-[11px] font-mono" style={{ color: "var(--jarvis-cyan)" }}>
        {value}
      </span>
    </div>
  )
}

function useUptime() {
  const [start] = useState(() => Date.now())
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const s = Math.floor((now - start) / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  return h > 0 ? `${h}h ${m % 60}m` : m > 0 ? `${m}m ${s % 60}s` : `${s}s`
}
