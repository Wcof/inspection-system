import { describe, it, expect } from 'vitest'
import { useUndoRedo } from '@/utils/undo-redo'

describe('useUndoRedo', () => {
  it('should push snapshots and undo/redo correctly', () => {
    const { canUndo, canRedo, pushSnapshot, undo, redo } = useUndoRedo<string>()

    expect(canUndo.value).toBe(false)
    expect(canRedo.value).toBe(false)

    pushSnapshot('state-1')
    pushSnapshot('state-2')
    pushSnapshot('state-3')

    expect(canUndo.value).toBe(true)
    expect(canRedo.value).toBe(false)

    // Undo: current='current', should get 'state-3'
    const prev = undo('current')
    expect(prev).toBe('state-3')
    expect(canUndo.value).toBe(true)
    expect(canRedo.value).toBe(true)

    // Redo: current='state-3', should get 'current'
    const next = redo('state-3')
    expect(next).toBe('current')
    expect(canRedo.value).toBe(false)

    // New push clears redo
    pushSnapshot('state-4')
    expect(canRedo.value).toBe(false)
  })

  it('should respect maxStackSize', () => {
    const { pushSnapshot, undo } = useUndoRedo<string>(3)

    pushSnapshot('s1')
    pushSnapshot('s2')
    pushSnapshot('s3')
    pushSnapshot('s4') // should evict s1

    const prev = undo('current')
    expect(prev).toBe('s4')
    const prev2 = undo('s4')
    expect(prev2).toBe('s3')
    const prev3 = undo('s3')
    expect(prev3).toBe('s2')
    const prev4 = undo('s2')
    expect(prev4).toBeNull() // s1 was evicted
  })

  it('clear should reset all state', () => {
    const { canUndo, canRedo, pushSnapshot, undo, clear } = useUndoRedo<number>()

    pushSnapshot(1)
    pushSnapshot(2)
    undo(3)

    clear()
    expect(canUndo.value).toBe(false)
    expect(canRedo.value).toBe(false)
  })
})
