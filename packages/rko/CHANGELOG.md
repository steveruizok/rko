# rko

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
