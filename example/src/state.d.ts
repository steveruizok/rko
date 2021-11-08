import { StateManager } from "rko";
export interface Todo {
    id: string;
    text: string;
    isComplete: boolean;
    dateCreated: number;
}
export interface State {
    todos: Record<string, Todo>;
}
export declare class TodoState extends StateManager<State> {
    protected onReady: () => void;
    protected cleanup: (state: State) => State;
    /**
     * Create a new todo.
     */
    createTodo: () => this;
    /**
     * Toggle a todo between complete / not-complete.
     * @param id The id of the todo to change.
     */
    toggleTodoComplete: (id: string) => this;
    /**
     * Patch the text of a todo.
     * @param id The id of the todo to change.
     * @param text The todo's new text.
     */
    patchTodoText: (id: string, text: string) => this;
    /**
     * Set the text of a todo. (Undoable)
     * @param id
     * @param text
     */
    setTodoText: (id: string, text: string) => this;
    /**
     * Remove all todos that are marked as completed.
     */
    clearCompleted: () => this | undefined;
}
export declare const todoState: TodoState;
