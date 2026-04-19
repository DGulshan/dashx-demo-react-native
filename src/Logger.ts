import { useSyncExternalStore } from 'react';

/**
 * Mirrors `DemoLog` from the iOS demo: an in-memory, bounded log store shared
 * by every screen. Entries accumulate at the bottom; `LogsView` renders them.
 */

export type LogLevel = 'info' | 'error';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
}

const MAX_ENTRIES = 500;

let entries: LogEntry[] = [];
const listeners = new Set<() => void>();

let counter = 0;
function nextId(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}`;
}

export const DemoLog = {
  log(level: LogLevel, message: string): void {
    const entry: LogEntry = {
      id: nextId(),
      timestamp: new Date(),
      level,
      message,
    };
    const next =
      entries.length >= MAX_ENTRIES
        ? [...entries.slice(entries.length - MAX_ENTRIES + 1), entry]
        : [...entries, entry];
    entries = next;
    listeners.forEach((l) => l());
  },

  clear(): void {
    entries = [];
    listeners.forEach((l) => l());
  },

  getEntries(): LogEntry[] {
    return entries;
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** React hook — re-renders whenever new entries arrive. */
export function useLogEntries(): LogEntry[] {
  return useSyncExternalStore(DemoLog.subscribe, DemoLog.getEntries);
}
