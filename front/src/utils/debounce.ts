export default function debounce<T extends (...args: never[]) => void>(
  func: T,
  delay: number
) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), delay);
  };
}