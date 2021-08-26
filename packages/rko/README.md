A state manager for React, built on [Zustand](https://github.com/pmndrs/zustand), with built-in undo, redo and persistence.

💜 Consider [becoming a sponsor](https://github.com/sponsors/steveruizok?frequency=recurring&sponsor=steveruizok).

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
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

To use the library, first define your state as a class that extends `StateManager`.

```ts
// state.ts

import { StateManager } from 'rko'

interface State {
  name: string
  count: number
}

class MyState extends StateManager<State> {
  adjustCount = (n: number) =>
    this.setState({
      before: {
        count: this.state.count,
      },
      after: {
        count: this.state.count + n,
      },
    })
}

export const myState = new MyState({
  increment,
})
```

Then use the `useStore` hook to access the state. For more on the `useStore` hook, see zustand's [documentation](https://github.com/pmndrs/zustand#then-bind-your-components-and-thats-it). You can also use your methods (e.g. `increment`) directly, as well as the `StateManager`'s built-in methods (e.g. `undo`, `redo` and `reset`).

```tsx
// app.tsx
import { myState } from './state'

export default function App() {
  const { name } = myState.useStore((s) => s.name)
  const { count } = myState.useStore((s) => s.count)

  return (
    <div>
      <h1>Hello {name}</h1>
      <h2>Count: {count}</h2>
      <button onClick={() => myState.adjustCount(1)}>Increment</button>
      <button onClick={() => myState.adjustCount(-1)}>Decrement</button>
      <button onClick={myState.undo}>Undo</button>
      <button onClick={myState.redo}>Redo</button>
      <button onClick={myState.reset}>Reset</button>
    </div>
  )
}
```

## StateManager API

You can use the `StateManager` class to create a state manager for your app. You will never use `StateManager` directly. Instead, you will extend the `StateManager` class and add methods that use its internal API in order to create a state manager for your particular app.

**Tip**: You can use the `StateManager` class to create a state manager for your app.

### Internal API

In your class definition, you can define methods that update your state using `StateManager`'s internal API.

#### `patchState(patch: Patch<T>)`

Update the state without effecting the undo/redo stack. This method accepts a `Patch` type object, or a "deep partial" of the state object containing only the changes that you wish to make.

Example:

```ts
toggleMenuOpen = () =>
  this.patchState({
    ui: {
      menuOpen: !this.state.ui.menuOpen,
    },
  })
```

#### `setState(command: Command<T>)`

Update the state and push the command to the undo/redo stack. This method accepts a `Command` type object containing two `Patch`es: `before` and `after`. The `after` patch should contain the changes to the state that you wish to make immediately and when the command is "re-done". The `before` patch should contain the changes to make when the command is "undone".

```ts
adjustCount = (n: number) =>
  this.setState({
    before: {
      count: this.state.count,
    },
    after: {
      count: this.state.count + n,
    },
  })
```

#### `cleanup(state: T, patch: Patch<T>)`

The cleanup method is called on every state change, _after_ applying the current patch. It returns the "final" updated state. You can override this method in order to clean up any state that is no longer needed. For example, if you have a state that is a list of items, you can use the cleanup method to remove items that are no longer in the list. Note that the changes won't be present in the undo/redo stack.

```ts
cleanup = (state: T, patch: Patch<T>) => {
  const final = { ...state }

  for (const id in todos) {
    if (!todos[id]) {
      delete final.todos[id]
    }
  }

  return final
}
```

You can also use the `cleanup` method to implement middleware or other functionality that needs to occur on each state change.

### Public API

The `StateManager` class exposes a public API that you can use to interact with your state either from within your class methods or from anywhere in your application.

#### `undo()`

Move backward in history, un-doing the most recent change.

#### `redo()`

Move forward in history, re-doing the previous undone change.

#### `reset()`

Reset the state to its original state. Also reset the history.

#### `resetHistory()`

Reset the state's history.

#### `forceUpdate()`

Force the state to update.

#### `setSnapshot()`

Save the current state to the the `snapshot` property.

### `snapshot`

The saved snapshot. You can use the `snapshot` to restore earlier parts of the state.

### Example

[![Edit undo-redo](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/undo-redo-mf9cx?fontsize=14&hidenavigation=1&theme=dark)

## Support

Please [open an issue](https://github.com/steveruizok/rko/issues/new) for support.

## Discussion

Have an idea or casual question? Visit the [discussion page](https://github.com/steveruizok/rko/discussions).

## Author

- [@steveruizok](https://twitter.com/steveruizok)