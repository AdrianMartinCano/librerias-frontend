import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, computed, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RsvpData, RsvpRequest } from '@org/models';
import { EventContext } from '../../event-context';
import { RsvpService } from './rsvp.service';

type RsvpStatus = 'idle' | 'sending' | 'ok' | 'error';

@Component({
  selector: 'lib-event-rsvp',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="section ev-rsvp" [class.section--surface]="true">
      <div class="container">
        <div class="ev-rsvp__box">
          <h2 class="ev-rsvp__title text-center">{{ title() }}</h2>
          @if (subtitle()) { <p class="ev-rsvp__subtitle text-center">{{ subtitle() }}</p> }
          @if (deadline()) { <p class="ev-rsvp__deadline text-center">Confirma antes del {{ deadline() }}</p> }

          @if (status() === 'ok') {
            <p class="ev-rsvp__success">{{ data().successMessage ?? '¡Gracias por confirmar! 🎉' }}</p>
          } @else {
            <form class="ev-rsvp__form" [formGroup]="form" (ngSubmit)="submit()">
              <div class="ev-rsvp__field">
                <label class="lib-label" for="rsvp-name">Nombre y apellidos <span class="lib-required">*</span></label>
                <input id="rsvp-name" class="lib-input" formControlName="name"
                       [class.lib-input--error]="invalid('name')" />
                @if (invalid('name')) { <p class="lib-field-error">Dinos tu nombre</p> }
              </div>

              <div class="ev-rsvp__field">
                <label class="lib-label" for="rsvp-email">Email</label>
                <input id="rsvp-email" type="email" class="lib-input" formControlName="email"
                       [class.lib-input--error]="invalid('email')" />
                @if (invalid('email')) { <p class="lib-field-error">Email no válido</p> }
              </div>

              <div class="ev-rsvp__field">
                <span class="lib-label">¿Asistirás? <span class="lib-required">*</span></span>
                <div class="ev-rsvp__choice">
                  <label class="ev-rsvp__radio">
                    <input type="radio" class="lib-radio" [value]="true" formControlName="attending" /> Sí, allí estaré
                  </label>
                  <label class="ev-rsvp__radio">
                    <input type="radio" class="lib-radio" [value]="false" formControlName="attending" /> No podré ir
                  </label>
                </div>
              </div>

              @if (attending()) {
                @if (fields().plusOnes) {
                  <div class="ev-rsvp__field">
                    <label class="lib-label" for="rsvp-guests">Acompañantes</label>
                    <input id="rsvp-guests" type="number" min="0" [max]="fields().maxPlusOnes ?? 10"
                           class="lib-input" formControlName="guests" />
                  </div>
                }
                @if (fields().menu && menuOptions().length) {
                  <div class="ev-rsvp__field">
                    <label class="lib-label" for="rsvp-menu">Menú</label>
                    <select id="rsvp-menu" class="lib-input lib-select" formControlName="menuChoice">
                      <option value="">Elige…</option>
                      @for (opt of menuOptions(); track opt) { <option [value]="opt">{{ opt }}</option> }
                    </select>
                  </div>
                }
                @if (fields().allergies) {
                  <div class="ev-rsvp__field">
                    <label class="lib-label" for="rsvp-allergies">Alergias o intolerancias</label>
                    <input id="rsvp-allergies" class="lib-input" formControlName="allergies" />
                  </div>
                }
                @if (fields().song) {
                  <div class="ev-rsvp__field">
                    <label class="lib-label" for="rsvp-song">¿Qué canción no puede faltar?</label>
                    <input id="rsvp-song" class="lib-input" formControlName="song" />
                  </div>
                }
              }

              @if (fields().message) {
                <div class="ev-rsvp__field">
                  <label class="lib-label" for="rsvp-message">Mensaje</label>
                  <textarea id="rsvp-message" class="lib-input lib-textarea" formControlName="message"></textarea>
                </div>
              }

              @if (status() === 'error') {
                <p class="lib-field-error text-center">No se pudo enviar. Inténtalo de nuevo.</p>
              }

              <button type="submit" class="ev-rsvp__btn" [disabled]="status() === 'sending'">
                @if (status() === 'sending') { <span class="lib-spinner lib-spinner--inverse lib-spinner--sm"></span> Enviando… }
                @else { Confirmar }
              </button>
            </form>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .ev-rsvp__box { max-width: 560px; margin-inline: auto; padding: var(--space-10) var(--space-8);
      background: var(--color-background); border: 1px solid var(--color-border);
      border-radius: var(--radius-xl); box-shadow: var(--shadow-md); }
    .ev-rsvp__title { font-family: var(--heading-font, inherit); }
    .ev-rsvp__subtitle { color: var(--color-text-secondary); margin-top: var(--space-2); }
    .ev-rsvp__deadline { color: var(--p2); font-weight: 600; margin-top: var(--space-2); }
    .ev-rsvp__form { display: grid; gap: var(--space-5); margin-top: var(--space-8); }
    .ev-rsvp__choice { display: flex; gap: var(--space-6); flex-wrap: wrap; }
    .ev-rsvp__radio { display: flex; align-items: center; gap: var(--space-2); cursor: pointer; }
    .ev-rsvp__btn { width: 100%; padding: var(--space-4); border: 0; border-radius: var(--radius-full);
      background: var(--p2); color: #fff; font-weight: 700; font-size: var(--font-size-lg); cursor: pointer;
      display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2);
      transition: filter var(--transition-fast); }
    .ev-rsvp__btn:hover:not(:disabled) { filter: brightness(.95); }
    .ev-rsvp__btn:disabled { opacity: .7; cursor: default; }
    .ev-rsvp__success { text-align: center; font-size: var(--font-size-xl); color: var(--color-success);
      padding-block: var(--space-8); font-family: var(--heading-font, inherit); }
  `],
})
export class RsvpComponent {
  readonly data = input<RsvpData>({});
  readonly ctx = input.required<EventContext>();

  private readonly fb = inject(FormBuilder);
  private readonly rsvp = inject(RsvpService);

  readonly status = signal<RsvpStatus>('idle');

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', Validators.email],
    attending: this.fb.control<boolean | null>(true, Validators.required),
    guests: [0],
    menuChoice: [''],
    allergies: [''],
    song: [''],
    message: [''],
  });

  readonly title = computed(() => this.data().title ?? 'Confirma tu asistencia');
  readonly subtitle = computed(() => this.data().subtitle);
  readonly deadline = computed(() => this.data().deadline);
  readonly fields = computed(() => this.data().fields ?? { plusOnes: true, menu: false, allergies: true, message: true });
  readonly menuOptions = computed(() => this.data().menuOptions ?? []);
  readonly attending = computed(() => this.form.controls.attending.value === true);

  invalid(ctrl: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[ctrl];
    return c.invalid && (c.dirty || c.touched);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.status.set('sending');
    const v = this.form.getRawValue();
    const payload: RsvpRequest = {
      eventId: this.ctx().eventId,
      name: v.name,
      email: v.email || undefined,
      attending: v.attending === true,
      guests: v.attending ? v.guests : 0,
      menuChoice: v.menuChoice || undefined,
      allergies: v.allergies || undefined,
      song: v.song || undefined,
      message: v.message || undefined,
    };
    const endpoint = this.data().endpoint ?? this.ctx().rsvpEndpoint;
    this.rsvp.submit(endpoint, payload).subscribe({
      next: () => this.status.set('ok'),
      error: () => this.status.set('error'),
    });
  }
}
