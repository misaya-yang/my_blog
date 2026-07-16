export type EditorTextTransform = {
  content: string;
  selectionStart: number;
  selectionEnd: number;
};

export function insertMarkdownBlock(input: {
  content: string;
  selectionStart: number;
  selectionEnd: number;
  prefix: string;
  placeholder?: string;
}): EditorTextTransform {
  const {
    content,
    selectionStart,
    selectionEnd,
    prefix,
    placeholder = "",
  } = input;
  const lineStart = content.lastIndexOf("\n", selectionStart - 1) + 1;
  const lineEndIndex = content.indexOf("\n", selectionEnd);
  const lineEnd = lineEndIndex === -1 ? content.length : lineEndIndex;
  const selectedText = content.slice(selectionStart, selectionEnd);
  const currentLine = content.slice(lineStart, lineEnd);

  if (selectedText) {
    return {
      content: `${content.slice(0, lineStart)}${prefix}${content.slice(lineStart)}`,
      selectionStart: selectionStart + prefix.length,
      selectionEnd: selectionEnd + prefix.length,
    };
  }

  if (currentLine.length > 0) {
    const caret = selectionStart + prefix.length;
    return {
      content: `${content.slice(0, lineStart)}${prefix}${content.slice(lineStart)}`,
      selectionStart: caret,
      selectionEnd: caret,
    };
  }

  const inserted = `${prefix}${placeholder}`;
  return {
    content: `${content.slice(0, lineStart)}${inserted}${content.slice(lineEnd)}`,
    selectionStart: lineStart + prefix.length,
    selectionEnd: lineStart + inserted.length,
  };
}

export function insertMarkdownLink(input: {
  content: string;
  selectionStart: number;
  selectionEnd: number;
  url: string;
  text?: string;
}): EditorTextTransform {
  const { content, selectionStart, selectionEnd, url, text = "" } = input;
  const selectedText = content.slice(selectionStart, selectionEnd);
  const label = text.trim() || selectedText || url;
  const markdown = `[${label}](${url})`;

  return {
    content: `${content.slice(0, selectionStart)}${markdown}${content.slice(selectionEnd)}`,
    selectionStart: selectionStart + 1,
    selectionEnd: selectionStart + 1 + label.length,
  };
}
