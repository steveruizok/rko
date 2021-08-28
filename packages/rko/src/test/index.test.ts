import { StateManager } from '../index'
import { del } from 'idb-keyval'

export interface Todo {
  id: string
  text: string
  isComplete: boolean
  dateCreated: number
}

export interface State {
  todos: Record<string, Todo>
  items: string[]
}

export class TodoState extends StateManager<State> {
  // Internal API -------------------------

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

  /**
   * Load an entirely new state.
   */
  loadTodos = (state: State) => {
    return this.replaceState(state)
  }

  addItem = () => {
    const before = [...this.state.items]

    // Bad! Mutation!
    this.state.items.push('a')

    return this.setState({
      before: { items: before },
      after: { items: this.state.items },
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
  items: [],
}

describe('State manager', () => {
  it('Creates a state manager', () => {
    new TodoState(initialState)
  })

  it('Patches the state', () => {
    del('t0')
    const todoState = new TodoState(initialState, 't0')
    todoState.patchTodoText('todo0', 'hello world')
    expect(todoState.state.todos.todo0.text).toBe('hello world')
    todoState.undo()
    expect(todoState.state.todos.todo0.text).toBe('hello world')
  })

  it('Replaces the state', (done) => {
    del('t0')
    const todoState = new TodoState(initialState, 't0')
    todoState.loadTodos({
      todos: {
        a: {
          id: 'a',
          text: 'placeholder a',
          isComplete: false,
          dateCreated: 1629575640560,
        },
        b: {
          id: 'b',
          text: 'placeholder b',
          isComplete: false,
          dateCreated: 1629575640560,
        },
      },
      items: [],
    })
    expect(todoState.state.todos.todo0).toBe(undefined)
    expect(todoState.state.todos.todo1).toBe(undefined)
    expect(todoState.state.todos.a.text).toBe('placeholder a')
    expect(todoState.state.todos.b.text).toBe('placeholder b')

    // Does NOT persist state
    const todoState2 = new TodoState(initialState, 't0')
    setTimeout(() => {
      expect(todoState2.state.todos.todo0.isComplete).toBe(false)
      done()
    }, 100)
  })

  it('Does an command', (done) => {
    del('t0')
    const todoState = new TodoState(initialState, 't0')
    expect(todoState.state.todos.todo0.isComplete).toBe(false)
    todoState.toggleTodoComplete('todo0')
    expect(todoState.state.todos.todo0.isComplete).toBe(true)

    // Persists state
    const todoState2 = new TodoState(initialState, 't0')
    setTimeout(() => {
      expect(todoState2.state.todos.todo0.isComplete).toBe(true)
      done()
    }, 100)
  })

  it('Undoes an command', (done) => {
    del('t0')
    const todoState = new TodoState(initialState, 't0')
    todoState.toggleTodoComplete('todo0')
    expect(todoState.state.todos.todo0.isComplete).toBe(true)
    todoState.undo()
    expect(todoState.state.todos.todo0.isComplete).toBe(false)

    const todoState2 = new TodoState(initialState, 't0')
    setTimeout(() => {
      expect(todoState2.state.todos.todo0.isComplete).toBe(false)
      done()
    }, 100)
  })

  it('Redoes an command', (done) => {
    del('t0')
    const todoState = new TodoState(initialState, 't0')
    todoState.toggleTodoComplete('todo0')
    expect(todoState.state.todos.todo0.isComplete).toBe(true)
    todoState.undo()
    todoState.redo()
    expect(todoState.state.todos.todo0.isComplete).toBe(true)

    const todoState2 = new TodoState(initialState, 't0')
    setTimeout(() => {
      expect(todoState2.state.todos.todo0.isComplete).toBe(true)
      done()
    }, 100)
  })

  it('Resets the history', (done) => {
    del('t0')
    const todoState = new TodoState(initialState, 't0')
    todoState.toggleTodoComplete('todo0')
    expect(todoState.state.todos.todo0.isComplete).toBe(true)
    todoState.resetHistory()
    todoState.undo()
    expect(todoState.state.todos.todo0.isComplete).toBe(true)

    const todoState2 = new TodoState(initialState, 't0')
    setTimeout(() => {
      expect(todoState2.state.todos.todo0.isComplete).toBe(true)
      done()
    }, 100)
  })

  it('Resets the state', (done) => {
    del('t0')
    const todoState = new TodoState(initialState, 't0')
    todoState.toggleTodoComplete('todo0')
    expect(todoState.state.todos.todo0.isComplete).toBe(true)

    const todoState1 = new TodoState(initialState, 't0')
    todoState1.toggleTodoComplete('todo0')
    expect(todoState1.state.todos.todo0.isComplete).toBe(true)
    todoState1.reset()

    // The state should be reset
    expect(todoState1.state.todos.todo0.isComplete).toBe(false)

    // Undo and redo should be false
    expect(todoState1.canUndo).toBe(false)
    expect(todoState1.canRedo).toBe(false)

    // The reset should not be undoable
    todoState1.undo()
    expect(todoState1.state.todos.todo0.isComplete).toBe(false)

    // The reset state should be persisted
    const todoState2 = new TodoState(initialState, 't0')
    setTimeout(() => {
      expect(todoState2.state.todos.todo0.isComplete).toBe(false)
      done()
    }, 100)
  })

  it('Replaces when the version changes', (done) => {
    const todoState1 = new TodoState(initialState, 'upgrade_test_1', 1)
    todoState1.toggleTodoComplete('todo0')

    expect(todoState1.state.todos.todo0.isComplete).toBe(true)

    // Upgrade and remove the completed todos
    const todoState2 = new TodoState(
      {
        ...initialState,
        todos: {
          ...initialState.todos,
          todo3: {
            ...initialState.todos.todo0,
            text: 'Added in new initial state!',
          },
        },
      },
      'upgrade_test_1',
      2
    )

    // Small timeout to allow for the idb promises to resolve
    setTimeout(() => {
      expect(todoState2.state.todos.todo3?.text).toBe(
        'Added in new initial state!'
      )
      done()
    }, 100)
  })

  it('Upgrades when the version changes if upgrade is provided', (done) => {
    const todoState1 = new TodoState(initialState, 'upgrade_test_2', 1)
    todoState1.toggleTodoComplete('todo0')

    expect(todoState1.state.todos.todo0.isComplete).toBe(true)

    // Upgrade and remove the completed todos
    const todoState2 = new TodoState(
      initialState,
      'upgrade_test_2',
      2,
      (prev) => {
        return {
          todos: {
            ...Object.fromEntries(
              Object.entries(prev.todos)
                .filter(([id, todo]) => !todo.isComplete)
                .map(([id, todo]) => [id, todo])
            ),
          },
          items: prev.items,
        }
      }
    )

    // Small timeout to allow for the idb promises to resolve
    setTimeout(() => {
      expect(Object.values(todoState2.state.todos).length).toBe(1)
      done()
    }, 100)
  })

  it('Correctly sets canUndo', () => {
    const state = new TodoState(initialState)
    expect(state.canUndo).toBe(false)
    state.toggleTodoComplete('todo0')
    expect(state.canUndo).toBe(true)
    state.undo()
    expect(state.canUndo).toBe(false)
    state.reset()
    expect(state.canUndo).toBe(false)
  })

  it('Correctly sets canRedo', () => {
    const state = new TodoState(initialState)
    expect(state.canRedo).toBe(false)
    state.toggleTodoComplete('todo0')
    state.undo()
    expect(state.canRedo).toBe(true)
    state.redo()
    expect(state.canRedo).toBe(false)
    state.reset()
    expect(state.canRedo).toBe(false)
  })

  it('Correctly resets, even with mutations.', () => {
    const state = new TodoState(initialState)
    state.addItem()
    expect(state.state.items.length).toBe(1)
    state.reset()
    expect(state.state.items.length).toBe(0)
  })
})
