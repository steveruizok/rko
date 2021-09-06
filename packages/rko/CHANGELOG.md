# rko

## 0.5.23

- Adds `replaceHistory` method.
- Makes `pointer` protected rather than private.

## 0.5.21

- Commands will now use the `id` property from the command object as a
  fallback if the id argument is not provided to `setState`.

  ```js
  // `onStateDidChange` will be called with (state, "added_message")
  addMessage(newMessage) {
    this.setState({
      before: { message: this.state.message },
      after: { message: newMessage }
    }, "added_message")
  }

  // `onStateDidChange` will be called with (state, "cleared_message")
  clearMessage() {
    this.setState({
      id: "cleared_message",
      before: { message: this.state.message },
      after: { message: "" }
    })
  }

  // `onStateDidChange` will be called with (state, "flipped_message")
  reverseMessage() {
    this.setState({
      id: "reversed_message",
      before: { message: this.state.message },
      after: { message: [...this.state.message].reverse().join("") }
    }, "flipped_message")
  }
  ```

- Changes `stack` from private to protected. This allows extending
  classes to make the `stack` public if they wish.

  ```tjs
  class Example extends StateManager {
    get history() {
      return this.stack
    }
  }
  ```

## 0.5.20

- Adds the `onReady` method, which is called when the state loads
  persisted data.

## 0.5.19

- Makes the `persist` method `protected` rather than `private`, so that you can manually call persist from sub-class methods.

## 0.5.18

- Fix export bugs related to esm
- Adds `Patch` and `Command` type exports

## 0.5.16

- Adds missing calls to `onStateWillChange` and `onStateDidChange` during `replaceState`.

## 0.5.15

- Adds `onStateWillChange`
- Adds tests for `onStateWillChange`

## 0.5.14

- Adds `onStateDidChange`
- Adds tests for `onStateDidChange`
- Adds `id` to `Command` (optional)
- Adds `id` parameter (optional) to methods that change state
- Fixes return type for `StateManager` methods, now correctly chainable

## 0.5.13

- Updates `resetState` so that it returns to the provided initial state, rather than the restored persisted state.
- Deep copies the initial state (or restored persisted state) to prevent clashes from mutations.
- Adds additional tests.

## 0.5.9

- Improves persistence logic
- Will persist only if an `id` is provided as the second argument of the constructor
- If a version is provided and an earlier version is found, will upgrade if upgrade function is provided, or else replace

## 0.5.8

- Adds `replaceState` method
- Adds tests for `replaceState`
- Adds previous state param to `cleanup` method
