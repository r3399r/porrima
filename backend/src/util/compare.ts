export function compare<T>(
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): (a: T, b: T) => number {
  return (a: T, b: T) => {
    if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return order === 'asc' ? 1 : -1;

    return 0;
  };
}
