import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/components/AuthLayout'
import { GoogleIcon } from '@/components/GoogleIcon'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export function SignupPage() {
  const { session, loading: sessionLoading } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const errorRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  if (!sessionLoading && session) {
    return <Navigate to="/" replace />
  }

  async function handleGoogleSignUp() {
    if (!agreed) {
      setError('Please agree to the Privacy Policy and Terms of Use first.')
      return
    }
    setError(null)
    setGoogleLoading(true)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (oauthError) {
      setError(oauthError.message)
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!agreed) {
      setError('Please agree to the Privacy Policy and Terms of Use first.')
      return
    }
    setError(null)
    setSubmitting(true)
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    setSubmitting(false)
    if (signUpError) {
      setError(signUpError.message)
      return
    }
    setConfirmationSent(true)
  }

  if (confirmationSent) {
    return (
      <AuthLayout>
        <h1 className="font-display text-[27px] font-semibold tracking-[-0.025em] text-ink">Almost there</h1>
        <p className="mt-2 text-[15px] text-muted">
          If <span className="font-semibold text-ink">{email}</span> is new, we've sent a
          confirmation link — follow it to finish creating your account.
        </p>
        <p className="mt-3 text-[15px] text-muted">
          Already have an account with this email? Nothing was sent, and no email address needs
          to log in twice. Try{' '}
          <Link to="/login" className="font-semibold text-accent hover:text-accent">
            signing in
          </Link>{' '}
          instead, or use "Continue with Google" if that's how you originally signed up.
        </p>
        <Link to="/login" className="mt-8 inline-block text-sm font-semibold text-accent hover:text-accent">
          Back to sign in
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-[27px] font-semibold tracking-[-0.025em] text-ink">Create your account</h1>
      <p className="mt-2 text-[15px] text-muted">A few seconds, then you're in.</p>

      <Button
        type="button"
        variant="secondary"
        className="mt-8"
        onClick={handleGoogleSignUp}
        disabled={googleLoading}
      >
        <GoogleIcon className="h-[18px] w-[18px]" />
        {googleLoading ? 'Redirecting…' : 'Continue with Google'}
      </Button>

      <div className="my-7 flex items-center gap-3.5">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs tracking-wide text-muted">OR</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="displayName" className="text-[13px] font-semibold text-ink">
            Name
          </label>
          <Input
            id="displayName"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Jaiden"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-[13px] font-semibold text-ink">
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
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-[13px] font-semibold text-ink">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            spellCheck={false}
            placeholder="At least 8 characters"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <label className="mt-1 flex items-start gap-2.5 text-[13px] leading-relaxed text-muted">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-line text-ink focus-visible:ring-2 focus-visible:ring-accent"
            required
          />
          <span>
            I agree to kovo's{' '}
            <Link to="/privacy" className="font-medium text-accent hover:text-accent">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link to="/terms" className="font-medium text-accent hover:text-accent">
              Terms of Use
            </Link>
          </span>
        </label>

        {error && (
          <p ref={errorRef} role="alert" tabIndex={-1} className="text-[13px] text-neg outline-none">
            {error}
          </p>
        )}

        <Button type="submit" className="mt-1" disabled={submitting || !agreed}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-accent hover:text-accent">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
