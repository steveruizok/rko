# rko

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
