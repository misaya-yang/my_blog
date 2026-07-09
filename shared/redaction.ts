const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const IPV4_PATTERN = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;

export function redactDirectContact(value: string) {
  return value
    .replace(EMAIL_PATTERN, "[redacted-email]")
    .replace(IPV4_PATTERN, "[redacted-ip]");
}
