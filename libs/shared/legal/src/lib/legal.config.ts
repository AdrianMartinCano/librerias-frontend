export type PrivacySection =
  | 'responsable' | 'finalidad' | 'baseJuridica'
  | 'destinatarios' | 'transferencias' | 'conservacion'
  | 'derechos' | 'cookies';

export type LegalSection =
  | 'identificativos' | 'objeto' | 'propiedadIntelectual'
  | 'responsabilidad' | 'leyAplicable';

export interface LegalConfig {
  /** Nombre completo del negocio o autónomo: "Peluquería García S.L." / "María García López" */
  businessName: string;
  /** NIF / CIF */
  nif: string;
  /** Dirección fiscal completa */
  address: string;
  /** Email de contacto para ejercer derechos RGPD */
  contactEmail: string;
  /** Dominio web sin protocolo: "minegocio.com" */
  domain: string;
  /** Actividad del negocio: "peluquería", "tienda de muebles", "clínica dental"... */
  activity: string;
  /** País de establecimiento (default: España) */
  country?: string;
  /** Autoridad de control (default: AEPD) */
  supervisoryAuthority?: string;
  /**
   * HTML personalizado para sobrescribir secciones completas (h2 incluido).
   * Si una clave está presente, se renderiza su valor en lugar del texto genérico.
   *
   * Claves de PrivacyPolicyComponent:
   *   responsable · finalidad · baseJuridica · destinatarios
   *   transferencias · conservacion · derechos · cookies
   *
   * Claves de LegalNoticeComponent:
   *   identificativos · objeto · propiedadIntelectual · responsabilidad · leyAplicable
   */
  customSections?: Partial<Record<PrivacySection | LegalSection, string>>;
}
