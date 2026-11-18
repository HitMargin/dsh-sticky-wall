/**
 * Client half of the sticky-wall bundle: a global panel entry in the left
 * sidebar and the wall page it opens in the center column. Notes live in this
 * browser's local storage, so they survive reloads without a Host record.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-sticky-wall',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useCallback, useEffect, useRef, useState } = React;

    const NS = 'sticky-wall';
    const PANEL_ID = 'sticky-wall';
    const STORAGE_KEY = 'dsh.sticky-wall.v1';
    const MAX_TEXT = 2000;

    /** Note accents: a tint over the theme surface keeps both themes readable. */
    const PALETTE = [
      { id: 'amber', ink: '#c18512' },
      { id: 'rose', ink: '#d24a70' },
      { id: 'mint', ink: '#1f9661' },
      { id: 'sky', ink: '#2c7cbd' },
      { id: 'lilac', ink: '#7a63c9' },
    ];

    const zh = {
      panel: '便签墙',
      title: '便签墙',
      subtitle: '随手记下想法，按颜色区分。便签保存在这台电脑的浏览器里，刷新和重启都不会丢。',
      create: '新建便签',
      countOne: '张便签',
      countMany: '张便签',
      emptyTitle: '还没有便签',
      emptyBody: '点“新建便签”写下第一条，它会一直贴在这里。',
      placeholder: '写点什么…',
      noteText: '便签内容',
      deleteNote: '删除便签',
      undo: '撤销',
      removedPrefix: '已删除',
      colorGroup: '便签颜色',
      'color.amber': '琥珀',
      'color.rose': '玫红',
      'color.mint': '薄荷',
      'color.sky': '天蓝',
      'color.lilac': '丁香',
      hint: '新建便签',
      storageFailed: '无法写入本机存储，便签只在当前页面有效，刷新后会丢失。',
      updated: '更新于',
    };

    const en = {
      panel: 'Sticky wall',
      title: 'Sticky wall',
      subtitle: 'Jot quick notes and tell them apart by colour. Notes are stored in this browser on this computer, so they survive reloads and restarts.',
      create: 'New note',
      countOne: 'note',
      countMany: 'notes',
      emptyTitle: 'No notes yet',
      emptyBody: 'Choose New note to write the first one. It stays right here.',
      placeholder: 'Write something…',
      noteText: 'Note text',
      deleteNote: 'Delete note',
      undo: 'Undo',
      removedPrefix: 'Deleted',
      colorGroup: 'Note colour',
      'color.amber': 'Amber',
      'color.rose': 'Rose',
      'color.mint': 'Mint',
      'color.sky': 'Sky',
      'color.lilac': 'Lilac',
      hint: 'creates a note',
      storageFailed: 'This browser refused the local storage write, so notes last only until this page reloads.',
      updated: 'Updated',
    };

    const STYLE_TEXT = `
.dsw-sticky-page { position: relative; display: flex; flex-direction: column; width: 100%; height: 100%; min-width: 0; min-height: 0; overflow: hidden; color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-base); font-size: 14px; line-height: 1.6; }
.dsw-sticky-scroll { flex: 1; min-height: 0; overflow: auto; scrollbar-gutter: stable; --dsh-scrollbar-width: 9px; --dsh-scrollbar-thumb-border: 2px; }
.dsw-sticky-content { max-width: 960px; margin: 0 auto; padding: 28px clamp(24px, 4vw, 48px) 56px; }
html[data-platform='darwin'] .dsw-sticky-content { padding-top: calc(28px + var(--dsh-frame-top-clearance, 0px)); }
.dsw-sticky-heading { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 16px 24px; margin-bottom: 20px; }
.dsw-sticky-heading-text { min-width: 0; }
.dsw-sticky-title-row { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.dsw-sticky-title-row h1 { margin: 0; font-size: 20px; line-height: 28px; font-weight: 500; }
.dsw-sticky-count { color: var(--dsw-alias-label-tertiary); font-size: 13px; line-height: 20px; white-space: nowrap; }
.dsw-sticky-subtitle { max-width: 62ch; margin: 4px 0 0; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 20px; }
.dsw-sticky-heading-actions { display: flex; flex: none; align-items: center; gap: 8px; }
.dsw-sticky-primary { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 14px 0 12px; border: 0; border-radius: 16px; background: var(--dsw-alias-brand-primary); color: var(--dsw-alias-label-primary-foreground); font: inherit; font-size: 13px; line-height: 20px; white-space: nowrap; cursor: pointer; }
.dsw-sticky-primary:hover { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 86%, var(--dsw-alias-label-primary)); }
.dsw-sticky-primary svg { flex: none; }
.dsw-sticky-warning { margin: 0 0 16px; padding: 10px 12px; border-radius: 10px; background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, var(--dsw-alias-bg-layer-1)); color: var(--dsw-alias-state-warn-primary); font-size: 12px; line-height: 20px; }
.dsw-sticky-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); align-items: start; gap: 16px; margin: 0; padding: 0; list-style: none; }
.dsw-sticky-note { --note-surface: color-mix(in srgb, var(--note-ink) 9%, var(--dsw-alias-bg-layer-1)); position: relative; display: flex; flex-direction: column; gap: 8px; min-width: 0; padding: 14px 14px 10px; border: 0.5px solid var(--dsw-alias-border-l3); border-radius: 16px; background: var(--note-surface); overflow: hidden; }
.dsw-sticky-note:focus-within { border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary) 55%, var(--dsw-alias-border-l3)); box-shadow: 0 0 0 1px color-mix(in srgb, var(--dsw-alias-state-business-primary) 28%, transparent); }
.dsw-sticky-note::before { content: ''; position: absolute; top: 0; right: 0; left: 0; height: 3px; background: var(--note-ink); opacity: 0.7; }
.dsw-sticky-note-input { box-sizing: border-box; width: 100%; min-height: 104px; max-height: 320px; margin: 0; padding: 0; border: 0; outline: 0; background: transparent; color: var(--dsw-alias-label-primary); font: inherit; font-size: 14px; line-height: 22px; resize: vertical; field-sizing: content; overflow: auto; --dsh-scrollbar-width: 9px; --dsh-scrollbar-thumb-border: 2px; }
.dsw-sticky-note-input::placeholder { color: var(--dsw-alias-label-caption); }
.dsw-sticky-note-input:focus { outline: none; }
.dsw-sticky-note-foot { display: flex; align-items: center; flex-wrap: wrap; gap: 2px 6px; margin-top: auto; }
.dsw-sticky-swatches { display: inline-flex; align-items: center; gap: 0; }
.dsw-sticky-swatch { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 50%; background: transparent; cursor: pointer; }
.dsw-sticky-swatch-dot { width: 13px; height: 13px; border-radius: 50%; background: var(--swatch-ink); opacity: 0.45; transition: opacity 0.15s, box-shadow 0.15s; }
.dsw-sticky-swatch:hover .dsw-sticky-swatch-dot { opacity: 0.8; }
.dsw-sticky-swatch-active .dsw-sticky-swatch-dot { opacity: 1; box-shadow: 0 0 0 2px var(--note-surface), 0 0 0 3.5px var(--swatch-ink); }
.dsw-sticky-time { flex-basis: 100%; color: var(--dsw-alias-label-caption); font-size: 12px; line-height: 18px; white-space: nowrap; }
.dsw-sticky-delete { display: inline-flex; flex: none; align-items: center; justify-content: center; width: 26px; height: 26px; margin-left: auto; padding: 0; border: 0; border-radius: 8px; background: transparent; color: var(--dsw-alias-label-tertiary); cursor: pointer; }
.dsw-sticky-delete:hover { color: var(--dsw-alias-state-error-primary); background: var(--dsw-alias-interactive-bg-hover); }
.dsw-sticky-empty { display: flex; flex-direction: column; align-items: center; padding: 56px 20px; text-align: center; color: var(--dsw-alias-label-tertiary); }
.dsw-sticky-empty-glyph { margin-bottom: 12px; color: var(--dsw-alias-label-caption); }
.dsw-sticky-empty h2 { margin: 0 0 6px; color: var(--dsw-alias-label-secondary); font-size: 14px; line-height: 1.6; font-weight: 500; }
.dsw-sticky-empty p { max-width: 40ch; margin: 0 0 16px; }
.dsw-sticky-hint { margin: 16px 0 0; color: var(--dsw-alias-label-caption); font-size: 12px; line-height: 18px; }
.dsw-sticky-undo { position: absolute; bottom: 24px; left: 50%; display: flex; align-items: center; gap: 4px; padding: 6px 8px 6px 16px; border: 0.5px solid var(--dsw-alias-border-l2); border-radius: 12px; background: var(--dsw-alias-bg-overlay); color: var(--dsw-alias-label-primary); font-size: 13px; line-height: 20px; transform: translateX(-50%); }
.dsw-sticky-undo button { padding: 2px 8px; border: 0; border-radius: 6px; background: transparent; color: var(--dsw-alias-state-business-primary); font: inherit; font-size: 13px; cursor: pointer; }
.dsw-sticky-undo button:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dsw-sticky-page :focus-visible { outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary)); outline-offset: 2px; }
.dsw-sticky-page .dsw-sticky-note-input:focus-visible { outline: none; }
@media (max-width: 520px) {
  .dsw-sticky-content { padding-inline: 20px; }
}
`;

    function readStamp(value, fallback) {
      const stamp = Number(value);
      return Number.isFinite(stamp) && stamp > 0 && stamp <= 8640000000000000 ? stamp : fallback;
    }

    function readNotes() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw === null || raw === '') return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        const notes = [];
        parsed.forEach(candidate => {
          if (candidate === null || typeof candidate !== 'object') return;
          if (typeof candidate.id !== 'string' || typeof candidate.text !== 'string') return;
          const known = PALETTE.some(color => color.id === candidate.color);
          const now = Date.now();
          const createdAt = readStamp(candidate.createdAt, now);
          notes.push({
            id: candidate.id,
            text: candidate.text,
            color: known ? candidate.color : PALETTE[0].id,
            createdAt,
            updatedAt: readStamp(candidate.updatedAt, createdAt),
          });
        });
        return notes;
      } catch (_error) {
        return [];
      }
    }

    function formatTime(timestamp) {
      try {
        return new Date(timestamp).toLocaleString(document.documentElement.lang || undefined, {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
      } catch (_error) {
        return '';
      }
    }

    function NoteIcon({ size, active }) {
      return h('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
        'aria-hidden': true, style: { display: 'block', flex: 'none' },
      },
      h('rect', { x: 4.75, y: 3.75, width: 14.5, height: 16.5, rx: 2.4, stroke: 'currentColor', strokeWidth: active ? 1.8 : 1.5 }),
      h('path', {
        d: 'M13.6 3.75 19.25 9.4H13.6Z',
        fill: active ? 'currentColor' : 'none',
        stroke: 'currentColor', strokeWidth: 1.5, strokeLinejoin: 'round',
      }),
      h('path', { d: 'M8.1 12.4h7.8M8.1 15.9h5.4', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }));
    }

    function PlusIcon() {
      return h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
        h('path', { d: 'M12 5v14M5 12h14', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' }));
    }

    function TrashIcon() {
      return h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
        h('path', {
          d: 'M5.5 7.5h13M9.5 7.5V5.75h5V7.5M7.9 7.5l.8 11.25h6.6l.8-11.25M10.6 10.75v4.75M13.4 10.75v4.75',
          stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round',
        }));
    }

    function NoteCard({ note, index, t, autoFocus, onChange, onRemove, onAdd }) {
      const accent = PALETTE.find(color => color.id === note.color) || PALETTE[0];
      const stamp = note.updatedAt || note.createdAt;
      return h('li', { className: 'dsw-sticky-note', style: { '--note-ink': accent.ink } },
        h('textarea', {
          className: 'dsw-sticky-note-input',
          value: note.text,
          placeholder: t('placeholder'),
          'aria-label': t('noteText') + ' ' + (index + 1),
          autoFocus,
          maxLength: MAX_TEXT,
          onKeyDown: event => {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              onAdd();
            }
          },
          onChange: event => onChange(note.id, { text: event.target.value }),
        }),
        h('div', { className: 'dsw-sticky-note-foot' },
          h('div', { className: 'dsw-sticky-swatches', role: 'group', 'aria-label': t('colorGroup') + ' ' + (index + 1) },
            PALETTE.map(color => h('button', {
              key: color.id,
              type: 'button',
              className: 'dsw-sticky-swatch' + (color.id === accent.id ? ' dsw-sticky-swatch-active' : ''),
              'aria-label': t('color.' + color.id),
              'aria-pressed': color.id === accent.id,
              title: t('color.' + color.id),
              onClick: () => onChange(note.id, { color: color.id }),
            }, h('span', {
              className: 'dsw-sticky-swatch-dot',
              style: { '--swatch-ink': color.ink },
              'aria-hidden': true,
            })))),
          h('time', {
            className: 'dsw-sticky-time',
            dateTime: new Date(stamp).toISOString(),
            title: t('updated') + ' ' + formatTime(stamp),
          }, formatTime(stamp)),
          h('button', {
            type: 'button',
            className: 'dsw-sticky-delete',
            'aria-label': t('deleteNote') + ' ' + (index + 1),
            title: t('deleteNote'),
            onClick: () => onRemove(note.id),
          }, h(TrashIcon))));
    }

    function StickyWallPage(props) {
      const t = props.t;
      const [notes, setNotes] = useState(readNotes);
      const [removed, setRemoved] = useState([]);
      const [focusId, setFocusId] = useState(null);
      const [storageFailed, setStorageFailed] = useState(false);
      const undoRef = useRef(null);
      const wroteOnce = useRef(false);

      useEffect(() => {
        // The first render only reads: an unreadable stored value must not be
        // replaced by an empty wall before the user changes anything.
        if (!wroteOnce.current) {
          wroteOnce.current = true;
          return;
        }
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
          setStorageFailed(false);
        } catch (_error) {
          setStorageFailed(true);
        }
      }, [notes]);

      useEffect(() => {
        if (removed.length === 0) return undefined;
        // The delete button that had focus is gone, so the undo action takes it
        // instead of leaving keyboard users at the top of the page.
        if (undoRef.current !== null) undoRef.current.focus();
        const timer = window.setTimeout(() => { setRemoved([]); }, 8000);
        return () => { window.clearTimeout(timer); };
      }, [removed.length]);

      const addNote = useCallback(() => {
        const now = Date.now();
        const note = {
          id: 'note-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 7),
          text: '',
          color: PALETTE[now % PALETTE.length].id,
          createdAt: now,
          updatedAt: now,
        };
        setNotes(current => [note].concat(current));
        setFocusId(note.id);
      }, []);

      const updateNote = useCallback((id, patch) => {
        setNotes(current => current.map(note => note.id === id
          ? Object.assign({}, note, patch, { updatedAt: Date.now() })
          : note));
      }, []);

      const removeNote = useCallback(id => {
        const target = notes.find(note => note.id === id);
        if (target === undefined) return;
        setRemoved(current => [target].concat(current));
        setNotes(current => current.filter(note => note.id !== id));
      }, [notes]);

      const undoRemove = useCallback(() => {
        if (removed.length === 0) return;
        const restored = removed.slice();
        setNotes(current => restored.concat(current).sort((left, right) => right.createdAt - left.createdAt));
        setRemoved([]);
      }, [removed]);

      const shortcut = /Mac/i.test(navigator.userAgent) ? '⌘ + Enter' : 'Ctrl + Enter';
      const count = notes.length + ' ' + t(notes.length === 1 ? 'countOne' : 'countMany');

      return h(React.Fragment, null,
        h('style', null, STYLE_TEXT),
        h('div', { className: 'dsw-sticky-page' },
          h('div', { className: 'dsw-sticky-scroll' },
            h('div', { className: 'dsw-sticky-content' },
              h('header', { className: 'dsw-sticky-heading' },
                h('div', { className: 'dsw-sticky-heading-text' },
                  h('div', { className: 'dsw-sticky-title-row' },
                    h('h1', null, t('title')),
                    h('span', { className: 'dsw-sticky-count' }, count)),
                  h('p', { className: 'dsw-sticky-subtitle' }, t('subtitle'))),
                h('div', { className: 'dsw-sticky-heading-actions' },
                  h('button', { type: 'button', className: 'dsw-sticky-primary', onClick: addNote },
                    h(PlusIcon), h('span', null, t('create'))))),
              storageFailed ? h('p', { className: 'dsw-sticky-warning', role: 'status' }, t('storageFailed')) : null,
              notes.length === 0
                ? h('div', { className: 'dsw-sticky-empty' },
                    h('div', { className: 'dsw-sticky-empty-glyph' }, h(NoteIcon, { size: 44, active: false })),
                    h('h2', null, t('emptyTitle')),
                    h('p', null, t('emptyBody')),
                    h('button', { type: 'button', className: 'dsw-sticky-primary', onClick: addNote },
                      h(PlusIcon), h('span', null, t('create'))))
                : h('ul', { className: 'dsw-sticky-grid' },
                    notes.map((note, index) => h(NoteCard, {
                      key: note.id,
                      note,
                      index,
                      t,
                      autoFocus: note.id === focusId,
                      onChange: updateNote,
                      onRemove: removeNote,
                      onAdd: addNote,
                    }))),
              h('p', { className: 'dsw-sticky-hint' }, shortcut + ' ' + t('hint'))),
            removed.length === 0 ? null : h('div', { className: 'dsw-sticky-undo', role: 'status' },
              h('span', null, t('removedPrefix') + ' ' + removed.length + ' ' + t(removed.length === 1 ? 'countOne' : 'countMany')),
              h('button', { type: 'button', ref: undoRef, onClick: undoRemove }, t('undo'))))));
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'sticky-wall: dictionaries');
        const t = ctx.locale.bind(NS);

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 20,
          locale: NS,
          label: () => t('panel'),
        }, NoteIcon));

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
          locale: NS,
        }, StickyWallPage));
      },
    };
  },
});
