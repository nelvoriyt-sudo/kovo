import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { BudgetsPage } from '@/pages/BudgetsPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { LoginPage } from '@/pages/LoginPage'
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SignupPage } from '@/pages/SignupPage'
import { SpendingByCategoryPage } from '@/pages/SpendingByCategoryPage'
import { TermsPage } from '@/pages/TermsPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { TrendsPage } from '@/pages/TrendsPage'

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <DashboardPage />
          </Protected>
        }
      />
      <Route
        path="/spending"
        element={
          <Protected>
            <SpendingByCategoryPage />
          </Protected>
        }
      />
      <Route
        path="/trends"
        element={
          <Protected>
            <TrendsPage />
          </Protected>
        }
      />
      <Route
        path="/budgets"
        element={
          <Protected>
            <BudgetsPage />
          </Protected>
        }
      />
      <Route
        path="/calendar"
        element={
          <Protected>
            <CalendarPage />
          </Protected>
        }
      />
      <Route
        path="/transactions"
        element={
          <Protected>
            <TransactionsPage />
          </Protected>
        }
      />
      <Route
        path="/settings"
        element={
          <Protected>
            <SettingsPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
