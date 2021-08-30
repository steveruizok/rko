import createVanilla, { StoreApi } from 'zustand/vanilla'
import create, { UseStore } from 'zustand'
import * as idb from 'idb-keyval'
import { deepCopy } from './copy'
import { merge } from './merge'
import type { Patch, Command } from './types'

export class StateManager<T extends object> {
  /**
   * An ID used to persist state in indexdb.
   */
  private id?: string

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
  private _state: T

  /**
   * The state manager's current status, with regard to restoring persisted state.
   */
  private _status: 'loading' | 'ready' = 'loading'

  /**
   * A snapshot of the current state.
   */
  protected _snapshot: T

  /**
   * A React hook for accessing the zustand store.
   */
  public readonly useStore: UseStore<T>

  constructor(
    initialState: T,
    id?: string,
    version?: number,
    update?: (prev: T, next: T, prevVersion: number) => T
  ) {
    this.id = id
    this._state = deepCopy(initialState)
    this._snapshot = deepCopy(initialState)
    this.initialState = deepCopy(initialState)
    this.store = createVanilla(() => this._state)
    this.useStore = create(this.store)

    if (this.id) {
      idb.get(this.id).then(async (saved) => {
        if (saved) {
          let next = saved

          if (version) {
            let savedVersion = await idb.get<number>(id + '_version')

            if (savedVersion && savedVersion < version) {
              next = update
                ? update(saved, initialState, savedVersion)
                : initialState
            }
          }

          await idb.set(id + '_version', version || -1)

          this._state = deepCopy(next)
          this._snapshot = deepCopy(next)
          this._status = 'ready'
          this.store.setState(this._state, true)
        } else {
          await idb.set(id + '_version', version || -1)

          this._status = 'ready'
        }
      })
    }
  }

  /**
   * Save the current state to indexdb.
   */
  protected persist = (): void | Promise<void> => {
    if (this.id) {
      return idb.set(this.id, this._state)
    }
  }

  /**
   * Apply a patch to the current state.
   * This does not effect the undo/redo stack.
   * This does not persist the state.
   * @param patch The patch to apply.
   * @param id (optional) An id for the patch.
   */
  private applyPatch = (patch: Patch<T>, id: string) => {
    const prev = this._state
    const next = merge(this._state, patch)
    const final = this.cleanup(next, prev, patch, id)
    this.onStateWillChange(final, id)
    this._state = final
    this.store.setState(this._state, true)
    this.onStateDidChange(this._state, id)
    return this
  }

  // Internal API ---------------------------------

  /**
   * Perform any last changes to the state before updating.
   * Override this on your extending class.
   * @param nextState The next state.
   * @param prevState The previous state.
   * @param patch The patch that was just applied.
   * @param id (optional) An id for the just-applied patch.
   * @returns The final new state to apply.
   */
  protected cleanup = (
    nextState: T,
    prevState: T,
    patch: Patch<T>,
    id?: string
  ): T => nextState

  /**
   * A life-cycle method called when the state is about to change.
   * @param state The next state.
   * @param id An id for the change.
   */
  protected onStateWillChange = (state: T, id: string): void => {}

  /**
   * A life-cycle method called when the state has changed.
   * @param state The next state.
   * @param id An id for the change.
   */
  protected onStateDidChange = (state: T, id: string): void => {}

  /**
   * Apply a patch to the current state.
   * This does not effect the undo/redo stack.
   * This does not persist the state.
   * @param patch The patch to apply.
   * @param id (optional) An id for this patch.
   */
  protected patchState = (patch: Patch<T>, id?: string): this => {
    this.applyPatch(patch, id ? 'patch:' + id : 'patch')
    return this
  }

  /**
   * Replace the current state.
   * This does not effect the undo/redo stack.
   * This does not persist the state.
   * @param state The new state.
   * @param id An id for this change.
   */
  protected replaceState = (state: T, id?: string): this => {
    const final = this.cleanup(
      state,
      this._state,
      state,
      id ? 'replace:' + id : 'replace'
    )
    this.onStateWillChange(final, id ? 'replace:' + id : 'replace')
    this._state = final
    this.store.setState(this._state, true)
    this.onStateDidChange(this._state, id ? 'replace:' + id : 'replace')
    return this
  }

  /**
   * Update the state using a Command.
   * This effects the undo/redo stack.
   * This persists the state.
   * @param command The command to apply and add to the undo/redo stack.
   * @param id (optional) An id for this command.
   */
  protected setState = (command: Command<T>, id?: string) => {
    this.pointer++
    this.stack = this.stack.slice(0, this.pointer)
    this.stack.push({ id, ...command })
    this.applyPatch(command.after, id ? 'command:' + id : 'command')
    this.persist()
    return this
  }

  // Public API ---------------------------------

  /**
   * Reset the state to the initial state and reset history.
   */
  public reset = () => {
    this.onStateWillChange(this.initialState, 'reset')
    this._state = this.initialState
    this.store.setState(this._state, true)
    this.resetHistory()
    this.persist()
    this.onStateDidChange(this._state, 'reset')
    return this
  }

  /**
   * Reset the history stack (without resetting the state).
   */
  public resetHistory = (): this => {
    this.stack = []
    this.pointer = -1
    return this
  }

  /**
   * Move backward in the undo/redo stack.
   */
  public undo = (): this => {
    if (!this.canUndo) return this
    const command = this.stack[this.pointer]
    this.pointer--
    this.applyPatch(command.before, command.id ? `undo:${command.id}` : 'undo')
    this.persist()
    return this
  }

  /**
   * Move forward in the undo/redo stack.
   */
  public redo = (): this => {
    if (!this.canRedo) return this
    this.pointer++
    const command = this.stack[this.pointer]
    this.applyPatch(command.after, command.id ? `redo:${command.id}` : 'redo')
    this.persist()
    return this
  }

  /**
   * Save a snapshot of the current state, accessible at `this.snapshot`.
   */
  public setSnapshot = (): this => {
    this._snapshot = { ...this._state }
    return this
  }

  /**
   * Force the zustand state to update.
   */
  public forceUpdate = () => {
    this.store.setState(this._state, true)
  }

  /**
   * Get whether the state manager can undo.
   */
  public get canUndo(): boolean {
    return this.pointer > -1
  }

  /**
   * Get whether the state manager can redo.
   */
  public get canRedo(): boolean {
    return this.pointer < this.stack.length - 1
  }

  /**
   * The current state.
   */
  public get state(): T {
    return this._state
  }

  /**
   * The current status.
   */
  public get status(): string {
    return this._status
  }

  /**
   * The most-recent snapshot.
   */
  protected get snapshot(): T {
    return this._snapshot
  }
}
