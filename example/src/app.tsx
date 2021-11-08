import * as React from "react"
import { todoState } from "./state"
import { TodoItem } from "./components/todo-item"

export default function App() {
  const todos = todoState.useStore((s) => s.todos)

  const canRemoveCompleted =
    Object.values(todos).filter((todo) => todo.isComplete).length > 0

  return (
    <div className="App">
      <h1>Todos</h1>
      <div className="button_list">
        <button onClick={todoState.createTodo}>New</button>
        <button
          disabled={!canRemoveCompleted}
          onClick={todoState.clearCompleted}
        >
          Clear Completed
        </button>
        <button disabled={!todoState.canUndo} onClick={todoState.undo}>
          Undo
        </button>
        <button disabled={!todoState.canRedo} onClick={todoState.redo}>
          Redo
        </button>
      </div>
      <div className="todo_list">
        {Object.values(todos)
          .sort((a, b) => a.dateCreated - b.dateCreated)
          .map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
      </div>
    </div>
  )
}
