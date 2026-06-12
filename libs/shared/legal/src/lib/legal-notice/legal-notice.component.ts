import { Component, ChangeDetectionStrategy, ViewEncapsulation, input } from '@angular/core';
import { LegalConfig } from '../legal.config';
import { LEGAL_STYLES } from '../legal-styles';

@Component({
  selector: 'lib-legal-notice',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: [LEGAL_STYLES],
  template: `
    <article class="legal-page py-12">
      <h1 class="mb-2">Aviso Legal</h1>
      <p class="text-sm text-muted mb-8">Última actualización: {{ lastUpdated() }}</p>

      @if (cfg().customSections?.['identificativos']) {
        <section class="mb-8" [innerHTML]="cfg().customSections!['identificativos']"></section>
      } @else {
        <section class="mb-8">
          <h2 class="legal-h2 mb-3">1. Datos identificativos del titular</h2>
          <p class="text-sm mb-3">
            En cumplimiento de la Ley 34/2002, de Servicios de la Sociedad de la Información y
            Comercio Electrónico (LSSI-CE), te informamos de que el titular de este sitio web es:
          </p>
          <ul class="text-sm">
            <li><strong>Nombre / Razón social:</strong> {{ cfg().businessName }}</li>
            <li><strong>NIF/CIF:</strong> {{ cfg().nif }}</li>
            <li><strong>Domicilio:</strong> {{ cfg().address }}</li>
            <li><strong>Email:</strong>
              <a [href]="'mailto:' + cfg().contactEmail">{{ cfg().contactEmail }}</a>
            </li>
            <li><strong>Sitio web:</strong>
              <a [href]="'https://' + cfg().domain" target="_blank" rel="noopener">{{ cfg().domain }}</a>
            </li>
          </ul>
        </section>
      }

      @if (cfg().customSections?.['objeto']) {
        <section class="mb-8" [innerHTML]="cfg().customSections!['objeto']"></section>
      } @else {
        <section class="mb-8">
          <h2 class="legal-h2 mb-3">2. Objeto y ámbito de aplicación</h2>
          <p class="text-sm">
            Este Aviso Legal regula el acceso y uso del sitio web <strong>{{ cfg().domain }}</strong>,
            dedicado a la actividad de {{ cfg().activity }}. El acceso y navegación por el sitio implica
            la aceptación de las condiciones aquí establecidas.
          </p>
        </section>
      }

      @if (cfg().customSections?.['propiedadIntelectual']) {
        <section class="mb-8" [innerHTML]="cfg().customSections!['propiedadIntelectual']"></section>
      } @else {
        <section class="mb-8">
          <h2 class="legal-h2 mb-3">3. Propiedad intelectual e industrial</h2>
          <p class="text-sm mb-3">
            Todos los contenidos del sitio web — textos, imágenes, logotipos, diseño, código fuente y
            cualquier otro elemento — son propiedad de {{ cfg().businessName }} o de terceros que han
            autorizado su uso, y están protegidos por la legislación española e internacional sobre
            propiedad intelectual e industrial.
          </p>
          <p class="text-sm">
            Queda prohibida la reproducción, distribución, comunicación pública o transformación de
            dichos contenidos sin autorización expresa y por escrito del titular.
          </p>
        </section>
      }

      @if (cfg().customSections?.['responsabilidad']) {
        <section class="mb-8" [innerHTML]="cfg().customSections!['responsabilidad']"></section>
      } @else {
        <section class="mb-8">
          <h2 class="legal-h2 mb-3">4. Responsabilidad</h2>
          <p class="text-sm mb-3">
            {{ cfg().businessName }} no se hace responsable de los daños que pudieran derivarse de
            interrupciones, errores o fallos de seguridad que se produzcan en las comunicaciones a
            través de Internet, ni de la presencia de virus u otros elementos dañinos en los contenidos
            transmitidos por terceros a través de la red.
          </p>
          <p class="text-sm">
            Los enlaces a sitios web de terceros que pudieran incluirse en este sitio se facilitan
            únicamente a título informativo. {{ cfg().businessName }} no controla ni se responsabiliza
            de los contenidos de dichos sitios.
          </p>
        </section>
      }

      @if (cfg().customSections?.['leyAplicable']) {
        <section [innerHTML]="cfg().customSections!['leyAplicable']"></section>
      } @else {
        <section>
          <h2 class="legal-h2 mb-3">5. Ley aplicable y jurisdicción</h2>
          <p class="text-sm">
            Este Aviso Legal se rige por la legislación española. Para la resolución de cualquier
            controversia derivada del acceso o uso de este sitio web, las partes se someten a los
            juzgados y tribunales del domicilio del usuario, sin perjuicio del fuero imperativo que
            pudiera corresponder.
          </p>
        </section>
      }
    </article>
  `,
})
export class LegalNoticeComponent {
  readonly cfg = input.required<LegalConfig>();
  readonly lastUpdated = input<string>(
    new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  );
}
