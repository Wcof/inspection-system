import type { AuditLogEntry } from '@/types/audit'

const STORAGE_KEY = 'audit-log'

function getStoredLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setStoredLogs(logs: AuditLogEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
}

export function writeAuditLog(
  entry: Omit<AuditLogEntry, 'id' | 'createdAt'>
): AuditLogEntry {
  const logs = getStoredLogs()
  const newEntry: AuditLogEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString()
  }
  logs.push(newEntry)
  setStoredLogs(logs)
  return newEntry
}

export function getAuditLogs(): AuditLogEntry[] {
  return getStoredLogs()
}

export function clearAuditLogs(): void {
  localStorage.removeItem(STORAGE_KEY)
}
