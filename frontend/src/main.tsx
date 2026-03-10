import { StrictMode, useEffect } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { applyTheme } from "./stores/settingsStore"
import { useSettingsStore } from "./stores/settingsStore"

function ThemeInitializer() {
  const theme = useSettingsStore((s) => s.theme)
  useEffect(() => {
    applyTheme(theme)
  }, [theme])
  return null
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeInitializer />
    <App />
  </StrictMode>
)
