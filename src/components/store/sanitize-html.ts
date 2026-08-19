// Simple regex sanitizer for CMS richText blocks (docs/architecture.md §4: "richText (html —
// sanitized, produced by a simple textarea/markdown-lite editor)"). Not a full HTML sanitizer —
// the cms slice owns the editor and constrains authoring to trusted org admins; this is a
// defense-in-depth strip of the obviously dangerous bits before dangerouslySetInnerHTML.

/** Strips <script> tags, inline event handlers, and javascript: URLs from admin-authored HTML. */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return ''

  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script\b[^>]*\/?>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*"(?:[^"\\]|\\.)*"/gi, '')
    .replace(/\son\w+\s*=\s*'(?:[^'\\]|\\.)*'/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"')
}
