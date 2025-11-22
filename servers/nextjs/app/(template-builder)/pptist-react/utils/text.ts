export type PlainTextOptions = {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  textAlign: "left" | "center" | "right";
  textBold?: boolean;
  textItalic?: boolean;
  textUnderline?: boolean;
  textStrikethrough?: boolean;
  textHighlight?: string;
  bulletList?: boolean;
  orderedList?: boolean;
  textLink?: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

export const buildHtmlFromPlainText = (text: string, opts: PlainTextOptions) => {
  const {
    fontSize,
    lineHeight,
    letterSpacing,
    textAlign,
    textBold,
    textItalic,
    textUnderline,
    textStrikethrough,
    textHighlight,
    bulletList,
    orderedList,
  } = opts;

  const styleParts = [
    `font-size:${fontSize || 16}px`,
    `line-height:${lineHeight || 1.35}`,
    `letter-spacing:${letterSpacing || 0}px`,
    `text-align:${textAlign}`,
    `font-weight:${textBold ? 700 : 400}`,
    `font-style:${textItalic ? "italic" : "normal"}`,
  ];
  const decorations = [
    textUnderline ? "underline" : "",
    textStrikethrough ? "line-through" : "",
  ].filter(Boolean);
  if (decorations.length) {
    styleParts.push(`text-decoration:${decorations.join(" ")}`);
  }
  if (textHighlight) {
    styleParts.push(`background:${textHighlight}`);
  }

  const safeText = escapeHtml(text || "");
  const lines = safeText.split(/\r?\n/);

  let body = safeText;
  if (bulletList || orderedList) {
    const tag = orderedList ? "ol" : "ul";
    const items = lines
      .map((line) => line.trim())
      .filter((line) => line.length)
      .map((line) => `<li>${line}</li>`)
      .join("");
    body = `<${tag}>${items || "<li></li>"}</${tag}>`;
  } else {
    body = lines.join("<br />");
  }

  const linked =
    textLink && textLink.trim().length
      ? `<a href="${escapeHtml(textLink.trim())}" target="_blank" rel="noopener noreferrer">${body}</a>`
      : body;

  return `<div style="${styleParts.join(";")};">${linked || "<br />"}</div>`;
};

const allowedTags = new Set([
  "b",
  "strong",
  "i",
  "em",
  "u",
  "s",
  "span",
  "br",
  "a",
  "ul",
  "ol",
  "li",
  "p",
]);

const allowedStyles = ["font-weight", "font-style", "text-decoration", "color", "background", "background-color"];

const sanitizeStyle = (style?: string) => {
  if (!style) return "";
  const parts = style.split(";").map((part) => part.trim()).filter(Boolean);
  const safe = parts.filter((part) => {
    const [key] = part.split(":").map((p) => p.trim().toLowerCase());
    return allowedStyles.includes(key);
  });
  return safe.length ? ` style="${safe.join(";")}"` : "";
};

export const sanitizeRichHtml = (html: string) => {
  return html.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (match, tag, attrs) => {
    const lower = tag.toLowerCase();
    if (!allowedTags.has(lower)) return "";
    if (match.startsWith("</")) return `</${lower}>`;
    let cleanAttrs = "";
    if (lower === "a") {
      const hrefMatch = attrs.match(/href\s*=\s*["']([^"']+)["']/i);
      if (hrefMatch) {
        const href = escapeHtml(hrefMatch[1]);
        cleanAttrs += ` href="${href}" target="_blank" rel="noopener noreferrer"`;
      }
    }
    const styleMatch = attrs.match(/style\s*=\s*["']([^"']+)["']/i);
    if (styleMatch) {
      cleanAttrs += sanitizeStyle(styleMatch[1]);
    }
    return `<${lower}${cleanAttrs}>`;
  });
};
