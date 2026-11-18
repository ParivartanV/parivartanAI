/**
 * Template Engine for Parivartan Snippet
 * Handles parsing, date/time formatting, and cursor offset calculation
 */

const ParivartanEngine = {
  // Extract all dynamic variables from snippet text
  extractVariables(content) {
    if (!content) return [];
    const vars = [];
    const seen = new Set();
    const regex = /\{([^}]+)\}/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const inner = match[1].trim();

      // Skip system/auto variables
      if (['date', 'time', 'datetime', 'cursor'].includes(inner.toLowerCase())) {
        continue;
      }

      if (inner.startsWith('dropdown:') || inner.startsWith('choice:')) {
        const parts = inner.replace(/^(dropdown|choice):/, '').split('|');
        const key = parts[0].trim();
        const options = parts.slice(1).map(s => s.trim());
        if (!seen.has(key)) {
          seen.add(key);
          vars.push({ key, type: 'dropdown', label: key, options });
        }
      } else {
        const key = inner;
        if (!seen.has(key)) {
          seen.add(key);
          const label = key
            .split(/[_-]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          vars.push({ key, type: 'text', label });
        }
      }
    }
    return vars;
  },

  // Format date with options
  getFormattedDate(format = 'default', offsetDays = 0) {
    const d = new Date();
    if (offsetDays) {
      d.setDate(d.getDate() + offsetDays);
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');

    if (format === 'iso' || format === 'YYYY-MM-DD') return `${year}-${mm}-${dd}`;
    if (format === 'eu' || format === 'DD/MM/YYYY') return `${dd}/${mm}/${year}`;
    if (format === 'us' || format === 'MM/DD/YYYY') return `${mm}/${dd}/${year}`;
    return `${month} ${day}, ${year}`;
  },

  // Format time (12-hour AM/PM or 24-hour)
  getFormattedTime(format = '12h') {
    const d = new Date();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');

    if (format === '24h') {
      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  },

  // Render template and calculate exact cursor placement offset
  renderWithCursor(content, values = {}, settings = {}) {
    if (!content) return { text: '', cursorOffset: -1 };

    let result = content;

    const normalize = (k) => {
      const n = String(k || '').toLowerCase().replace(/[\s_\-]+/g, '');
      const aliases = {
        'ticektid': 'ticketid',
        'customermessge': 'customermessage',
        'enginername': 'engineername',
        'pagecontent': 'pagecontext',
        'resolutionstep': 'resolutionsteps'
      };
      return aliases[n] || n;
    };

    // Replace date with formats
    result = result.replace(/\{date(?::([^}]+))?\}/gi, (match, fmt) => {
      let offset = 0;
      let format = fmt ? fmt.toLowerCase() : 'default';
      if (format.includes('+1d') || format.includes('tomorrow')) offset = 1;
      return this.getFormattedDate(format, offset);
    });

    // Replace time
    result = result.replace(/\{time(?::([^}]+))?\}/gi, (match, fmt) => {
      return this.getFormattedTime(fmt ? fmt.toLowerCase() : '12h');
    });

    // Replace datetime
    result = result.replace(/\{datetime\}/gi, `${this.getFormattedDate()} ${this.getFormattedTime()}`);

    // Replace dropdowns
    result = result.replace(/\{(?:dropdown|choice):([^}|]+)\|([^}]+)\}/g, (match, key, opts) => {
      const normKey = normalize(key);
      for (const k in values) {
        if (normalize(k) === normKey && values[k] !== undefined && values[k] !== '') {
          return values[k];
        }
      }
      return (opts.split('|')[0] || '').trim();
    });

    // Replace user and system variables (including flexible spacing / casing)
    result = result.replace(/\{([a-zA-Z0-9_\- ]+)\}/g, (match, key) => {
      const trimmed = key.trim();
      const normKey = normalize(trimmed);

      // Skip cursor marker for offset calculation
      if (normKey === 'cursor') return match;

      // 1. Search in provided values (exact, case-insensitive, normalized)
      for (const k in values) {
        if (normalize(k) === normKey && values[k] !== undefined && values[k] !== null && String(values[k]).trim() !== '') {
          return String(values[k]);
        }
      }

      // 2. Default fallbacks for well-known variables
      if (['engineername', 'myname'].includes(normKey)) {
        return (settings && settings.defaultAuthor) || 'Support Engineer';
      }
      if (['supporttier'].includes(normKey)) {
        return 'Tier 2 Technical Support';
      }
      if (['name', 'customername'].includes(normKey)) {
        return 'there';
      }
      if (['ticketid'].includes(normKey)) {
        return '#Ticket';
      }
      if (['resolutionsteps'].includes(normKey)) {
        return '1. Investigated root cause.\n2. Applied mitigation.\n3. Verified service restored.';
      }

      return match;
    });

    // Locate cursor marker (case-insensitive, handles optional spaces e.g. {cursor}, {Cursor}, { cursor })
    const cursorRegex = /\{\s*cursor\s*\}/i;
    const cursorMatch = cursorRegex.exec(result);
    let finalCursorOffset = -1;

    if (cursorMatch) {
      finalCursorOffset = cursorMatch.index;
      result = result.substring(0, cursorMatch.index) + result.substring(cursorMatch.index + cursorMatch[0].length);
    }

    result = result.replace(/\{\s*cursor\s*\}/gi, '');

    return {
      text: result,
      cursorOffset: finalCursorOffset
    };
  },

  // Standard render (returns text only)
  render(content, values = {}, settings = {}) {
    return this.renderWithCursor(content, values, settings).text;
  },

  // Dedicated helper to extract AI Prompt template variables
  extractAiPromptVariables(template) {
    if (!template) return [];
    const vars = [];
    const seen = new Set();
    const regex = /\{([a-zA-Z0-9_\- ]+)\}/g;
    let match;
    while ((match = regex.exec(template)) !== null) {
      const key = match[1].trim();
      const lower = key.toLowerCase().replace(/[\s_\-]+/g, '');
      if (!seen.has(lower)) {
        seen.add(lower);
        vars.push(key);
      }
    }
    return vars;
  },

  // Dedicated helper to resolve AI Prompt variables with validation
  resolveAiPrompt(template, values = {}, fallbackDefaults = {}) {
    if (!template) return { resolvedText: '', missingVariables: [] };

    const normalize = (k) => {
      const n = String(k || '').toLowerCase().replace(/[\s_\-]+/g, '');
      const aliases = {
        'ticektid': 'ticketid',
        'customermessge': 'customermessage',
        'enginername': 'engineername',
        'pagecontent': 'pagecontext',
        'resolutionstep': 'resolutionsteps'
      };
      return aliases[n] || n;
    };

    const detected = this.extractAiPromptVariables(template);
    const missing = [];
    let resolved = template;

    detected.forEach(varKey => {
      const targetNorm = normalize(varKey);
      let val = undefined;

      // 1. Search in provided values (exact, case-insensitive, normalized)
      for (const k in values) {
        if (normalize(k) === targetNorm && values[k] !== undefined && values[k] !== null && String(values[k]).trim() !== '') {
          val = String(values[k]);
          break;
        }
      }
      // 2. Search in fallback defaults (exact, case-insensitive, normalized)
      if (val === undefined) {
        for (const k in fallbackDefaults) {
          if (normalize(k) === targetNorm && fallbackDefaults[k] !== undefined && fallbackDefaults[k] !== null && String(fallbackDefaults[k]).trim() !== '') {
            val = String(fallbackDefaults[k]);
            break;
          }
        }
      }

      if (val !== undefined) {
        const escapedVarKey = varKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        resolved = resolved.replace(new RegExp('\\{' + escapedVarKey + '\\}', 'gi'), val);
      } else {
        missing.push(varKey);
      }
    });

    return { resolvedText: resolved, missingVariables: missing };
  },

  /**
   * High-fidelity Markdown to Visual Rich HTML Renderer
   * Renders bold, italic, headers, bullet/numbered lists, inline code, code blocks, and links.
   * @param {string} markdown
   * @returns {string} Sanitized, formatted HTML string
   */
  renderMarkdownToHtml(markdown) {
    if (!markdown) return '';
    let text = String(markdown).replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 1. Extract and preserve code blocks
    const codeBlocks = [];
    text = text.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (match, lang, code) => {
      const placeholder = '@@@CODE_BLOCK_' + codeBlocks.length + '@@@';
      codeBlocks.push({ lang: lang || '', code: code.trim() });
      return placeholder;
    });

    // 2. Extract and preserve inline code
    const inlineCodes = [];
    text = text.replace(/`([^`\n]+)`/g, (match, code) => {
      const placeholder = '@@@INLINE_CODE_' + inlineCodes.length + '@@@';
      inlineCodes.push(code);
      return placeholder;
    });

    // 3. Escape HTML entities
    text = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Inline formatting helper
    function formatInline(str) {
      if (!str) return '';
      let s = str;

      // Decode escaped basic formatting tags so raw HTML works seamlessly alongside markdown
      s = s.replace(/&lt;b&gt;([\s\S]*?)&lt;\/b&gt;/gi, '<strong class="pv-md-bold">$1</strong>');
      s = s.replace(/&lt;strong&gt;([\s\S]*?)&lt;\/strong&gt;/gi, '<strong class="pv-md-bold">$1</strong>');
      s = s.replace(/&lt;i&gt;([\s\S]*?)&lt;\/i&gt;/gi, '<em class="pv-md-italic">$1</em>');
      s = s.replace(/&lt;em&gt;([\s\S]*?)&lt;\/em&gt;/gi, '<em class="pv-md-italic">$1</em>');
      s = s.replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi, '<u style="text-decoration:underline;">$1</u>');

      // Bold + Italic
      s = s.replace(/\*\*\*([\s\S]+?)\*\*\*/g, '<strong class="pv-md-bold"><em class="pv-md-italic">$1</em></strong>');
      s = s.replace(/___([\s\S]+?)___/g, '<strong class="pv-md-bold"><em class="pv-md-italic">$1</em></strong>');

      // Bold (**bold** or __bold__)
      s = s.replace(/\*\*([\s\S]+?)\*\*/g, '<strong class="pv-md-bold">$1</strong>');
      s = s.replace(/__([\s\S]+?)__/g, '<strong class="pv-md-bold">$1</strong>');

      // Italic (*italic* or _italic_)
      s = s.replace(/(^|[^\*])\*([^\*\n]+)\*([^\*]|$)/g, '$1<em class="pv-md-italic">$2</em>$3');
      s = s.replace(/(^|[\s(])_([^_\n]+)_([\s).,!?:;]|$)/g, '$1<em class="pv-md-italic">$2</em>$3');

      // Markdown links [label](url)
      s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="pv-md-link">$1</a>');
      // Auto-link naked URLs
      s = s.replace(/(^|[^"'\x27=])(https?:\/\/[^\s<)\n]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer" class="pv-md-link">$2</a>');
      return s;
    }

    // 4. Block-level parsing
    const lines = text.split('\n');
    const htmlParts = [];
    let listStack = [];
    let currentParagraph = [];

    function closeAllLists() {
      while (listStack.length > 0) {
        const tag = listStack.pop();
        htmlParts.push('</' + tag + '>');
      }
    }

    function flushParagraph() {
      if (currentParagraph.length > 0) {
        const pText = currentParagraph.join('<br>');
        htmlParts.push('<p class="pv-md-p">' + formatInline(pText) + '</p>');
        currentParagraph = [];
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      if (!trimmed) {
        flushParagraph();
        closeAllLists();
        continue;
      }

      if (trimmed.startsWith('@@@CODE_BLOCK_')) {
        flushParagraph();
        closeAllLists();
        htmlParts.push(trimmed);
        continue;
      }

      if (/^(?:---|\*\*\*|___)$/.test(trimmed)) {
        flushParagraph();
        closeAllLists();
        htmlParts.push('<hr class="pv-md-hr" />');
        continue;
      }

      const hMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (hMatch) {
        flushParagraph();
        closeAllLists();
        const level = hMatch[1].length;
        const tagNum = Math.min(level + 1, 6);
        htmlParts.push('<h' + tagNum + ' class="pv-md-h' + level + '">' + formatInline(hMatch[2]) + '</h' + tagNum + '>');
        continue;
      }

      const bqMatch = trimmed.match(/^>\s*(.*)$/);
      if (bqMatch) {
        flushParagraph();
        closeAllLists();
        htmlParts.push('<blockquote class="pv-md-quote">' + formatInline(bqMatch[1]) + '</blockquote>');
        continue;
      }

      const ulMatch = rawLine.match(/^(\s*)(?:[\*\-\+]|•)\s+(.*)$/);
      const olMatch = rawLine.match(/^(\s*)(\d+)[\.\)]\s+(.*)$/);

      if (ulMatch || olMatch) {
        flushParagraph();
        const isUl = !!ulMatch;
        const tag = isUl ? 'ul' : 'ol';
        const indentSpaces = (ulMatch || olMatch)[1].length;
        const itemContent = formatInline((ulMatch || olMatch)[2] || (ulMatch || olMatch)[3]);

        if (listStack.length === 0) {
          listStack.push(tag);
          htmlParts.push('<' + tag + ' class="pv-md-' + tag + '">');
        } else if (listStack[listStack.length - 1] !== tag && indentSpaces === 0) {
          closeAllLists();
          listStack.push(tag);
          htmlParts.push('<' + tag + ' class="pv-md-' + tag + '">');
        }

        const indentClass = indentSpaces >= 2 ? ' pv-md-li-nested' : '';
        htmlParts.push('<li class="pv-md-li' + indentClass + '">' + itemContent + '</li>');
        continue;
      }

      if (listStack.length > 0 && rawLine.match(/^\s{2,}\S/)) {
        htmlParts.push('<div class="pv-md-li-sub">' + formatInline(trimmed) + '</div>');
        continue;
      }

      closeAllLists();
      currentParagraph.push(trimmed);
    }

    flushParagraph();
    closeAllLists();

    let finalHtml = htmlParts.join('');

    // Restore inline codes
    inlineCodes.forEach((code, idx) => {
      const safeCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      finalHtml = finalHtml.replace('@@@INLINE_CODE_' + idx + '@@@', '<code class="pv-md-code">' + safeCode + '</code>');
    });

    // Restore code blocks
    codeBlocks.forEach((b, idx) => {
      const safeCode = b.code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const langBadge = b.lang ? '<span class="pv-md-code-lang">' + b.lang + '</span>' : '';
      const blockHtml = '<div class="pv-md-code-wrap">' + langBadge + '<pre class="pv-md-pre"><code class="pv-md-code-block">' + safeCode + '</code></pre></div>';
      finalHtml = finalHtml.replace('@@@CODE_BLOCK_' + idx + '@@@', blockHtml);
    });

    return finalHtml;
  }
};

if (typeof window !== 'undefined') {
  window.ParivartanEngine = ParivartanEngine;
  window.PariwartanEngine = ParivartanEngine; // Compatibility alias
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ParivartanEngine;
}
