const HAN_PATTERN = /[㐀-䶿一-鿿豈-﫿]/g;
const HAN_SHARE_THRESHOLD = 0.2;

/**
 * The interface language and the content language are independent on this
 * blog: a Chinese note is routinely listed inside an English UI. `<html lang>`
 * therefore cannot describe a post title, and typography keyed off it gets the
 * Chinese runs wrong -- negative tracking fuses Han strokes, Latin leading
 * turns a Han paragraph into a slab, and a screen reader reads it in the wrong
 * voice.
 *
 * Returns the BCP-47 tag to put on the element, or undefined when the run is
 * Latin enough to inherit the page language.
 */
export function contentLang(text?: string | null): string | undefined {
  if (!text) return undefined;

  const hanCount = text.match(HAN_PATTERN)?.length ?? 0;
  if (hanCount === 0) return undefined;

  const significant = text.replace(/\s+/g, "").length || 1;
  return hanCount / significant >= HAN_SHARE_THRESHOLD ? "zh-CN" : undefined;
}

/** Spreadable form: `<h3 {...langAttr(post.title)}>`. */
export function langAttr(text?: string | null): { lang?: string } {
  const lang = contentLang(text);
  return lang ? { lang } : {};
}
