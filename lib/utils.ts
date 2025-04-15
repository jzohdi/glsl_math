export function grab<T>(data: T[]) {
  const next = data[0];
  const rest = data.slice(1);
  return {
    next,
    rest,
  };
}
