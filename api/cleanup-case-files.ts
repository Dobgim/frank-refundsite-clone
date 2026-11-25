import { timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/lib/database.types.ts'

type CronRequest = IncomingMessage & {
  method?: string
}

type CronResponse = ServerResponse<IncomingMessage> & {
  status: (code: number) => CronResponse
  json: (body: unknown) => CronResponse
}

function isAuthorized(provided: string | undefined, expected: string) {
  if (!provided) return false
  const providedBuffer = Buffer.from(provided)
  const expectedBuffer = Buffer.from(`Bearer ${expected}`)
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer)
}

export default async function handler(req: CronRequest, res: CronResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || !isAuthorized(req.headers.authorization, cronSecret)) {
    return res.status(401).json({ error: 'Unauthorized.' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Document cleanup is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
    return res.status(503).json({ error: 'Document cleanup is not configured.' })
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const retentionCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const expiredRequests: { id: string; user_id: string }[] = []

  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from('case_requests')
      .select('id, user_id')
      .not('closed_at', 'is', null)
      .lt('closed_at', retentionCutoff)
      .order('closed_at', { ascending: true })
      .range(offset, offset + 499)

    if (error) {
      console.error('Unable to find expired case documents:', error.message)
      return res.status(502).json({ error: 'Unable to find expired documents.' })
    }

    expiredRequests.push(...data)
    if (data.length < 500) break
  }

  let deletedDocuments = 0
  let deletedFiles = 0
  for (let offset = 0; offset < expiredRequests.length; offset += 100) {
    const requestBatch = expiredRequests.slice(offset, offset + 100)
    const { data: documents, error: documentError } = await supabase
      .from('case_documents')
      .select('id, storage_path')
      .in('request_id', requestBatch.map(({ id }) => id))

    if (documentError) {
      console.error('Unable to find expired document records:', documentError.message)
      return res.status(502).json({ error: 'Unable to find expired documents.' })
    }

    for (let fileOffset = 0; fileOffset < documents.length; fileOffset += 100) {
      const batch = documents.slice(fileOffset, fileOffset + 100)
      const { error: storageError } = await supabase.storage
        .from('case-documents')
        .remove(batch.map(({ storage_path }) => storage_path))

      if (storageError) {
        console.error('Unable to remove expired case files:', storageError.message)
        return res.status(502).json({ error: 'Unable to remove expired documents.' })
      }
      deletedFiles += batch.length

      const { error: deleteError } = await supabase
        .from('case_documents')
        .delete()
        .in('id', batch.map(({ id }) => id))

      if (deleteError) {
        console.error('Unable to remove expired document records:', deleteError.message)
        return res.status(502).json({ error: 'Unable to finish document cleanup.' })
      }

      deletedDocuments += batch.length
    }

    for (const request of requestBatch) {
      const folder = `${request.user_id}/${request.id}`
      for (;;) {
        const { data: files, error: listError } = await supabase.storage
          .from('case-documents')
          .list(folder, { limit: 100, offset: 0 })

        if (listError) {
          console.error('Unable to find unlinked case files:', listError.message)
          return res.status(502).json({ error: 'Unable to finish document cleanup.' })
        }

        const paths = files
          .filter((file) => file.id !== null)
          .map((file) => `${folder}/${file.name}`)
        if (paths.length === 0) break

        const { error: orphanError } = await supabase.storage.from('case-documents').remove(paths)
        if (orphanError) {
          console.error('Unable to remove unlinked case files:', orphanError.message)
          return res.status(502).json({ error: 'Unable to finish document cleanup.' })
        }
        deletedFiles += paths.length
      }
    }
  }

  return res.status(200).json({ deletedDocuments, deletedFiles })
}
