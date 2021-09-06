![logo](./rko-logo.svg)

Out of nowhere! A state management library for React with built-in undo, redo, and persistence. Built on [Zustand](https://github.com/pmndrs/zustand).

![logo](./rko-logo-shadow.svg)

🧑‍💻 Check out the [example project](https://codesandbox.io/s/rko-example-mf9cx).

💜 Like this? Consider [becoming a sponsor](https://github.com/sponsors/steveruizok?frequency=recurring&sponsor=steveruizok).

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Advanced Usage](#advanced-usage)
- [Examples](#examples)
- [Support](#support)
- [Discussion](#discussion)
- [Author](#author)

## Installation

```bash
npm install rko
```

or

```bash
yarn add rko
```

## Usage

> 🧑‍🏫 Using TypeScript? See [here](#using-with-typescript) for additional docs.

To use the library, first define your state as a class that extends `StateManager`. In your methods, you can use the `StateManager`'s [internal API](#internal-api) to update the state.

```ts
// state.js
import { StateManager } from 'rko'

class MyState extends StateManager {
  adjustCount = (n) =>
    this.setState({
      before: {
        count: this.state.count,
      },
      after: {
        count: this.state.count + n,
      },
    })
}
```

Next, export an instance of the state. If you want to persist the state, give it an `id`.

```js
export const myState = new MyState({ count: 0 }, 'my-state')
```

In your React components, you can use the state's `useStore` hook to select out the data you need. For more on the `useStore` hook, see zustand's [documentation](https://github.com/pmndrs/zustand#then-bind-your-components-and-thats-it).

```jsx
// app.jsx
import { myState } from './state'

function App() {
  const { count } = myState.useStore((s) => s.count)
  return (
    <div>
      <h1>{count}</h1>
    </div>
  )
}
```

You can also call your state's methods from your React components.

```jsx
function App() {
  const { count } = myState.useStore((s) => s.count)

  function increment() {
    myState.adjustCount(1)
  }

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={increment}>Increment</button>
    </div>
  )
}
```

...and you can use the `StateManager`'s [built-in methods](#public-api) too.

```jsx
function App() {
  const { count } = myState.useStore((s) => s.count)

  function increment() {
    myState.adjustCount(1)
  }

  return (
    <div>
      <h1>{count}</h1>
      <button onClick={increment}>Increment</button>
      <button onClick={myState.undo}>Undo</button>
      <button onClick={myState.redo}>Redo</button>
    </div>
  )
}
```

Right on, you've got your global state.

## StateManager

The `rko` library exports a class named `StateManager` that you can extend to create a global state for your app. The methods you add to the class can access the `StateManager`'s [internal API](#internal-api).

```ts
import { StateManager } from 'rko'

class AppState extends StateManager {
  // your methods here
}
```

You only need to create one instance of your `StateManager` sub-class. When you create the instance, pass an **initial state** object to its constructor.

```ts
const initialState = {
  // ...
}

export const appState = new AppState(initialState)
```

You can also use the constructor to:

- [persist](#persisting-the-state) the state
- [upgrade](#upgrading-the-persisted-state) a previously-persisted state.

### Internal API

You can use `StateManager`'s internal API to update your state from within your your sub-class methods.

#### `patchState(patch: Patch<State>, id?: string)`

Update the state without effecting the undo/redo stack. This method accepts a `Patch` type object, or a "deep partial" of the state object containing only the changes that you wish to make.

```ts
toggleMenuOpen = () =>
  this.patchState({
    ui: {
      menuOpen: !this.state.ui.menuOpen,
    },
  })
```

You can pass an id as `setState`'s second parameter. This is provided to help with logging and debugging. The id will be saved in the history stack and be available in the [`onStateWillChange`](#onstatewillchange) and [`onStateDidChange`](#onstatedidchange) callbacks.

For example, this method:

```js
 addMessage(newMessage) {
    this.patchState({ message: newMessage }, "added_message")
  }
```

Would cause `onStateDidChange` to receive `added_message` as its second argument.

#### `setState(command: Command<State>, id?: string)`

Update the state, push the command to the undo/redo stack, and persist the new state. This method accepts a `Command` type object containing two `Patch`es: `before` and `after`. The `after` patch should contain the changes to the state that you wish to make immediately and when the command is "re-done". The `before` patch should contain the changes to make when the command is "undone".

```ts
adjustCount = (n) =>
  this.setState({
    before: {
      count: this.state.count,
    },
    after: {
      count: this.state.count + n,
    },
  })
```

Like [`patchState`](#patchstate), you can provide an id as the method's second argument. Alternatively, you can provide the id as part of the command object. If you provide _both_, then the argument id will be used instead.

#### `replaceState(state: State, id?: string)`

Works like `patchState` but accepts an entire state instead of a patch. This is useful for cases where a deep merge may be too expensive, such as changing items during a drag or scroll interaction. Note that, like `patchState`, this method will not effect the undo/redo stack. You might also want to call `resetHistory`.

```ts
loadNewTodos = (state: State) =>
  this.replaceState({
    todos,
  })
```

#### `cleanup(next: State, prev: State, patch: Patch<State>)`

The cleanup method is called on every state change, _after_ applying the current patch. It receives the next state, the previous state, and the patch that was just applied. It returns the "final" updated state.

```ts
cleanup = (next: State) => {
  const final = { ...state }

  for (const id in todos) {
    if (todos[id] === 'undefined') {
      delete final.todos[id]
    }
  }

  return final
}
```

You can override this method in order to clean up any state that is no longer needed. Note that the changes won't be present in the undo/redo stack.

You can also override this method to log changes or implement
middleware (see [Using Middleware](#using-middleware)).

#### `onReady()`

The `onReady` method is called when the state is finished loading
persisted data, if any.

```ts
class Example extends StateManager {
  onReady() {
    console.log('loaded state from indexdb', this.state)
  }
}
```

#### `onStateWillChange(state: State, id: string)`

The `onStateWillChange` method is called just before each state change. It runs after `cleanup`. Your React components will _not_ have updated when this method runs.

```ts
onStateWillChange = (state: State, id: string) => {
  console.log('Changing from', this.state, 'to', state, 'because', id)
  // > Changed from {...} to {...} because command:toggled_todo
}
```

Its first argument is the _next_ state. (You can still access the current state as `this.state`). The `id` argument will be either `patch`, `command`, `undo`, `redo`, or `reset`.

You can override this method to log changes or implement middleware (see [Using Middleware](#using-middleware)). If you're interested in _what_ changed, consider using the [cleanup](#cleanup) method instead.

#### `onStateDidChange(state: State, id: string)`

The `onStateDidChange` method works just like `onStateWillChange`, except that it runs _after_ the state has updated. Your React components will have updated by the time this method runs.

```ts
onStateDidChange = (state: State, id: string) => {
  console.log('Changed to', state, 'because', id)
  // > Changed to {...} because command:toggled_todo
}
```

#### `snapshot`

The most recently saved snapshot, or else the initial state if `setSnapshot` has not yet been called. You can use the `snapshot` to restore earlier parts of the state (see [Using Snapshots](#using-snapshots)). Readonly.

### Public API

The `StateManager` class exposes a public API that you can use to interact with your state either from within your class methods or from anywhere in your application.

#### `undo()`

Move backward in history, un-doing the most recent change.

#### `redo()`

Move forward in history, re-doing the previous undone change.

#### `reset()`

Reset the state to its initial state (as provided in the constructor). This is not undoable. Calling `reset()` will also reset the history.

#### `resetHistory()`

Reset the state's history.

#### `forceUpdate()`

Force the state to update.

#### `setSnapshot()`

Save the current state to the the `snapshot` property (see [Using Snapshots](#using-snapshots)).

#### `useStore`

The [zustand hook](https://github.com/pmndrs/zustand#then-bind-your-components-and-thats-it) used to subscribe components to the state.

#### `state`

The current state. Readonly.

#### `status`

The current status of the state: `ready` or `loading`. If restoring a persisted state, the state will briefly be `loading` while the state is being restored (see [Persisting the State](#persisting-the-state)). Readonly.

#### `canUndo`

Whether the state can undo, given its undo/redo stack. Readonly.

#### `canRedo`

Whether the state can redo, given its undo/redo stack. Readonly.

## Advanced Usage

### Using with TypeScript

To use this library with TypeScript, define an interface for your state object and then use it as a generic when extending `StateManager`.

```ts
import { StateManager, Patch, Command } from 'rko'

interface State {
  name: string
  count: number
}

class MyState extends StateManager<State> {
  // ...
}
```

Depending on how you're using the library (and your TypeScript config), you might also need the library's `Patch` and `Command` types. Both take your state interface as a generic.

```ts
cleanup = (next: State, prev: State, patch: Patch<State>) => {
  log(patch)
  return next
}
```

#### Persisting the State

To **persist** the state, pass an **id** string to the class constructor.

```ts
export const appState = new AppState({ count: 0 }, 'counter')
```

The library will now save a copy of the state after each new call to `setState`, `undo`, `redo`, or `reset`. The next time you create a new instance of your `StateManager` sub-class, it will restore the state from the persisted state.

Because restoring a state is done _asynchronously_, the provided initial state will be used on your app's first render. To avoid a flash of content as the app loads, you can use the state's `status` property, which may be either `loading` or `ready`.

```jsx
function App() {
  const { count } = myState.useStore((s) => s.count)

  if (myState.status === 'loading') {
    return null
  }

  return <h1>{count}</h1>
}
```

#### Upgrading the Persisted State

The constructor also accepts a version number. If you want to replace the persisted state, you can bump the version number.

```ts
const initialState = { wins: 0, losses: 0 }

// Will persist state under the key 'game'
export const appState = new AppState(initialState, 'game', 1)
```

By default, if the constructor finds a persisted state with the same id but a lower version number it will replace the persisted state with the initial state that you provide.

```ts
const initialState = { wins: 0, losses: 0, score: 0 }

// Will replace any previous 'game' state with a version < 2
export const appState = new AppState(initialState, 'game', 2)
```

If you want to migrate or "upgrade" the earlier persisted state instead, you can pass a function that will receive the previous state, the new state, and the previous version number, and return the new state for this version.

```ts
const initialState = { wins: 0, losses: 0, score: 0 }

export const appState = new AppState(
  initialState,
  'game',
  2,
  (prev, next, version) => ({
    ...prev,
    score: prev.wins * 10,
  })
)
```

Note that this "upgrade" function will only run when an earlier version is found on the user's machine under the provided key.

### Using Middleware

To use middleware or run side effects when the state changes, override the [`cleanup`](#cleanup) method in your `StateManager` sub-class.

```ts
cleanup = (next, prev, patch) => {
  // Log an ID from the patch?
  if (patch.patchId) {
    logger.log(patch.patchId)
  }

  // Create a JSON patch and update the server?
  const serverPatch = jsonpatch.compare(prev, state)
  server.sendUpdate(clientId, serverPatch)

  return next
}
```

Remember that `cleanup` runs _before_ the new state is passed to the zustand store. Your components will not yet have received the new state.

### Using Snapshots

Depending on your application, you may need to restore data from an earlier state. You can use the `snapshot` property and `setSnapshot` method to make this easier.

For example, if a user is was editing a todo's text, they would likely want to "undo" back to the text as it was before they began editing, and "redo" to the text as it was when they finished editing.

To do this, you would call `setSnapshot` when the user focuses the text input, in order to preserve the state before the user begins typing.

```js
beginEditingTodo = () => {
  this.setSnapshot()
}
```

As the user types, you would call `patchState` in order to change the state without effecting the undo/redo stack.

```js
editTodoText = (id, text) => {
  this.patchState({
    todos: {
      [id]: { text: state.todos[id].text },
    },
  })
}
```

Finally, when the user finishes or blurs the text input, you would call `setState` to create a new command—and in that command, using the `snapshot` info in the command's `before` patch.

```js
finishEditing = (id) => {
  const { state, snapshot } = this

  this.setState({
    before: {
      todos: {
        [id]: { text: snapshot.todos[id].text },
      },
    },
    after: {
      todos: {
        [id]: { text: state.todos[id].text },
      },
    },
  })
}
```

### Testing

You can using a library like [jest](https://jestjs.io/) to test your `rko` state. In addition to testing your React components, you can also test your state in isolation.

One way to test is by importing your `StateManager` sub-class and creating new instances for each test.

```js
// state.test.js

import { MyState } from './state'

describe('My State', () => {
  it('Increments the count (do, undo and redo)', () => {
    const myState = new MyState({ count: 0 })
    myState.adustCount(1)
    expect(myState.state.count).toBe(1)
    myState.undo()
    expect(myState.state.count).toBe(0)
    myState.redo()
    expect(myState.state.count).toBe(1)
  })
})
```

Alternatively, you can import your sub-class instance and use the `reset` method between tests to restore the initial state.

```js
// state.test.js

import { myState } from './state'

describe('My State', () => {
  it('Increments the count', () => {
    myState.adustCount(1)
    expect(myState.state.count).toBe(1)
  })

  it('Decrements the count', () => {
    myState.reset()
    myState.adustCount(-1)
    expect(myState.state.count).toBe(-1)
  })
})
```

### Tips

Your `StateManager` sub-class is a regular class, so feel free to extend it with other properties and methods that your methods can rely on. For example, you might want multiple snapshots, a more complex `status`, or asynchronous behaviors.

### Examples

- [Todo List](https://codesandbox.io/s/rko-example-mf9cx)
- [Tic Tac Toe](https://codesandbox.io/s/tic-tac-toe-j9v1l)
- [perfect-freehand](https://codesandbox.io/s/github/steveruizok/perfect-freehand/tree/main/packages/dev)

## Support

Please [open an issue](https://github.com/steveruizok/rko/issues/new) for support.

## Discussion

Have an idea or casual question? Visit the [discussion page](https://github.com/steveruizok/rko/discussions).

## Author

- [@steveruizok](https://twitter.com/steveruizok)
