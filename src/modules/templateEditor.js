/**
 * Template Editor Module
 * CodeMirror-based HTML/CSS editor with column tag insertion
 */
import { EditorView, basicSetup } from 'codemirror';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorState } from '@codemirror/state';

const DEFAULT_EDITOR_OPTIONS = {
  htmlContainerId: 'html-editor-container',
  cssContainerId: 'css-editor-container',
  tagsListId: 'tags-list',
  templateSelectId: 'template-select',
  saveTemplateBtnId: 'btn-save-template',
  tabBtnsSelector: '#step-2 .editor-tabs .tab-btn',
  codeEditorsSelector: '#step-2 .code-editor-wrapper .code-editor',
  defaultTemplateKey: 'default',
};

export class TemplateEditor {
  /**
   * @param {object} templateStore
   * @param {Partial<typeof DEFAULT_EDITOR_OPTIONS>} [options]
   */
  constructor(templateStore, options = {}) {
    this.templateStore = templateStore;
    this.options = { ...DEFAULT_EDITOR_OPTIONS, ...options };
    this.htmlEditor = null;
    this.cssEditor = null;
    this.headers = [];
    this.onContentChange = null;
    this.currentTemplateKey = this.options.defaultTemplateKey;

    this._bindElements();
    this._bindEvents();
    this._initEditors();
  }

  _bindElements() {
    const {
      htmlContainerId,
      cssContainerId,
      tagsListId,
      templateSelectId,
      saveTemplateBtnId,
      tabBtnsSelector,
      codeEditorsSelector,
    } = this.options;

    this.htmlContainer = document.getElementById(htmlContainerId);
    this.cssContainer = document.getElementById(cssContainerId);
    this.tagsList = document.getElementById(tagsListId);
    this.templateSelect = document.getElementById(templateSelectId);
    this.saveTemplateBtn = document.getElementById(saveTemplateBtnId);
    this.tabBtns = document.querySelectorAll(tabBtnsSelector);
    this.codeEditors = document.querySelectorAll(codeEditorsSelector);
  }

  _bindEvents() {
    // Tab switching — scoped to this editor instance only (not document-wide .tab-btn)
    this.tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.tabBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const target = tab === 'css' ? this.cssContainer : this.htmlContainer;
        this.codeEditors.forEach((editor) => {
          editor.classList.toggle('active', editor === target);
        });
      });
    });

    // Template selection
    this.templateSelect?.addEventListener('change', (e) => {
      this.currentTemplateKey = e.target.value;
      this._loadTemplate(this.currentTemplateKey);
    });

    // Save template
    this.saveTemplateBtn?.addEventListener('click', () => {
      const name = prompt('Save template as:', this.currentTemplateKey);
      if (name) {
        this.templateStore.saveTemplate(name, this.getHTML(), this.getCSS());
        window.dispatchEvent(
          new CustomEvent('toast', {
            detail: { message: `Template "${name}" saved!`, type: 'success' },
          })
        );
      }
    });
  }

  _initEditors() {
    const defaultTemplate = this.templateStore.getTemplate(this.options.defaultTemplateKey);

    // HTML Editor
    this.htmlEditor = new EditorView({
      state: EditorState.create({
        doc: defaultTemplate.html,
        extensions: [
          basicSetup,
          html(),
          oneDark,
          EditorView.updateListener.of((update) => {
            if (update.docChanged && this.onContentChange) {
              this.onContentChange();
            }
          }),
          EditorView.theme({
            '&': { height: '100%' },
            '.cm-scroller': { overflow: 'auto' },
          }),
        ],
      }),
      parent: this.htmlContainer,
    });

    // CSS Editor
    this.cssEditor = new EditorView({
      state: EditorState.create({
        doc: defaultTemplate.css,
        extensions: [
          basicSetup,
          css(),
          oneDark,
          EditorView.updateListener.of((update) => {
            if (update.docChanged && this.onContentChange) {
              this.onContentChange();
            }
          }),
          EditorView.theme({
            '&': { height: '100%' },
            '.cm-scroller': { overflow: 'auto' },
          }),
        ],
      }),
      parent: this.cssContainer,
    });
  }

  selectTemplate(key) {
    if (this.templateSelect) this.templateSelect.value = key;
    this.currentTemplateKey = key;
    this._loadTemplate(key);
  }

  _loadTemplate(key) {
    const template = this.templateStore.getTemplate(key);
    this._setEditorContent(this.htmlEditor, template.html);
    this._setEditorContent(this.cssEditor, template.css);
    if (this.onContentChange) this.onContentChange();
  }

  _setEditorContent(editor, content) {
    editor.dispatch({
      changes: {
        from: 0,
        to: editor.state.doc.length,
        insert: content,
      },
    });
  }

  /**
   * Set available CSV column headers and render clickable tags
   */
  setHeaders(headers) {
    this.headers = headers;
    this.tagsList.innerHTML = '';

    headers.forEach((header) => {
      const tag = document.createElement('button');
      tag.className = 'column-tag';
      tag.textContent = `{{${header}}}`;
      tag.title = `Insert {{${header}}} at cursor`;
      tag.addEventListener('click', () => {
        this._insertAtCursor(`{{${header}}}`);
      });
      this.tagsList.appendChild(tag);
    });
  }

  _insertAtCursor(text) {
    const activeTab = Array.from(this.tabBtns).find((btn) => btn.classList.contains('active'));
    const editor = activeTab?.dataset.tab === 'css' ? this.cssEditor : this.htmlEditor;

    const cursor = editor.state.selection.main.head;
    editor.dispatch({
      changes: { from: cursor, insert: text },
      selection: { anchor: cursor + text.length },
    });
    editor.focus();
  }

  getHTML() {
    return this.htmlEditor.state.doc.toString();
  }

  getCSS() {
    return this.cssEditor.state.doc.toString();
  }
}
