import { StateManager } from 'rko'

export interface Todo {
  id: string
  text: string
  isComplete: boolean
  dateCreated: number
}

export interface State {
  todos: Record<string, Todo>
}

export class TodoState extends StateManager<State> {
  // Internal API -------------------------

  protected onReady = () => {}

  protected cleanup = (state: State) => {
    Object.entries(state.todos).forEach(([id, todo]) => {
      if (!todo) delete state.todos[id]
    })

    return state
  }

  // Public API ---------------------------

  /**
   * Create a new todo.
   */
  createTodo = () => {
    const id = Date.now().toString()

    return this.setState({
      before: { todos: { [id]: undefined } },
      after: {
        todos: {
          [id]: {
            id,
            text: '',
            isComplete: false,
            dateCreated: new Date().getTime(),
          },
        },
      },
    })
  }

  /**
   * Toggle a todo between complete / not-complete.
   * @param id The id of the todo to change.
   */
  toggleTodoComplete = (id: string) => {
    const todo = this.state.todos[id]

    return this.setState({
      before: { todos: { [id]: { isComplete: todo.isComplete } } },
      after: { todos: { [id]: { isComplete: !todo.isComplete } } },
    })
  }

  /**
   * Patch the text of a todo.
   * @param id The id of the todo to change.
   * @param text The todo's new text.
   */
  patchTodoText = (id: string, text: string) => {
    return this.patchState({
      todos: { [id]: { text } },
    })
  }

  /**
   * Set the text of a todo. (Undoable)
   * @param id
   * @param text
   */
  setTodoText = (id: string, text: string) => {
    const todo = this.snapshot.todos[id]

    // Don't update if text is the same as the original text
    if (text === todo.text) return this

    return this.setState({
      before: { todos: { [id]: { text: todo.text } } },
      after: { todos: { [id]: { text } } },
    })
  }

  /**
   * Remove all todos that are marked as completed.
   */
  clearCompleted = () => {
    const completed = Object.values(this.state.todos).filter(
      (todo) => todo.isComplete
    )

    if (completed.length === 0) return

    return this.setState({
      before: {
        todos: Object.fromEntries(completed.map((todo) => [todo.id, todo])),
      },
      after: {
        todos: Object.fromEntries(
          completed.map((todo) => [todo.id, undefined])
        ),
      },
    })
  }
}

const initialState: State = {
  todos: {
    todo0: {
      id: 'todo0',
      text: 'Scrub the dog.',
      isComplete: false,
      dateCreated: 1629575640560,
    },
    todo1: {
      id: 'todo1',
      text: 'Sharpen the dishes.',
      isComplete: false,
      dateCreated: 1629275340560,
    },
  },
}

export const todoState = new TodoState(initialState)
