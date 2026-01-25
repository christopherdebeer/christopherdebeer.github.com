import React from 'react'
import { Backlinks } from './Backlinks.js'
import { BacklinkItem, PageMeta, STATUS_LABELS, Status } from './types.js'

interface PageProps {
  title: string
  content: string
  meta: PageMeta
  slug: string
  backlinks: BacklinkItem[]
}

export function Page({ title, content, meta, slug, backlinks }: PageProps) {
  const status = (meta.status || 'seedling') as Status
  const statusLabel = STATUS_LABELS[status]
  const srcPath = `docs/${slug}.md`

  // Don't link log pages to themselves
  const isLogPage = slug.startsWith('log/')

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link rel="stylesheet" href="/assets/styles.css" />
      </head>
      <body>
        <header className="site-header">
          <a href="/" className="site-name">Garden</a>
        </header>
        <main className="page">
          <article>
            <h1>
              <span className={`status-indicator ${status}`}>{statusLabel}</span>
              {title}
            </h1>
            <div className="meta">
              {meta.created && (
                <span className="meta-date">
                  {isLogPage ? (
                    meta.created
                  ) : (
                    <a href={`/log/${meta.created}.html`}>{meta.created}</a>
                  )}
                </span>
              )}
              {meta.updated && meta.updated !== meta.created && (
                <span className="meta-updated">
                  {' · updated '}
                  {isLogPage ? (
                    meta.updated
                  ) : (
                    <a href={`/log/${meta.updated}.html`}>{meta.updated}</a>
                  )}
                </span>
              )}
            </div>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </article>
          <Backlinks links={backlinks} />
        </main>
        <footer className="site-footer">
          <a href={`/edit.html?file=${srcPath}`}>Edit</a>
        </footer>
        {/* Client-side viewers and CodeMirror */}
        <script type="module" dangerouslySetInnerHTML={{ __html: `
          // Language mapping for CodeMirror
          const langMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'jsx': 'javascript',
            'tsx': 'typescript',
            'py': 'python',
            'rb': 'python', // fallback
            'sh': 'shell',
            'bash': 'shell',
            'zsh': 'shell',
            'yml': 'yaml',
            'md': 'markdown',
            'json': 'json',
            'html': 'html',
            'css': 'css',
            'sql': 'sql',
          };

          // Initialize CodeMirror for code blocks
          const codeBlocks = document.querySelectorAll('.cm-code');
          if (codeBlocks.length > 0) {
            Promise.all([
              import('https://esm.sh/@codemirror/view@6'),
              import('https://esm.sh/@codemirror/state@6'),
              import('https://esm.sh/@codemirror/language@6'),
              import('https://esm.sh/@codemirror/lang-javascript@6'),
              import('https://esm.sh/@codemirror/lang-python@6'),
              import('https://esm.sh/@codemirror/lang-html@6'),
              import('https://esm.sh/@codemirror/lang-css@6'),
              import('https://esm.sh/@codemirror/lang-json@6'),
              import('https://esm.sh/@codemirror/lang-markdown@6'),
              import('https://esm.sh/@codemirror/lang-sql@6'),
              import('https://esm.sh/@codemirror/lang-yaml@6'),
            ]).then(([view, state, language, jsLang, pyLang, htmlLang, cssLang, jsonLang, mdLang, sqlLang, yamlLang]) => {
              const { EditorView, lineNumbers } = view;
              const { EditorState } = state;
              const { syntaxHighlighting, defaultHighlightStyle } = language;

              const langs = {
                javascript: jsLang.javascript,
                typescript: () => jsLang.javascript({ typescript: true }),
                python: pyLang.python,
                html: htmlLang.html,
                css: cssLang.css,
                json: jsonLang.json,
                markdown: mdLang.markdown,
                sql: sqlLang.sql,
                yaml: yamlLang.yaml,
                shell: () => [], // no shell lang, use plain
              };

              codeBlocks.forEach(block => {
                const pre = block.querySelector('pre');
                const code = block.querySelector('code');
                if (!pre || !code) return;

                const content = code.textContent || '';
                const dataLang = block.dataset.lang || '';
                const langKey = langMap[dataLang] || dataLang;
                const langFn = langs[langKey];

                const extensions = [
                  EditorView.editable.of(false),
                  EditorState.readOnly.of(true),
                  lineNumbers(),
                  syntaxHighlighting(defaultHighlightStyle),
                  EditorView.theme({
                    '&': { fontSize: '0.875rem' },
                    '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.5' },
                    '.cm-gutters': { background: 'var(--bg)', borderRight: '1px solid var(--border)', color: 'var(--fg-muted)' },
                    '.cm-content': { padding: 'var(--space-2) 0' },
                    '.cm-line': { padding: '0 var(--space-3)' },
                  }),
                ];

                if (langFn) {
                  try {
                    extensions.push(langFn());
                  } catch (e) {
                    // Language not supported, continue without
                  }
                }

                const editorState = EditorState.create({
                  doc: content,
                  extensions,
                });

                // Replace pre with CodeMirror
                pre.style.display = 'none';
                const editorDiv = document.createElement('div');
                editorDiv.className = 'cm-editor-wrapper';
                block.appendChild(editorDiv);

                new EditorView({
                  state: editorState,
                  parent: editorDiv,
                });
              });
            }).catch(err => {
              console.warn('CodeMirror failed to load, falling back to plain code', err);
            });
          }

          // Mermaid diagrams
          const mermaidBlocks = document.querySelectorAll('.viewer-mermaid');
          if (mermaidBlocks.length > 0) {
            import('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs')
              .then(({ default: mermaid }) => {
                mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
                mermaidBlocks.forEach(async (block, i) => {
                  const source = block.querySelector('.viewer-source');
                  const target = block.querySelector('.viewer-target');
                  if (source && target) {
                    const { svg } = await mermaid.render('mermaid-' + i, source.textContent);
                    target.innerHTML = svg;
                  }
                });
              });
          }
        `}} />
      </body>
    </html>
  )
}
