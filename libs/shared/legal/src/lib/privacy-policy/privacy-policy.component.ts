import { Component, ChangeDetectionStrategy, ViewEncapsulation, input, computed } from '@angular/core';
import { LegalConfig } from '../legal.config';
import { LEGAL_STYLES } from '../legal-styles';

@Component({
  selector: 'lib-privacy-policy',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styles: [LEGAL_STYLES],
  template: `
    <article class="legal-page py-12">
      <h1 class="mb-2">Política de Privacidad</h1>
      <p class="text-sm text-muted mb-8">Última actualización: {{ lastUpdated() }}</p>

      @if (cfg().customSections?.['responsable']) {
        <section class="mb-8" [innerHTML]="cfg().customSections!['responsable']"></section>
      } @else {
        <section class="mb-8">
          <h2 class="legal-h2 mb-3">1. Responsable del tratamiento</h2>
          <p class="text-sm mb-3">
            En cumplimiento del Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD),
            te informamos de que los datos personales que facilites a través de
            <strong>{{ cfg().domain }}</strong> serán tratados por:
          </p>
          <ul class="text-sm">
            <li><strong>Identidad:</strong> {{ cfg().businessName }}</li>
            <li><strong>NIF/CIF:</strong> {{ cfg().nif }}</li>
            <li><strong>Dirección:</strong> {{ cfg().address }}</li>
            <li><strong>Email de contacto:</strong>
              <a [href]="'mailto:' + cfg().contactEmail">{{ cfg().contactEmail }}</a>
            </li>
          </ul>
        </section>
      }

      @if (cfg().customSections?.['finalidad']) {
        <section class="mb-8" [innerHTML]="cfg().customSections!['finalidad']"></section>
      } @else {
        <section class="mb-8">
          <h2 class="legal-h2 mb-3">2. Finalidad del tratamiento</h2>
          <p class="text-sm mb-3">Tratamos tus datos personales para las siguientes finalidades:</p>
          <ul class="text-sm">
            <li>Gestionar las consultas y solicitudes que nos envíes a través del formulario de contacto.</li>
            <li>Gestionar los servicios contratados relacionados con la actividad de {{ cfg().activity }}.</li>
            <li>Enviarte comunicaciones relacionadas con tus solicitudes o servicios, si así nos lo has pedido.</li>
            <li>Cumplir con las obligaciones legales aplicables.</li>
          </ul>
        </section>
      }

      @if (cfg().customSections?.['baseJuridica']) {
        <section class="mb-8" [innerHTML]="cfg().customSections!['baseJuridica']"></section>
      } @else {
        <section class="mb-8">
          <h2 class="legal-h2 mb-3">3. Base jurídica</h2>
          <ul class="text-sm">
            <li><strong>Ejecución de un contrato</strong> — cuando los datos son necesarios para prestar el servicio solicitado.</li>
            <li><strong>Interés legítimo</strong> — para responder a consultas y gestionar la relación comercial.</li>
            <li><strong>Consentimiento</strong> — para el envío de comunicaciones comerciales, cuando lo hayas otorgado expresamente.</li>
            <li><strong>Obligación legal</strong> — cuando la normativa nos obliga a tratar ciertos datos.</li>
          </ul>
        </section>
      }

      @if (cfg().customSections?.['destinatarios']) {
        <section class="mb-8" [innerHTML]="cfg().customSections!['destinatarios']"></section>
      } @else {
        <section class="mb-8">
          <h2 class="legal-h2 mb-3">4. Destinatarios</h2>
          <p class="text-sm">
            No cedemos tus datos a terceros salvo obligación legal o cuando sea estrictamente necesario
            para prestar el servicio (por ejemplo, pasarelas de pago o plataformas de envío de emails).
            En ese caso, dichos proveedores actúan como encargados del tratamiento bajo contrato y con
            las garantías exigidas por el RGPD.
          </p>
        </section>
      }

      @if (cfg().customSections?.['transferencias']) {
        <section class="mb-8" [innerHTML]="cfg().customSections!['transferencias']"></section>
      } @else {
        <section class="mb-8">
          <h2 class="legal-h2 mb-3">5. Transferencias internacionales</h2>
          <p class="text-sm">
            No realizamos transferencias internacionales de datos fuera del Espacio Económico Europeo,
            salvo que algún proveedor de servicios (como herramientas de analítica o correo electrónico)
            esté establecido en terceros países con decisión de adecuación de la Comisión Europea o
            garantías apropiadas.
          </p>
        </section>
      }

      @if (cfg().customSections?.['conservacion']) {
        <section class="mb-8" [innerHTML]="cfg().customSections!['conservacion']"></section>
      } @else {
        <section class="mb-8">
          <h2 class="legal-h2 mb-3">6. Plazo de conservación</h2>
          <p class="text-sm">
            Conservamos tus datos durante el tiempo necesario para cumplir la finalidad para la que
            fueron recogidos y, posteriormente, durante los plazos legales de prescripción aplicables.
            Los datos de contacto se conservan durante 3 años desde la última comunicación, salvo que
            solicites su supresión antes.
          </p>
        </section>
      }

      @if (cfg().customSections?.['derechos']) {
        <section class="mb-8" [innerHTML]="cfg().customSections!['derechos']"></section>
      } @else {
        <section class="mb-8">
          <h2 class="legal-h2 mb-3">7. Tus derechos</h2>
          <p class="text-sm mb-3">Puedes ejercer en cualquier momento los siguientes derechos:</p>
          <ul class="text-sm mb-3">
            <li><strong>Acceso</strong> — conocer qué datos tuyos tratamos.</li>
            <li><strong>Rectificación</strong> — corregir datos inexactos o incompletos.</li>
            <li><strong>Supresión</strong> — solicitar que eliminemos tus datos cuando ya no sean necesarios.</li>
            <li><strong>Limitación</strong> — pedir que restrinjamos el tratamiento en ciertos casos.</li>
            <li><strong>Portabilidad</strong> — recibir tus datos en formato estructurado.</li>
            <li><strong>Oposición</strong> — oponerte al tratamiento basado en interés legítimo.</li>
            <li><strong>Retirar el consentimiento</strong> — sin que ello afecte a la licitud del tratamiento previo.</li>
          </ul>
          <p class="text-sm mb-3">
            Para ejercer estos derechos, escríbenos a
            <a [href]="'mailto:' + cfg().contactEmail">{{ cfg().contactEmail }}</a>
            indicando tu nombre, el derecho que deseas ejercer y una copia de tu DNI o documento identificativo.
          </p>
          <p class="text-sm">
            Si consideras que el tratamiento no se ajusta a la normativa, tienes derecho a presentar
            una reclamación ante la
            <a href="https://www.aepd.es" target="_blank" rel="noopener">{{ authority() }}</a>.
          </p>
        </section>
      }

      @if (cfg().customSections?.['cookies']) {
        <section [innerHTML]="cfg().customSections!['cookies']"></section>
      } @else {
        <section>
          <h2 class="legal-h2 mb-3">8. Cookies</h2>
          <p class="text-sm">
            Este sitio web utiliza cookies. Para más información, consulta nuestra
            <a href="/politica-de-cookies">Política de Cookies</a>.
          </p>
        </section>
      }
    </article>
  `,
})
export class PrivacyPolicyComponent {
  readonly cfg = input.required<LegalConfig>();
  readonly lastUpdated = input<string>(
    new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  );

  readonly authority = computed(() =>
    this.cfg().supervisoryAuthority ?? 'Agencia Española de Protección de Datos (AEPD)'
  );
}
