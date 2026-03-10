import { useEffect } from "react"
import { Header } from "@/components/Header"
import { JarvisOrb } from "@/components/JarvisOrb"
import { ChatPanel } from "@/components/ChatPanel"
import { applyTheme, useSettingsStore } from "@/stores/settingsStore"

function App() {
  const theme = useSettingsStore((s) => s.theme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return (
    <div
      className="flex flex-col w-screen h-screen overflow-hidden"
      style={{ background: "var(--background)" }}
    >
      {/* Header */}
      <Header />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Jarvis Orb */}
        <div
          className="flex items-center justify-center w-[40%] shrink-0 relative"
          style={{
            background:
              "radial-gradient(ellipse at center, oklch(0.1 0.03 200 / 40%) 0%, transparent 70%)",
          }}
        >
          {/* Grid background */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `
                linear-gradient(oklch(0.78 0.18 200) 1px, transparent 1px),
                linear-gradient(90deg, oklch(0.78 0.18 200) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />
          <JarvisOrb />
        </div>

        {/* Right: Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatPanel />
        </div>
      </div>
    </div>
  )
}

export default App
