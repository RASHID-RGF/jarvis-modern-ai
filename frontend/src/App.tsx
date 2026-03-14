import { useEffect } from "react"
import { Header } from "@/components/Header"
import { JarvisOrb } from "@/components/JarvisOrb"
import { ChatPanel } from "@/components/ChatPanel"
import { Login } from "@/components/Login"
import { applyTheme, useSettingsStore } from "@/stores/settingsStore"
import { useAuthStore } from "@/stores/authStore"

function App() {
  const theme = useSettingsStore((s) => s.theme)
  const initializeAuth = useAuthStore((s) => s.initializeAuth)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)

  useEffect(() => {
    const unsubscribe = initializeAuth()
    return () => unsubscribe()
  }, [initializeAuth])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center w-screen h-screen overflow-hidden"
        style={{ background: "var(--background)" }}
      >
        <div className="starfield">
          <div className="stars" />
        </div>
        <div className="scanlines" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-[oklch(0.6_0.18_200)] border-t-transparent rounded-full animate-spin mb-4" />
          <p style={{ color: "oklch(0.7_0.02_200)" }}>Loading...</p>
        </div>
      </div>
    )
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login />
  }

  // Show main content only if authenticated
  return (
    <div
      className="flex flex-col w-screen h-screen overflow-hidden"
      style={{ background: "var(--background)" }}
    >
      {/* Starfield background */}
      <div className="starfield">
        <div className="stars" />
      </div>

      {/* Scanline overlay */}
      <div className="scanlines" />

      {/* Header */}
      <Header />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden relative z-10">
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
