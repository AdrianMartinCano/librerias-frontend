import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, computed } from '@angular/core';
import { MenuData } from '@org/models';

@Component({
  selector: 'lib-event-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="section ev-menu">
      <div class="container">
        <h2 class="ev-menu__title text-center">{{ title() }}</h2>
        <div class="ev-menu__courses">
          @for (course of courses(); track $index) {
            <div class="ev-menu__course">
              <h3 class="ev-menu__course-name">{{ course.name }}</h3>
              <ul class="ev-menu__dishes">
                @for (dish of course.dishes; track $index) {
                  <li class="ev-menu__dish">
                    <p class="ev-menu__dish-name">{{ dish.name }}</p>
                    @if (dish.description) { <p class="ev-menu__dish-desc">{{ dish.description }}</p> }
                    @if (dish.tags?.length) {
                      <div class="ev-menu__tags">
                        @for (tag of dish.tags; track tag) { <span class="badge badge--accent">{{ tag }}</span> }
                      </div>
                    }
                  </li>
                }
              </ul>
            </div>
          }
        </div>
        @if (data().note) { <p class="ev-menu__note text-center">{{ data().note }}</p> }
      </div>
    </section>
  `,
  styles: [`
    .ev-menu__title { font-family: var(--heading-font, inherit); margin-bottom: var(--space-10); }
    .ev-menu__courses { max-width: 760px; margin-inline: auto; display: grid; gap: var(--space-10); }
    .ev-menu__course-name { font-family: var(--heading-font, inherit); text-align: center; color: var(--p2);
      position: relative; margin-bottom: var(--space-6); }
    .ev-menu__course-name::after { content: ''; display: block; width: 48px; height: 2px;
      background: var(--p2); margin: var(--space-3) auto 0; }
    .ev-menu__dishes { display: grid; gap: var(--space-5); }
    .ev-menu__dish { text-align: center; }
    .ev-menu__dish-name { font-size: var(--font-size-lg); color: var(--color-text); font-weight: 600; }
    .ev-menu__dish-desc { color: var(--color-text-secondary); margin-top: 2px; }
    .ev-menu__tags { display: flex; gap: var(--space-2); justify-content: center; margin-top: var(--space-2); flex-wrap: wrap; }
    .ev-menu__note { margin-top: var(--space-10); color: var(--color-text-muted); font-style: italic; }
  `],
})
export class MenuComponent {
  readonly data = input<MenuData>({ courses: [] });
  readonly title = computed(() => this.data().title ?? 'Menú');
  readonly courses = computed(() => this.data().courses ?? []);
}
