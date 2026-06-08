import type { Page } from "playwright";

export async function generateMarkdown(page: Page): Promise<string> {
  const raw = await page.evaluate(() => {
    const REMOVE_SELS = [
      'script','style','noscript','nav','header','footer','aside',
      '[role="navigation"]','[role="banner"]','[role="contentinfo"]','[aria-hidden="true"]'
    ];
    const body = document.body.cloneNode(true) as HTMLElement;
    for (const sel of REMOVE_SELS) {
      body.querySelectorAll(sel).forEach(el => el.remove());
    }

    function walk(node: Node): string {
      if (node.nodeType === 3) return node.textContent || '';
      if (node.nodeType !== 1) return '';
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      const children = () => Array.from(el.childNodes).map(n => walk(n)).join('');
      switch (tag) {
        case 'h1': return `\n# ${children().trim()}\n\n`;
        case 'h2': return `\n## ${children().trim()}\n\n`;
        case 'h3': return `\n### ${children().trim()}\n\n`;
        case 'h4': return `\n#### ${children().trim()}\n\n`;
        case 'h5': return `\n##### ${children().trim()}\n\n`;
        case 'h6': return `\n###### ${children().trim()}\n\n`;
        case 'p': return `\n${children().trim()}\n\n`;
        case 'br': return '\n';
        case 'hr': return '\n---\n\n';
        case 'strong': case 'b': return `**${children()}**`;
        case 'em': case 'i': return `*${children()}*`;
        case 'code': return el.closest('pre') ? children() : `\`${children()}\``;
        case 'pre': return `\n\`\`\`\n${el.textContent?.trim() ?? ''}\n\`\`\`\n\n`;
        case 'blockquote': return `\n> ${children().trim().replace(/\n/g, '\n> ')}\n\n`;
        case 'a': {
          const href = el.getAttribute('href') || '';
          const text = children().trim();
          return href && text ? `[${text}](${href})` : text;
        }
        case 'img': {
          const alt = (el.getAttribute('alt') ?? '').trim();
          return alt ? `![${alt}]` : '';
        }
        case 'ul': case 'ol': return `\n${children()}\n`;
        case 'li': {
          const prefix = el.parentElement?.tagName.toLowerCase() === 'ol' ? '1. ' : '- ';
          return `${prefix}${children().trim()}\n`;
        }
        default: return children();
      }
    }

    return walk(body).trim().replace(/\n{3,}/g, '\n\n');
  });
  return raw.slice(0, 20000);
}
