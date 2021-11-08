import * as React from "react"
import { Todo, todoState } from "../state"

export interface TodoProps {
  todo: Todo
}

export function TodoItem({ todo }: TodoProps) {
  const handleCompleteChange = React.useCallback(() => {
    todoState.toggleTodoComplete(todo.id)
  }, [todo.id])

  const handleTextFocus = React.useCallback(() => {
    todoState.setSnapshot()
  }, [])

  const handleTextChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      todoState.patchTodoText(todo.id, e.currentTarget.value)
    },
    [todo.id]
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        todoState.setTodoText(todo.id, e.currentTarget.value)
      }
    },
    [todo.id]
  )

  const handleTextBlur = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      todoState.setTodoText(todo.id, e.currentTarget.value)
    },
    [todo.id]
  )

  return (
    <div className="todo">
      <input
        type="checkbox"
        className="todo__checkbox"
        checked={todo.isComplete}
        onChange={handleCompleteChange}
      />
      <input
        type="text"
        className="todo__input"
        value={todo.text}
        onFocus={handleTextFocus}
        onBlur={handleTextBlur}
        onKeyDown={handleKeyDown}
        onChange={handleTextChange}
        disabled={todo.isComplete}
      />
    </div>
  )
}
