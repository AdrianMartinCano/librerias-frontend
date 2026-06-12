export type CmsBlockType =
  | 'hero' | 'text-image' | 'features' | 'gallery'
  | 'cta-banner' | 'faq' | 'testimonials' | 'text' | 'pricing'
  | 'counters' | 'trust-badges' | 'newsletter';

export interface CmsBlock<T = Record<string, unknown>> {
  type: CmsBlockType;
  data: T;
  id?: string;
}

export interface CmsPage {
  slug:         string;
  title:        string;
  description?: string;
  blocks:       CmsBlock[];
}

/* ── Datos de cada bloque ── */

export interface CmsCta {
  label:    string;
  href:     string;
  variant?: 'accent' | 'outline' | 'primary';
  external?: boolean;
}

export interface HeroData {
  title:          string;
  subtitle?:      string;
  image?:         string;
  imageAlt?:      string;
  cta?:           CmsCta;
  ctaSecondary?:  CmsCta;
  align?:         'left' | 'center';
  overlay?:       boolean;       // oscurece la imagen para contrastar el texto
  minHeight?:     string;        // ej. '60vh'
}

export interface TextImageData {
  title?:         string;
  text:           string;
  image:          string;
  imageAlt?:      string;
  imagePosition?: 'left' | 'right';
  cta?:           CmsCta;
}

export interface FeatureItem {
  icon:  string;       // emoji o SVG como string
  title: string;
  text:  string;
}

export interface FeaturesData {
  title?:    string;
  subtitle?: string;
  items:     FeatureItem[];
  cols?:     2 | 3 | 4;
}

export interface GalleryImage {
  src:      string;
  alt?:     string;
  caption?: string;
}

export interface GalleryData {
  title?: string;
  images: GalleryImage[];
  cols?:  2 | 3 | 4;
}

export interface CtaBannerData {
  title:       string;
  subtitle?:   string;
  cta:         CmsCta;
  ctaSecondary?: CmsCta;
  background?: 'primary' | 'accent' | 'surface';
}

export interface FaqItem {
  question: string;
  answer:   string;
}

export interface FaqData {
  title?: string;
  items:  FaqItem[];
}

export interface TestimonialItem {
  text:    string;
  author:  string;
  role?:   string;
  avatar?: string;
  rating?: number;
}

export interface TestimonialsData {
  title?: string;
  items:  TestimonialItem[];
}

export interface TextData {
  content: string;    // texto plano o HTML básico (<b>, <i>, <a>, <br>)
  align?:  'left' | 'center' | 'right';
}

export interface PricingPlan {
  name:        string;
  price:       number | string;
  period?:     string;          // 'mes', 'año', 'único'
  description?: string;
  features:    string[];
  cta?:        CmsCta;
  highlighted?: boolean;
  badge?:      string;          // 'Más popular', 'Oferta'
}

export interface PricingData {
  title?:    string;
  subtitle?: string;
  plans:     PricingPlan[];
}

export interface CounterItem {
  value:   number;
  label:   string;
  prefix?: string;   // e.g. '€', '$'
  suffix?: string;   // e.g. '+', 'k', '%'
}

export interface CountersData {
  title?: string;
  items:  CounterItem[];
  cols?:  2 | 3 | 4;
}

export interface TrustBadgeItem {
  icon: string;   // emoji o símbolo
  text: string;
}

export interface TrustBadgesData {
  title?: string;
  items:  TrustBadgeItem[];
  align?: 'left' | 'center';
}

export interface NewsletterBlockData {
  title?:       string;
  description?: string;
  layout?:      'inline' | 'stacked';
  source?:      string;
  background?:  'primary' | 'accent' | 'surface';
  align?:       'left' | 'center';
}
