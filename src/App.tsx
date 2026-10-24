import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthProvider'
import { RequireAuth } from '@/auth/RequireAuth'
import { AppShell } from '@/components/layout/AppShell'
import { LandingPage } from '@/pages/LandingPage'
import { LibraryPage } from '@/pages/LibraryPage'
import { MyDesignsPage } from '@/pages/MyDesignsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { ComponentDetailsPage } from '@/pages/design/ComponentDetailsPage'
import { DesignBriefPage } from '@/pages/design/DesignBriefPage'
import { EditorPage } from '@/pages/design/EditorPage'
import { OverallVisionPage } from '@/pages/design/OverallVisionPage'
import { ResultPage } from '@/pages/design/ResultPage'
import type { ReactNode } from 'react'

const priv = (el: ReactNode) => <RequireAuth>{el}</RequireAuth>

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/design" element={priv(<OverallVisionPage />)} />
            <Route path="/design/details" element={priv(<ComponentDetailsPage />)} />
            <Route path="/design/brief" element={priv(<DesignBriefPage />)} />
            <Route path="/design/result" element={priv(<ResultPage />)} />
            <Route path="/design/edit" element={priv(<EditorPage />)} />
            <Route path="/designs" element={priv(<MyDesignsPage />)} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
