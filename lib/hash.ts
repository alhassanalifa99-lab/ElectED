import crypto from 'crypto'

export function hashValue(rawValue: string): string {
  const salt = process.env.VOTER_ID_SALT
  if (!salt) throw new Error('VOTER_ID_SALT is not set')

  return crypto
    .createHmac('sha256', salt)
    .update(rawValue.trim().toUpperCase())
    .digest('hex')
}

export function generatePin(): string {
  return crypto.randomInt(100000, 999999).toString()
}