import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { SiteLayout } from './components/SiteLayout'
import { RequireAuth } from './components/RequireAuth'
import { AdminPage } from './pages/AdminPage'
import { AuthConfirmPage } from './pages/AuthConfirmPage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { ServicesPage } from './pages/ServicesPage'
import { TermsPage } from './pages/TermsPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<SiteLayout><Outlet /></SiteLayout>}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about/" element={<AboutPage />} />
            <Route path="/services/" element={<ServicesPage />} />
            <Route path="/terms-and-condtitions/" element={<TermsPage />} />
            <Route path="/contact/" element={<ContactPage />} />
          </Route>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/confirm" element={<AuthConfirmPage />} />
          <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth adminOnly><AdminPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
