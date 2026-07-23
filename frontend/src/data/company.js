// Content sourced from the ICOGAM reference site (icogam folder):
// company story, services, stats, trusted clients and contact details.

// Local copies of the ICOGAM brand imagery, served from /public.
export const media = {
  logo: '/assets/images/icogam/logo.png',
  heroImage: '/assets/images/icogam/image1.jpg',
  aboutImage: '/assets/images/icogam/1.png',
  captureImage: '/assets/images/icogam/2.png',
}

export const company = {
  name: 'Rayes Modes',
  tagline: 'Fabrics & Trims for the Modern Atelier',
  founded: 2010,
  founder: 'Bessem Gam',
  location: 'Av. Habib bourguiba, Bennane, Monastir, Tunisia',
  about:
    'Couture Supplies is a specialist in the manufacture of home textiles, health products, and fabric and non-woven packaging. Since our founding in 2005 by Hafedh Gam in Sahline, Monastir, we have built a worldwide reputation for exceptional textiles.',
  aboutExtended:
    'Our expertise as a subcontractor for home linen, hospitality, bath and hospital textiles sets us apart in productivity, reactivity and quality. We are committed to products that meet the strictest standards and the specific needs of both national and international clients.',
  clientsNote:
    'Through our commitment to excellence we have earned the trust of renowned brands including Jacquard Français, Jalla, Yves Delorme, Ralph Lauren and Air France.',
}

export const stats = [
  { value: 20, suffix: '+', labelKey: 'stat_experience' },
  { value: 60, suffix: '+', labelKey: 'stat_employees' },
  { value: 5, suffix: '+', labelKey: 'stat_clients' },
]

export const services = [
  {
    id: 'study',
    icon: 'study',
    image: '/assets/images/icogam/book_10214983.png',
    titleKey: 'service_study_title',
    descKey: 'service_study_desc',
  },
  {
    id: 'design',
    icon: 'design',
    image: '/assets/images/icogam/sketch_4515763.png',
    titleKey: 'service_design_title',
    descKey: 'service_design_desc',
  },
  {
    id: 'cutting',
    icon: 'cutting',
    image: '/assets/images/icogam/wrapping-paper_4454764.png',
    titleKey: 'service_cutting_title',
    descKey: 'service_cutting_desc',
  },
  {
    id: 'manufacturing',
    icon: 'manufacturing',
    image: '/assets/images/icogam/sewing-machine_10466785.png',
    titleKey: 'service_manufacturing_title',
    descKey: 'service_manufacturing_desc',
  },
  {
    id: 'quality',
    icon: 'quality',
    image: '/assets/images/icogam/quality-control_11268858.png',
    titleKey: 'service_quality_title',
    descKey: 'service_quality_desc',
  },
  {
    id: 'embroidery',
    icon: 'embroidery',
    image: '/assets/images/icogam/embroidery_4838950.png',
    titleKey: 'service_embroidery_title',
    descKey: 'service_embroidery_desc',
  },
  {
    id: 'storage',
    icon: 'storage',
    image: '/assets/images/icogam/inventory_7078214.png',
    titleKey: 'service_storage_title',
    descKey: 'service_storage_desc',
  },
]

export const productRangeKeys = [
  'range_duvets',
  'range_bedspreads',
  'range_bed_sets',
  'range_fitted_sheets',
  'range_flat_sheets',
  'range_pillows',
  'range_pillowcases',
  'range_embroideries',
  'range_screen_printing',
  'range_custom_dyeing',
]

export const clients = [
  'Jacquard Français',
  'Jalla',
  'Yves Delorme',
  'Ralph Lauren',
  'Air France',
]

export const contact = {
  address: 'Av. Habib bourguiba, Bennane, Monastir, Tunisia',
  phone: '+216 53851503',
  phoneHref: 'tel:+21653851503',
  email: 'rayesmodes@topnet.tn',
  emailHref: 'mailto:rayesmodes@topnet.tn',
  // linkedin: 'https://www.linkedin.com/company/icogam-confection/',
  // OpenStreetMap embed centred on Sahline, Monastir
  mapSrc:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3278.1!2d10.827855!3d35.6773083!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1302116be8bd8453%3A0x429fb1ff26c41a9f!2sRayes%20Modes%20Av%20Habib%20Bourguiba%20Bennane!5e0!3m2!1sen!2stn!4v1',
}
