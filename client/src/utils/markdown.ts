/** Simple markdown to HTML — handles ##, **bold**, `code`, - lists, • lists */
export function renderMarkdown(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();

      // ## Headings
      if (trimmed.startsWith('## ')) {
        const content = trimmed.slice(3);
        return `<div class="text-base font-semibold text-white mb-2">${content}</div>`;
      }
      if (trimmed.startsWith('# ')) {
        const content = trimmed.slice(2);
        return `<div class="text-lg font-semibold text-white mb-2">${content}</div>`;
      }

      // Inline formatting
      let html = line
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
        .replace(/`(.+?)`/g, '<code class="bg-border/30 px-1.5 py-0.5 rounded text-accent text-xs">$1</code>');

      // Bullet list items (-, •, ●)
      const bulletMatch = html.match(/^(\s*)([-•●])\s+(.*)$/);
      if (bulletMatch) {
        const indent = bulletMatch[1].length;
        const content = bulletMatch[3];
        const ml = indent > 0 ? 'ml-5' : 'ml-1';
        return `<div class="flex items-start gap-2 ${ml} my-0.5"><span class="text-muted/60 mt-[7px] text-[6px]">●</span><span>${content}</span></div>`;
      }

      // Lines that are just a bold name (repo headers from raw summary)
      if (html.match(/^<strong[^>]*>.+<\/strong>$/)) {
        return `<div class="font-semibold text-white mt-4 mb-1 first:mt-0">${html}</div>`;
      }

      if (trimmed === '') return '<div class="h-2"></div>';

      return `<div>${html}</div>`;
    })
    .join('');
}
