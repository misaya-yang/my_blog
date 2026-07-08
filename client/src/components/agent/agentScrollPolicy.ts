export function isAgentNearBottom(
  element:
    | Pick<HTMLElement, "scrollHeight" | "scrollTop" | "clientHeight">
    | null
    | undefined,
  threshold = 96
) {
  if (!element) return true;
  return (
    element.scrollHeight - element.scrollTop - element.clientHeight <= threshold
  );
}
