import { createHmac } from 'crypto'

export function hashStudentId(rawId: string): string {
  const salt = process.env.VOTER_ID_SALT
  if (!salt) {
    throw new Error('VOTER_ID_SALT environment variable is not set')
  }
  return createHmac('sha256', salt)
    .update(rawId.trim().toUpperCase())
    .digest('hex')
}
