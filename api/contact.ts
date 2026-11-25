import { createTransport } from 'nodemailer'
import type { IncomingMessage, ServerResponse } from 'node:http'

type ContactRequest = IncomingMessage & {
  body?: unknown
  method?: string
}

type ContactResponse = ServerResponse<IncomingMessage> & {
  status: (code: number) => ContactResponse
  json: (body: unknown) => ContactResponse
}

const businessEmail = 'info@whitehillesettlement.online'
const allowedOrigins = new Set([
  'https://www.whitehillesettlement.online',
  'https://whitehillesettlement.online',
])

if (process.env.VERCEL_URL) {
  allowedOrigins.add(`https://${process.env.VERCEL_URL}`)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text.length > 0 && text.length <= maxLength ? text : null
}

export default async function handler(req: ContactRequest, res: ContactResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const origin = req.headers.origin
  if (!origin || !allowedOrigins.has(origin)) {
    return res.status(403).json({ error: 'This request is not allowed.' })
  }

  if (!isRecord(req.body)) {
    return res.status(400).json({ error: 'Please submit a valid contact form.' })
  }

  if (typeof req.body.website === 'string' && req.body.website.trim()) {
    return res.status(200).json({ ok: true })
  }

  const name = readText(req.body.name, 120)
  const email = readText(req.body.email, 254)
  const subject = readText(req.body.subject, 200)
  const message = readText(req.body.message, 5000)

  if (
    !name ||
    /[\r\n]/.test(name) ||
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !subject ||
    /[\r\n]/.test(subject) ||
    !message
  ) {
    return res.status(400).json({ error: 'Check the form fields and try again.' })
  }

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass || !Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('Contact email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.')
    return res.status(503).json({ error: 'Contact email is not configured yet. Please email info@whitehillesettlement.online.' })
  }

  const transporter = createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
  })

  try {
    await transporter.sendMail({
      from: { name: 'Whitehill Settlement', address: businessEmail },
      to: businessEmail,
      replyTo: { name, address: email },
      subject: `Website contact: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
    })
  } catch (error) {
    console.error('Unable to deliver contact form email:', error instanceof Error ? error.message : 'Unknown SMTP error')
    return res.status(502).json({ error: 'We could not send your message. Please try again or email info@whitehillesettlement.online.' })
  }

  return res.status(200).json({ ok: true })
}
