import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';

interface EmojiGroup {
  /** Emoji que hace de icono de la pestaña. */
  icon: string;
  label: string;
  emojis: readonly string[];
}

/**
 * Paleta de emojis sin dependencias: una lista curada, no el set completo de
 * Unicode. Con ~150 sobra para un foro y evita cargar 4 MB de metadatos.
 */
const GROUPS: readonly EmojiGroup[] = [
  {
    icon: '😀',
    label: 'Caras',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊',
      '😇', '🥰', '😍', '😘', '😋', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥳',
      '😏', '😒', '😔', '😞', '😢', '😭', '😤', '😠', '😡', '🤯', '😳', '🥺',
      '😱', '😨', '😰', '😥', '🤔', '🤭', '🤫', '😬', '🙄', '😴', '🤤', '🤢',
    ],
  },
  {
    icon: '👍',
    label: 'Gestos',
    emojis: [
      '👍', '👎', '👌', '🤌', '✌️', '🤞', '🤟', '🤘', '👏', '🙌', '👐', '🤝',
      '🙏', '💪', '🫶', '☝️', '👆', '👇', '👉', '👈', '✋', '🖐️', '🖖', '👋',
    ],
  },
  {
    icon: '❤️',
    label: 'Corazones',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
      '💞', '💓', '💗', '💖', '💘', '💝', '💯', '💥', '💫', '⭐', '🌟', '✨',
    ],
  },
  {
    icon: '🎉',
    label: 'Objetos',
    emojis: [
      '🎉', '🎊', '🎁', '🎂', '🍰', '☕', '🍺', '🍷', '🥂', '🍕', '🍔', '🍎',
      '📚', '📖', '✏️', '🖋️', '📝', '💻', '📱', '🔧', '🔨', '💡', '🔥', '⚡',
      '🎵', '🎮', '📷', '🏆', '🥇', '🎯', '🧩', '🎨',
    ],
  },
  {
    icon: '🌱',
    label: 'Naturaleza',
    emojis: [
      '🌱', '🌳', '🌲', '🌴', '🌵', '🍀', '🌿', '🍂', '🍁', '🌷', '🌹', '🌻',
      '🌼', '🌸', '🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐸',
      '🐢', '🐝', '🦋', '🐌', '☀️', '🌙', '☁️', '🌈',
    ],
  },
  {
    icon: '✅',
    label: 'Símbolos',
    emojis: [
      '✅', '❌', '⚠️', '❓', '❗', '💤', '🔔', '🔕', '🔒', '🔓', '📌', '📍',
      '🔍', '➡️', '⬅️', '⬆️', '⬇️', '↩️', '♻️', '🆗', '🆕', '🔝', '💬', '👀',
    ],
  },
];

/**
 * Panel de emojis. No decide dónde se inserta: emite `(pick)` y quien lo usa
 * (normalmente `lib-markdown-editor`) lo mete donde tenga el cursor.
 */
@Component({
  selector: 'lib-emoji-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib-emoji" role="dialog" aria-label="Elegir emoji">
      <div class="lib-emoji__tabs" role="tablist">
        @for (g of groups; track g.label) {
          <button
            type="button"
            class="lib-emoji__tab"
            [class.lib-emoji__tab--on]="active() === g"
            role="tab"
            [attr.aria-selected]="active() === g"
            [title]="g.label"
            [attr.aria-label]="g.label"
            (click)="active.set(g)"
          >{{ g.icon }}</button>
        }
      </div>
      <div class="lib-emoji__grid" role="tabpanel" [attr.aria-label]="active().label">
        @for (e of active().emojis; track e) {
          <button type="button" class="lib-emoji__item" [attr.aria-label]="e" (click)="pick.emit(e)">
            {{ e }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .lib-emoji {
        border: 1px solid var(--color-border, #cdbf9f);
        border-radius: var(--radius-md, 6px);
        background: var(--color-surface, #fbf5e6);
        box-shadow: var(--shadow-md, 0 6px 18px rgb(0 0 0 / 0.14));
        width: min(20rem, 88vw);
        overflow: hidden;
      }
      .lib-emoji__tabs {
        display: flex;
        gap: 0.15rem;
        padding: 0.3rem;
        border-bottom: 1px solid var(--color-border, #cdbf9f);
      }
      .lib-emoji__tab {
        flex: 1;
        background: transparent;
        border: 0;
        border-radius: var(--radius-sm, 4px);
        padding: 0.3rem 0;
        font-size: 1.05rem;
        line-height: 1;
        cursor: pointer;
      }
      .lib-emoji__tab:hover { background: rgb(0 0 0 / 0.06); }
      .lib-emoji__tab--on { background: rgb(0 0 0 / 0.1); }
      .lib-emoji__grid {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 0.1rem;
        padding: 0.4rem;
        max-height: 12rem;
        overflow-y: auto;
      }
      .lib-emoji__item {
        background: transparent;
        border: 0;
        border-radius: var(--radius-sm, 4px);
        padding: 0.25rem 0;
        font-size: 1.15rem;
        line-height: 1.2;
        cursor: pointer;
      }
      .lib-emoji__item:hover { background: rgb(0 0 0 / 0.08); }
      .lib-emoji__tab:focus-visible,
      .lib-emoji__item:focus-visible {
        outline: 2px solid var(--color-accent, #a87f3e);
        outline-offset: -2px;
      }
    `,
  ],
})
export class EmojiPickerComponent {
  readonly pick = output<string>();

  readonly groups = GROUPS;
  readonly active = signal<EmojiGroup>(GROUPS[0]);
}
