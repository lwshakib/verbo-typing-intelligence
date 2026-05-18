import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./views/App.tsx"

console.log(
  "[Verbo CRX Content] Initializing fixed-viewport typing overlay container..."
)

const container = document.createElement("div")
container.id = "verbo-typing-intelligence-root"
container.style.position = "fixed"
container.style.top = "0"
container.style.left = "0"
container.style.width = "100vw"
container.style.height = "100vh"
container.style.pointerEvents = "none"
container.style.zIndex = "2147483647" // Max possible CSS z-index
document.body.appendChild(container)

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
)
