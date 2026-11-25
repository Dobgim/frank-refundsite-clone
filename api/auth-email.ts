import type { IncomingMessage, ServerResponse } from 'node:http'
import { createClient } from '@supabase/supabase-js'
import { createTransport } from 'nodemailer'
import type { Database } from '../src/lib/database.types.ts'

/**
 * Sends authentication emails (signup confirmation, resend, password reset) from the
 * business mailbox instead of Supabase's default sender. Links are generated with the
 * Supabase admin API (which does not send any email itself) and point at this site's
 * /auth/confirm and /reset-password pages, which verify the token hash.
 */

type AuthEmailRequest = IncomingMessage & {
  body?: unknown
  method?: string
}

type AuthEmailResponse = ServerResponse<IncomingMessage> & {
  status: (code: number) => AuthEmailResponse
  json: (body: unknown) => AuthEmailResponse
}

const businessEmail = 'info@whitehillesettlement.online'
const allowedOrigins = new Set([
  'https://www.whitehillesettlement.online',
  'https://whitehillesettlement.online',
])

if (process.env.VERCEL_URL) {
  allowedOrigins.add(`https://${process.env.VERCEL_URL}`)
}

const profileFields = [
  'first_name', 'middle_name', 'last_name', 'username', 'phone', 'country', 'city',
  'account_type', 'currency', 'account_purpose',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readEmail(value: unknown) {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char)
}

function emailHtml(heading: string, intro: string, buttonLabel: string, link: string, footer: string) {
  const safeLink = escapeHtml(link)
  return `<!doctype html><html><body style="margin:0;background:#f4f6f5;font-family:Arial,Helvetica,sans-serif;color:#242927">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e5e9e6;border-radius:10px;padding:32px">
<tr><td style="font-size:20px;font-weight:bold;color:#165c49;padding-bottom:20px">Whitehill Settlement</td></tr>
<tr><td style="font-size:18px;font-weight:bold;padding-bottom:12px">${escapeHtml(heading)}</td></tr>
<tr><td style="font-size:14px;line-height:1.6;padding-bottom:24px">${escapeHtml(intro)}</td></tr>
<tr><td style="padding-bottom:24px"><a href="${safeLink}" style="display:inline-block;background:#165c49;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 22px;border-radius:6px">${escapeHtml(buttonLabel)}</a></td></tr>
<tr><td style="font-size:12px;line-height:1.6;color:#6e7774;padding-bottom:16px">If the button does not work, copy this link into your browser:<br><a href="${safeLink}" style="color:#165c49;word-break:break-all">${safeLink}</a></td></tr>
<tr><td style="font-size:12px;line-height:1.6;color:#6e7774;border-top:1px solid #e5e9e6;padding-top:16px">${escapeHtml(footer)}</td></tr>
</table></td></tr></table></body></html>`
}

export default async function handler(req: AuthEmailRequest, res: AuthEmailResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const origin = req.headers.origin
  if (!origin || !allowedOrigins.has(origin)) {
    return res.status(403).json({ error: 'This request is not allowed.' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!supabaseUrl || !serviceRoleKey || !host || !user || !pass || !Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('Auth email is not configured. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.')
    return res.status(503).json({ error: 'Account emails are temporarily unavailable. Please try again later.' })
  }

  const body = req.body
  if (!isRecord(body)) return res.status(400).json({ error: 'Invalid request.' })
  const action = body.action
  const email = readEmail(body.email)
  if (!email) return res.status(400).json({ error: 'Enter a valid email address.' })

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const transporter = createTransport({ host, port, secure: port === 465, requireTLS: port === 587, auth: { user, pass } })
  const from = { name: 'Whitehill Settlement', address: businessEmail }

  async function sendConfirmation(hashedToken: string, type: 'signup' | 'magiclink', firstName: string) {
    const link = `${origin}/auth/confirm?token_hash=${encodeURIComponent(hashedToken)}&type=${type}`
    const greeting = firstName ? `Hi ${firstName}, welcome` : 'Welcome'
    await transporter.sendMail({
      from,
      to: email ?? '',
      subject: 'Confirm your Whitehill Settlement account',
      text: `${greeting} to Whitehill Settlement.\n\nConfirm your email address to activate your account:\n${link}\n\nIf you did not create this account, you can ignore this email.`,
      html: emailHtml(
        'Confirm your email address',
        `${greeting} to Whitehill Settlement. Please confirm your email address to activate your account and sign in.`,
        'Confirm my email',
        link,
        'If you did not create this account, you can safely ignore this email.',
      ),
    })
  }

  try {
    if (action === 'signup') {
      const password = body.password
      if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
        return res.status(400).json({ error: 'Choose a password between 8 and 72 characters.' })
      }
      const rawProfile = isRecord(body.profile) ? body.profile : {}
      const profile: Record<string, string> = {}
      for (const field of profileFields) {
        const value = rawProfile[field]
        profile[field] = typeof value === 'string' ? value.trim().slice(0, 120) : ''
      }

      const { data, error } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email,
        password,
        options: { data: profile },
      })
      if (error) {
        if (error.status === 422 || /already/i.test(error.message)) {
          return res.status(409).json({ error: 'An account with this email already exists. Sign in, or use "Forgot password?" to reset it.' })
        }
        throw error
      }
      await sendConfirmation(data.properties.hashed_token, 'signup', profile.first_name)
      return res.status(200).json({ ok: true })
    }

    if (action === 'resend' || action === 'recovery') {
      // Always answer the same way so the endpoint cannot be used to discover accounts.
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: action === 'recovery' ? 'recovery' : 'magiclink',
        email,
      })
      if (linkError || !linkData.user) return res.status(200).json({ ok: true })

      if (action === 'resend') {
        if (!linkData.user.email_confirmed_at) {
          const firstName = typeof linkData.user.user_metadata.first_name === 'string' ? linkData.user.user_metadata.first_name : ''
          await sendConfirmation(linkData.properties.hashed_token, 'magiclink', firstName)
        }
        return res.status(200).json({ ok: true })
      }

      const link = `${origin}/reset-password?token_hash=${encodeURIComponent(linkData.properties.hashed_token)}&type=recovery`
      await transporter.sendMail({
        from,
        to: email,
        subject: 'Reset your Whitehill Settlement password',
        text: `We received a request to reset your password.\n\nChoose a new password here:\n${link}\n\nIf you did not ask for this, you can ignore this email; your password will not change.`,
        html: emailHtml(
          'Reset your password',
          'We received a request to reset the password for your Whitehill Settlement account. Use the button below to choose a new one.',
          'Reset my password',
          link,
          'If you did not ask for this, you can ignore this email — your password will not change.',
        ),
      })
      return res.status(200).json({ ok: true })
    }

    return res.status(400).json({ error: 'Invalid request.' })
  } catch (error) {
    console.error(`Auth email (${String(action)}) failed:`, error instanceof Error ? error.message : error)
    return res.status(502).json({ error: 'We could not send the email right now. Please try again in a moment.' })
  }
}
