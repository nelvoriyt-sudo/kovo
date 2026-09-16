import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    setSubmitting(false)
    if (resetError) {
      setError(resetError.message)
      return
    }
    setSent(true)
  }

  return (
    <AuthLayout>
      {sent ? (
        <>
          <h1 className="font-display text-2xl font-semibold text-ink">Check your email</h1>
          <p className="mt-2 text-[15px] text-muted">
            If an account exists for <span className="font-semibold text-ink">{email}</span>,
            we've sent a link to reset your password.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl font-semibold text-ink">Reset your password</h1>
          <p className="mt-2 text-[15px] text-muted">
            Enter your email and we'll send you a reset link.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3.5" noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[13px] font-semibold text-[#4a453e]">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && (
              <p role="alert" className="text-[13px] text-red-700">
                {error}
              </p>
            )}

            <Button type="submit" className="mt-2" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        <Link to="/login" className="font-semibold text-tan-dark hover:text-tan-darker">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
