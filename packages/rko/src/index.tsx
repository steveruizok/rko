import createVanilla, { StoreApi } from 'zustand/vanilla'
import create, { UseStore } from 'zustand'
import * as idb from 'idb-keyval'

export type Patch<T> = Partial<{ [P in keyof T]: Patch<T[P]> }>

export interface Command<T extends object> {
  before: Patch<T>
  after: Patch<T>
}

/**
 * Recursively merge an object with a deep partial of the same type.
 * @param target The original complete object.
 * @param patch The deep partial to merge with the original object.
 */
function merge<T>(target: T, patch: Patch<T>): T {
  const result: T = { ...target }

  const entries = Object.entries(patch) as [keyof T, T[keyof T]][]

  for (const [key, value] of entries)
    result[key] =
      value === Object(value) && !Array.isArray(value)
        ? merge(result[key], value)
        : value

  return result
}

export class StateManager<T extends object> {
  /**
   * An ID used to persist state in indexdb.
   */
  private id: string

  /**
   * The initial state.
   */
  private initialState: T

  /**
   * A zustand store that also holds the state.
   */
  private store: StoreApi<T>

  /**
   * A stack of commands used for history (undo and redo_.
   */
  private stack: Command<T>[] = []

  /**
   * The index of the current command.
   */
  private pointer: number = -1

  /**
   * The current state.
   */
  protected state: T

  /**
   * A snapshot of the current state.
   */
  protected snapshot: T

  /**
   * A React hook for accessing the zustand store.
   */
  public readonly useStore: UseStore<T>

  /**
   * The state manager's current status, with regard to restoring persisted state.
   */
  public status: 'loading' | 'ready' = 'loading'

  constructor(initialState: T, id = 'react-state-manager') {
    this.id = id
    this.state = initialState
    this.snapshot = initialState
    this.initialState = initialState
    this.store = createVanilla(() => initialState)
    this.useStore = create(this.store)

    idb.get(this.id).then((saved) => {
      if (!saved) return
      this.state = saved
      this.snapshot = saved
      this.initialState = saved
      this.status = 'ready'
      this.store.setState(saved)
    })
  }

  /**
   * Save the current state to indexdb.
   */
  private persist = (): Promise<void> => idb.set(this.id, this.state)

  /**
   * Apply a patch to the current state. This does not effect the undo/redo stack.
   * @param patch
   */
  private applyPatch = (patch: Patch<T>) => {
    this.state = this.cleanup(merge(this.state, patch), patch)
    this.store.setState(this.state, true)
    return this
  }

  // Internal API ---------------------------------

  /**
   * Perform any last changes to the state before updating.
   * Override this on the extending class.
   * @param state
   */
  protected cleanup = (state: T, patch: Patch<T>): T => state

  /**
   * Apply a patch to the current state.
   * This does not effect the undo/redo stack.
   * @param patch
   */
  protected patchState = (patch: Patch<T>): StateManager<T> => {
    this.applyPatch(patch)
    return this
  }

  /**
   * Update the state using a Command.
   * This effects the undo/redo stack.
   * @param command
   */
  protected setState = (command: Command<T>): StateManager<T> => {
    this.pointer++
    this.stack = this.stack.slice(0, this.pointer)
    this.stack.push(command)
    this.applyPatch(command.after)
    this.persist()
    return this
  }

  // Public API ---------------------------------

  /**
   * Reset the state to the initial state and reset history.
   */
  public reset = (): StateManager<T> => {
    this.stack = []
    this.pointer = -1
    this.state = this.initialState
    this.store.setState(this.initialState, true)
    return this
  }

  /**
   * Reset the history stack (without resetting the state).
   */
  public resetHistory = (): StateManager<T> => {
    this.stack = []
    this.pointer = -1
    return this
  }

  /**
   * Move backward in the undo/redo stack.
   */
  public undo = (): StateManager<T> => {
    if (!this.canUndo) return this
    const command = this.stack[this.pointer]
    this.pointer--
    this.applyPatch(command.before)
    this.persist()
    return this
  }

  /**
   * Move forward in the undo/redo stack.
   */
  public redo = (): StateManager<T> => {
    if (!this.canRedo) return this
    this.pointer++
    const command = this.stack[this.pointer]
    this.applyPatch(command.after)
    this.persist()
    return this
  }

  /**
   * Save a snapshot of the current state, accessible at `this.snapshot`.
   */
  public setSnapshot = (): StateManager<T> => {
    this.snapshot = { ...this.state }
    return this
  }

  /**
   * Force the zustand state to update.
   */
  public forceUpdate = () => {
    this.store.setState(this.state, true)
  }

  /**
   * Get whether the state manager can undo.
   */
  get canUndo(): boolean {
    return this.pointer > -1
  }

  /**
   * Get whether the state manager can redo.
   */
  get canRedo(): boolean {
    return this.pointer < this.stack.length - 1
  }
}
