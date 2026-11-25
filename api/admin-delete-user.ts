import type { IncomingMessage, ServerResponse } from 'node:http'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../src/lib/database.types.ts'

type AdminRequest = IncomingMessage & {
  body?: unknown
  method?: string
}

type AdminResponse = ServerResponse<IncomingMessage> & {
  status: (code: number) => AdminResponse
  json: (body: unknown) => AdminResponse
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Removes every object under `prefix` (recursively) from a storage bucket. */
async function removeFolder(supabase: SupabaseClient<Database>, bucket: string, prefix: string): Promise<number> {
  let removed = 0
  for (;;) {
    const { data: entries, error } = await supabase.storage.from(bucket).list(prefix, { limit: 100, offset: 0 })
    if (error) throw new Error(`Unable to list ${bucket}/${prefix}: ${error.message}`)

    const files = entries.filter((entry) => entry.id !== null).map((entry) => `${prefix}/${entry.name}`)
    const folders = entries.filter((entry) => entry.id === null).map((entry) => `${prefix}/${entry.name}`)

    for (const folder of folders) removed += await removeFolder(supabase, bucket, folder)
    if (files.length === 0) return removed

    const { error: removeError } = await supabase.storage.from(bucket).remove(files)
    if (removeError) throw new Error(`Unable to remove files from ${bucket}: ${removeError.message}`)
    removed += files.length
  }
}

export default async function handler(req: AdminRequest, res: AdminResponse) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('User deletion is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
    return res.status(503).json({ error: 'User deletion is not configured on the server.' })
  }

  const authorization = req.headers.authorization
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!token) return res.status(401).json({ error: 'Unauthorized.' })

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Verify the caller's session with Supabase and require the trusted admin role.
  const { data: caller, error: callerError } = await supabase.auth.getUser(token)
  if (callerError || !caller.user) return res.status(401).json({ error: 'Unauthorized.' })
  if (caller.user.app_metadata.role !== 'admin') return res.status(403).json({ error: 'Administrator access is required.' })

  const body: unknown = req.body
  const userId = typeof body === 'object' && body !== null && 'userId' in body ? body.userId : undefined
  if (typeof userId !== 'string' || !uuidPattern.test(userId)) {
    return res.status(400).json({ error: 'A valid user ID is required.' })
  }
  if (userId === caller.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own administrator account.' })
  }

  const { data: target, error: targetError } = await supabase.auth.admin.getUserById(userId)
  if (targetError || !target.user) return res.status(404).json({ error: 'User not found.' })
  if (target.user.app_metadata.role === 'admin') {
    return res.status(403).json({ error: 'Administrator accounts cannot be deleted from the dashboard.' })
  }

  try {
    // Private files are not removed by the database cascade, so delete them first.
    const removedFiles =
      (await removeFolder(supabase, 'case-documents', userId)) +
      (await removeFolder(supabase, 'identity-verifications', userId))

    // Deleting the auth user cascades to profiles, case requests, documents and verifications.
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)
    if (deleteError) throw new Error(deleteError.message)

    console.info(`Admin ${caller.user.id} deleted user ${userId} (${removedFiles} files removed).`)
    return res.status(200).json({ ok: true, removedFiles })
  } catch (error) {
    console.error('Unable to delete user:', error instanceof Error ? error.message : error)
    return res.status(502).json({ error: 'Unable to delete this user. Please try again.' })
  }
}
