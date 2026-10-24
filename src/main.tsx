import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { restoreDraft } from './state/designStore'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

// Restore any design in progress before first render, so nothing is lost on refresh.
void restoreDraft().finally(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
