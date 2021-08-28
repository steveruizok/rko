export type Patch<T> = Partial<{ [P in keyof T]: Patch<T[P]> }>

export interface Command<T extends object> {
  before: Patch<T>
  after: Patch<T>
}
