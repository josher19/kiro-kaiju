import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';

/**
 * Markdown to HTML rendering service for AI Assistant and Zoom-a-Friend messages
 * Provides secure HTML rendering with syntax highlighting and XSS protection
 */
export class MarkdownService {
  private static instance: MarkdownService;

  private constructor() {
    this.configureMarked();
    this.configureDOMPurify();
  }

  public static getInstance(): MarkdownService {
    if (!MarkdownService.instance) {
      MarkdownService.instance = new MarkdownService();
    }
    return MarkdownService.instance;
  }

  /**
   * Configure marked.js for markdown parsing
   */
  private configureMarked(): void {
    // Configure marked options
    marked.setOptions({
      breaks: true, // Convert line breaks to <br>
      gfm: true, // GitHub Flavored Markdown
    });
  }

  /**
   * Configure DOMPurify for HTML sanitization
   */
  private configureDOMPurify(): void {
    // Configure allowed tags and attributes for safe HTML
    DOMPurify.addHook('beforeSanitizeElements', (node) => {
      // Allow syntax highlighting classes
      const element = node as Element;
      if (element.tagName === 'CODE' || element.tagName === 'PRE') {
        const className = element.getAttribute('class');
        if (className && className.includes('hljs')) {
          // Keep highlight.js classes
          return;
        }
      }
    });
  }

  /**
   * Convert markdown content to sanitized HTML
   * @param markdownContent - Raw markdown content from AI responses
   * @returns Sanitized HTML string safe for rendering
   */
  public renderMarkdownToHtml(markdownContent: string): string {
    if (!markdownContent || typeof markdownContent !== 'string') {
      return '';
    }

    try {
      // Parse markdown to HTML
      const rawHtml = marked.parse(markdownContent) as string;
      
      // Sanitize HTML to prevent XSS attacks
      const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'code', 'pre',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'ul', 'ol', 'li',
          'a', 'blockquote',
          'span', 'div'
        ],
        ALLOWED_ATTR: [
          'href', 'title', 'target', 'rel', 'class'
        ],
        ALLOW_DATA_ATTR: false,
        FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
        FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover']
      });

      return sanitizedHtml;
    } catch (error) {
      console.error('Markdown rendering failed:', error);
      // Return escaped plain text as fallback
      return this.escapeHtml(markdownContent);
    }
  }

  /**
   * Check if content contains markdown formatting
   * @param content - Content to check
   * @returns True if content appears to contain markdown
   */
  public containsMarkdown(content: string): boolean {
    if (!content) return false;

    // Check for common markdown patterns
    const markdownPatterns = [
      /\*\*.*?\*\*/, // Bold
      /\*.*?\*/, // Italic
      /`.*?`/, // Inline code
      /```[\s\S]*?```/, // Code blocks
      /^#{1,6}\s/, // Headers
      /^\s*[-*+]\s/, // Lists
      /^\s*\d+\.\s/, // Numbered lists
      /\[.*?\]\(.*?\)/, // Links
    ];

    return markdownPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Escape HTML characters for safe display
   * @param text - Text to escape
   * @returns HTML-escaped text
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Check if content is JSON (for grading responses that should not be converted)
   * @param content - Content to check
   * @returns True if content appears to be JSON
   */
  public isJsonContent(content: string): boolean {
    if (!content) return false;
    
    const trimmed = content.trim();
    return (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
           (trimmed.startsWith('[') && trimmed.endsWith(']'));
  }

  /**
   * Render message content with appropriate formatting
   * @param content - Raw message content
   * @param forceMarkdown - Force markdown rendering even if content doesn't appear to contain markdown
   * @returns Rendered HTML or escaped plain text
   */
  public renderMessageContent(content: string, forceMarkdown: boolean = false): string {
    if (!content) return '';

    // Don't convert JSON content (grading responses)
    if (this.isJsonContent(content)) {
      return this.escapeHtml(content);
    }

    // Convert markdown to HTML if content contains markdown or forced
    if (forceMarkdown || this.containsMarkdown(content)) {
      return this.renderMarkdownToHtml(content);
    }

    // Return escaped plain text for non-markdown content
    return this.escapeHtml(content);
  }
}

// Export singleton instance
export const markdownService = MarkdownService.getInstance();

// Export convenience functions
export const renderMarkdownToHtml = (content: string): string => {
  return markdownService.renderMarkdownToHtml(content);
};

export const renderMessageContent = (content: string, forceMarkdown: boolean = false): string => {
  return markdownService.renderMessageContent(content, forceMarkdown);
};

export const containsMarkdown = (content: string): boolean => {
  return markdownService.containsMarkdown(content);
};

export const isJsonContent = (content: string): boolean => {
  return markdownService.isJsonContent(content);
};