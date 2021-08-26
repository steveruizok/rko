/**
 * Negate a vector.
 * @param A
 */
export function neg(A: number[]) {
  return [-A[0], -A[1]]
}

/**
 * Add vectors.
 * @param A
 * @param B
 */
export function add(A: number[], B: number[]) {
  return [A[0] + B[0], A[1] + B[1]]
}

/**
 * Subtract vectors.
 * @param A
 * @param B
 */
export function sub(A: number[], B: number[]) {
  return [A[0] - B[0], A[1] - B[1]]
}

/**
 * Get the vector from vectors A to B.
 * @param A
 * @param B
 */
export function vec(A: number[], B: number[]) {
  // A, B as vectors get the vector from A to B
  return [B[0] - A[0], B[1] - A[1]]
}

/**
 * Vector multiplication by scalar
 * @param A
 * @param n
 */
export function mul(A: number[], n: number) {
  return [A[0] * n, A[1] * n]
}

/**
 * Vector division by scalar.
 * @param A
 * @param n
 */
export function div(A: number[], n: number) {
  return [A[0] / n, A[1] / n]
}

/**
 * Perpendicular rotation of a vector A
 * @param A
 */
export function per(A: number[]) {
  return [A[1], -A[0]]
}

/**
 * Dot product
 * @param A
 * @param B
 */
export function dpr(A: number[], B: number[]) {
  return A[0] * B[0] + A[1] * B[1]
}

/**
 * Length of the vector
 * @param A
 */
export function len(A: number[]) {
  return Math.hypot(A[0], A[1])
}

/**
 * Length of the vector squared
 * @param A
 */
export function len2(A: number[]) {
  return A[0] * A[0] + A[1] * A[1]
}

/**
 * Dist length from A to B squared.
 * @param A
 * @param B
 */
export function dist2(A: number[], B: number[]) {
  return len2(sub(A, B))
}

/**
 * Get normalized / unit vector.
 * @param A
 */
export function uni(A: number[]) {
  return div(A, len(A))
}

/**
 * Dist length from A to B
 * @param A
 * @param B
 */
export function dist(A: number[], B: number[]) {
  return Math.hypot(A[1] - B[1], A[0] - B[0])
}

/**
 * Mean between two vectors or mid vector between two vectors
 * @param A
 * @param B
 */
export function med(A: number[], B: number[]) {
  return mul(add(A, B), 0.5)
}

/**
 * Rotate a vector around another vector by r (radians)
 * @param A vector
 * @param C center
 * @param r rotation in radians
 */
export function rotAround(A: number[], C: number[], r: number) {
  const s = Math.sin(r)
  const c = Math.cos(r)

  const px = A[0] - C[0]
  const py = A[1] - C[1]

  const nx = px * c - py * s
  const ny = px * s + py * c

  return [nx + C[0], ny + C[1]]
}

/**
 * Interpolate vector A to B with a scalar t
 * @param A
 * @param B
 * @param t scalar
 */
export function lrp(A: number[], B: number[], t: number) {
  return add(A, mul(vec(A, B), t))
}

//  isLeft: >0 for counterclockwise
//          =0 for none (degenerate)
//          <0 for clockwise
export function isLeft(p1: number[], pc: number[], p2: number[]) {
  return (pc[0] - p1[0]) * (p2[1] - p1[1]) - (p2[0] - p1[0]) * (pc[1] - p1[1])
}

export function clockwise(p1: number[], pc: number[], p2: number[]) {
  return isLeft(p1, pc, p2) > 0
}

export function isEqual(a: number[], b: number[]) {
  return a[0] === b[0] && a[1] === b[1]
}
