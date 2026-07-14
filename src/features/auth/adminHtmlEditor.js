/**
 * @file features/auth/adminHtmlEditor.js
 * @description CodeMirror-backed HTML editor for admin template forms.
 */

import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { html } from '@codemirror/lang-html';
import { formatHtmlSource } from '../shared/formatHtml.js';

/**
 * Creates / owns a CodeMirror HTML editor mounted next to a textarea.
 */
export class AdminHtmlEditor {
  /**
   * @param {HTMLTextAreaElement | null} textarea
   * @param {{ onChange?: () => void }} [options]
   */
  constructor(textarea, options = {}) {
    this.textarea = textarea;
    /** @type {(() => void) | null} */
    this.onChange = options.onChange ?? null;
    /** @type {EditorView | null} */
    this.view = null;
    /** @type {HTMLElement | null} */
    this.host = null;
  }

  /**
   * Ensure the editor is mounted. Safe to call multiple times.
   */
  mount() {
    if (!this.textarea || this.view) return;

    this.host = document.createElement('div');
    this.host.className = 'admin-html-cm';
    this.host.setAttribute('role', 'textbox');
    this.host.setAttribute('aria-label', 'HTML source editor');
    this.textarea.insertAdjacentElement('afterend', this.host);
    this.textarea.classList.add('admin-html-editor--mirror');
    this.textarea.tabIndex = -1;
    this.textarea.setAttribute('aria-hidden', 'true');

    const sync = EditorView.updateListener.of((update) => {
      if (update.docChanged && this.textarea) {
        this.textarea.value = update.state.doc.toString();
        this.onChange?.();
      }
    });

    this.view = new EditorView({
      parent: this.host,
      state: EditorState.create({
        doc: this.textarea.value || '',
        extensions: [
          basicSetup,
          html(),
          EditorView.lineWrapping,
          sync,
          EditorView.theme({
            '&': {
              fontSize: '0.82rem',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              background: '#0f172a',
              color: '#e2e8f0',
            },
            '.cm-content': {
              fontFamily: "var(--font-mono, ui-monospace, Menlo, Consolas, monospace)",
              minHeight: '280px',
              caretColor: '#f8fafc',
            },
            '.cm-gutters': {
              background: '#0b1220',
              color: '#64748b',
              borderRight: '1px solid #1e293b',
            },
            '.cm-activeLine': { backgroundColor: 'rgba(148, 163, 184, 0.08)' },
            '.cm-activeLineGutter': { backgroundColor: 'rgba(148, 163, 184, 0.08)' },
            '&.cm-focused': {
              outline: '2px solid rgba(79, 70, 229, 0.45)',
              outlineOffset: 1,
            },
          }),
        ],
      }),
    });
  }

  /**
   * @param {string} value
   * @param {{ format?: boolean }} [options]
   */
  setValue(value, options = {}) {
    this.mount();
    const next = options.format === false ? String(value ?? '') : formatHtmlSource(value);
    if (this.textarea) this.textarea.value = next;
    if (!this.view) return;
    this.view.dispatch({
      changes: {
        from: 0,
        to: this.view.state.doc.length,
        insert: next,
      },
    });
  }

  /**
   * @returns {string}
   */
  getValue() {
    if (this.view) return this.view.state.doc.toString();
    return this.textarea?.value ?? '';
  }

  focus() {
    this.view?.focus();
  }

  destroy() {
    this.view?.destroy();
    this.view = null;
    this.host?.remove();
    this.host = null;
    if (this.textarea) {
      this.textarea.classList.remove('admin-html-editor--mirror');
      this.textarea.removeAttribute('aria-hidden');
      this.textarea.tabIndex = 0;
    }
  }
}
