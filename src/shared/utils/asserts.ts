export function assertDefined<T>(value: T | null | undefined): asserts value is T {
  if (value == null) throw new Error(`Variable is undefined or null.`);
}
