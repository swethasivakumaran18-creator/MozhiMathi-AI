import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { LintWarning } from '../types';

export interface LinterHighlighterOptions {
  warnings: LintWarning[];
  onHoverWarning: (warning: LintWarning | null, rect: DOMRect | null, range: { from: number; to: number } | null) => void;
}

export const LinterHighlighter = Extension.create<LinterHighlighterOptions>({
  name: 'linterHighlighter',

  addOptions() {
    return {
      warnings: [],
      onHoverWarning: () => {},
    };
  },

  addProseMirrorPlugins() {
    const extensionThis = this;

    return [
      new Plugin({
        key: new PluginKey('linterHighlighter'),
        props: {
          decorations(state) {
            const { doc } = state;
            const decorations: Decoration[] = [];
            const warnings = extensionThis.options.warnings;

            if (!warnings || warnings.length === 0) {
              return DecorationSet.empty;
            }

            // Find all instances of words inside text nodes
            doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                const text = node.text;

                warnings.forEach((warning) => {
                  const term = warning.original_term;
                  if (!term) return;

                  // Case-insensitive matching for english words, exact for Tamil
                  const isEnglish = /^[a-zA-Z]/.test(term);
                  const searchStr = term.toLowerCase();
                  const nodeTextLower = text.toLowerCase();

                  let index = isEnglish 
                    ? nodeTextLower.indexOf(searchStr)
                    : text.indexOf(term);

                  while (index !== -1) {
                    const start = pos + index;
                    const end = start + term.length;

                    decorations.push(
                      Decoration.inline(start, end, {
                        class: `linter-flagged ${
                          warning.is_verified ? 'linter-verified' : 'linter-ai'
                        }`,
                        'data-term': term,
                        'data-pure': warning.suggested_pure_term,
                        'data-from': start.toString(),
                        'data-to': end.toString(),
                        style: `border-bottom: 2px dashed ${
                          warning.is_verified ? '#10b981' : '#f59e0b'
                        }; background-color: ${
                          warning.is_verified ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)'
                        }; cursor: pointer; position: relative; font-weight: 500; transition: background-color 0.15s ease-in-out;`
                      })
                    );

                    // Find next match
                    index = isEnglish
                      ? nodeTextLower.indexOf(searchStr, index + 1)
                      : text.indexOf(term, index + 1);
                  }
                });
              }
            });

            return DecorationSet.create(doc, decorations);
          },
          handleDOMEvents: {
            mouseover(view, event) {
              const target = event.target as HTMLElement;
              const flaggedSpan = target.closest('.linter-flagged');
              if (flaggedSpan) {
                const term = flaggedSpan.getAttribute('data-term');
                const pure = flaggedSpan.getAttribute('data-pure');
                const from = parseInt(flaggedSpan.getAttribute('data-from') || '0');
                const to = parseInt(flaggedSpan.getAttribute('data-to') || '0');
                
                const warnings = extensionThis.options.warnings;
                const match = warnings.find(w => w.original_term.toLowerCase() === term?.toLowerCase());
                
                if (match) {
                  const rect = flaggedSpan.getBoundingClientRect();
                  extensionThis.options.onHoverWarning(match, rect, { from, to });
                }
              } else {
                // Clear warning when moving mouse to unflagged text nodes or empty paragraphs
                extensionThis.options.onHoverWarning(null, null, null);
              }
              return false;
            },
            mouseleave(view, event) {
              // Clear warning when mouse completely exits the editor view area
              extensionThis.options.onHoverWarning(null, null, null);
              return false;
            }
          }
        },
      }),
    ];
  },
});
