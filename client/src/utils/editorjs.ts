/**
 * EditorJS Utilities
 * Helper functions for working with EditorJS content
 */

export interface EditorJSBlock {
  id?: string;
  type: string;
  data: {
    text?: string;
    items?: string[];
    content?: string;
    [key: string]: any;
  };
}

export interface EditorJSData {
  time?: number;
  blocks: EditorJSBlock[];
  version?: string;
}

/**
 * Parse EditorJS JSON string or object
 */
export function parseEditorJS(content: string | EditorJSData | null): EditorJSData | null {
  if (!content) return null;

  try {
    // If already an object, return it
    if (typeof content === 'object') {
      return content;
    }

    // Check if content is the string "[object Object]" (incorrectly stringified)
    if (content === '[object Object]' || content.trim() === '[object Object]') {
      console.warn('EditorJS content was incorrectly stringified as "[object Object]"');
      return null;
    }

    // Try to parse JSON string
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse EditorJS content:', error);
    return null;
  }
}

/**
 * Extract plain text from EditorJS content
 */
export function extractTextFromEditorJS(content: string | EditorJSData | null, maxLength?: number): string {
  const data = parseEditorJS(content);

  if (!data || !data.blocks || data.blocks.length === 0) {
    // If not EditorJS format, return as plain text (fallback)
    if (typeof content === 'string' && !content.startsWith('{')) {
      return maxLength ? content.substring(0, maxLength) : content;
    }
    return '';
  }

  // Extract text from all blocks
  const textParts: string[] = [];

  for (const block of data.blocks) {
    let text = '';

    switch (block.type) {
      case 'paragraph':
      case 'header':
        text = block.data.text || '';
        break;

      case 'list':
        text = (block.data.items || []).join(', ');
        break;

      case 'quote':
        text = `"${block.data.text || ''}"`;
        break;

      case 'code':
        text = block.data.code || '';
        break;

      case 'raw':
        text = block.data.html || '';
        break;

      default:
        // Try to get text from common fields
        text = block.data.text || block.data.content || '';
    }

    // Strip HTML tags
    text = text.replace(/<[^>]*>/g, '');

    if (text) {
      textParts.push(text);
    }
  }

  const fullText = textParts.join(' ');

  if (maxLength && fullText.length > maxLength) {
    return fullText.substring(0, maxLength) + '...';
  }

  return fullText;
}

/**
 * Check if content is EditorJS format
 */
export function isEditorJSContent(content: any): boolean {
  if (!content) return false;

  try {
    const data = typeof content === 'string' ? JSON.parse(content) : content;
    return (
      typeof data === 'object' &&
      Array.isArray(data.blocks) &&
      data.blocks.every((block: any) =>
        typeof block === 'object' &&
        'type' in block &&
        'data' in block
      )
    );
  } catch {
    return false;
  }
}

/**
 * Convert EditorJS content to HTML (simple version)
 */
export function editorJSToHTML(content: string | EditorJSData | null): string {
  const data = parseEditorJS(content);

  if (!data || !data.blocks || data.blocks.length === 0) {
    return '';
  }

  const htmlParts: string[] = [];

  for (const block of data.blocks) {
    switch (block.type) {
      case 'paragraph':
        htmlParts.push(`<p>${block.data.text || ''}</p>`);
        break;

      case 'header':
        const level = block.data.level || 2;
        htmlParts.push(`<h${level}>${block.data.text || ''}</h${level}>`);
        break;

      case 'list':
        const tag = block.data.style === 'ordered' ? 'ol' : 'ul';
        const items = (block.data.items || [])
          .map((item: string) => `<li>${item}</li>`)
          .join('');
        htmlParts.push(`<${tag}>${items}</${tag}>`);
        break;

      case 'quote':
        htmlParts.push(`<blockquote>${block.data.text || ''}</blockquote>`);
        break;

      case 'code':
        htmlParts.push(`<pre><code>${block.data.code || ''}</code></pre>`);
        break;

      case 'delimiter':
        htmlParts.push('<hr />');
        break;

      case 'raw':
        htmlParts.push(block.data.html || '');
        break;

      default:
        // Fallback to paragraph
        const text = block.data.text || block.data.content || '';
        if (text) {
          htmlParts.push(`<p>${text}</p>`);
        }
    }
  }

  return htmlParts.join('');
}
