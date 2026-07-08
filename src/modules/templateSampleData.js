/**
 * Sample row data for template gallery thumbnails and demos.
 */
import { getTemplateFields } from './templateFields.js';
import { DEFAULT_STAMP_IMAGE } from '../templates/social/breakingNewsCard.js';

const SAMPLE_IMAGE =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop';

const PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%231e293b"/><text x="200" y="205" font-family="system-ui,sans-serif" font-size="18" fill="%2394a3b8" text-anchor="middle">Sample Image</text></svg>`;

const BUILTIN_SAMPLES = {
  'gradient-basic': {
    IMAGE: SAMPLE_IMAGE,
    HEADLINE: 'New Collection',
    CAPTION: 'Discover our latest styles and seasonal highlights.',
  },
  'news-reel': {
    IMAGE: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=800&auto=format&fit=crop',
    HOOK: 'SHOCKED',
    LINE_1: "INDIA'S ICONIC",
    LINE_2: 'TAJ MAHAL TURNS GREEN',
    LINE_3: 'AMID ALGAE BLOOM',
    BODY: 'Environmental experts warn that rising pollution levels are affecting one of the world\'s most famous landmarks.',
    HANDLE: 'Insta/@CHAZUPAA',
  },
  'ai-heist': {
    IMAGE: SAMPLE_IMAGE,
    HEADLINE:
      'China ran one of the <br> <span class="highlight">biggest AI heists <br> against Anthropic</span> for 45 <br> days without getting caught',
    SWIPE_TEXT: 'Swipe for details',
  },
  'sports-news-card': {
    IMAGE: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1080&auto=format&fit=crop',
    DATE: 'June 29, 2026',
    META_LINE: 'RONB | 24 HRS HIGHLIGHTS | JUNE 29 2026 | ASAR 15',
    HEADLINE:
      'Lionel Messi is currently the highest goal scorer in this World Cup with 6 goals after completion of Group Stage.',
    SWIPE_LABEL: 'Swipe',
  },
  'viral-highlight-card': {
    HEADER_TEXT: 'OFFICE IN BURJ KHALIFA',
    BG_IMAGE:
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1080&auto=format&fit=crop',
    SUBJECT_IMAGE:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop',
    INSET_LEFT:
      'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=400&auto=format&fit=crop',
    INSET_RIGHT:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&auto=format&fit=crop',
    FOOTER_TEXT:
      'Meet <span class="hl-yellow">Jainam Jain</span>, the 14-year-old <span class="hl-yellow">founder of AI startup</span> Mengo Engine, with an office on the 141st floor of <span class="hl-yellow">Burj Khalifa</span>.',
  },
  'breaking-news-card': {
    BG_IMAGE:
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1080&auto=format&fit=crop',
    BRAND_TEXT: 'BreakingNews',
    DATE_DAY: '01 July',
    DATE_YEAR: '2026',
    STAMP_IMAGE: DEFAULT_STAMP_IMAGE,
    NEWS_TAG: 'NEWS',
    HEADLINE_WORD: 'pump',
    HEADLINE_BADGE: 'SEALED',
    BODY_TEXT:
      'After the Nepal Oil Corporation reduced fuel prices on <span class="hl-red">July 1, 2026,</span> <span class="hl-red">some fuel stations allegedly claimed they had no fuel in stock while selling it at higher prices.</span> In response, <span class="hl-red">the government sealed several fuel pumps accused of overcharging customers and violating the rules.</span>',
    FOOTER_CTA: 'FollowNepalTimes',
  },
  'wire-breaking-card': {
    PHOTO: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1080&q=80',
    TAG: 'BREAKING',
    DATELINE: 'WASHINGTON, D.C.',
    HEADLINE: 'Senate Passes Infrastructure Bill in Late-Night Vote',
    SUBTEXT: 'The 68–32 vote clears the way for $1.2 trillion in nationwide spending.',
    SOURCE: 'REUTERS WIRE',
    DATE: '07 JUL 2026',
    TIME: '23:14 GMT',
  },
  'editorial-feature-card': {
    PHOTO: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1080&q=80',
    TAG: 'LONG READ',
    HEADLINE: 'The Quiet Return of Small-Town Newsrooms',
    SUBTEXT:
      'As national outlets retreat from local coverage, a new generation of reporters is betting on hyper-local trust.',
    AUTHOR: 'Maria Ontiveros',
    READ_TIME: '6 min read',
  },
  'data-analysis-card': {
    TAG: 'BY THE NUMBERS',
    STAT: '42%',
    SUBTEXT:
      'of Americans now get breaking news alerts directly from social apps rather than news websites, up from 19% in 2020.',
    AXIS_1: '2020',
    AXIS_2: '2022',
    AXIS_3: '2024',
    AXIS_4: '2026',
    SOURCE: 'Pew Research, 2026',
  },
};

/**
 * @param {object} template
 * @returns {Record<string, string>}
 */
export function getSampleRowForTemplate(template) {
  const id = template.id;
  if (id && BUILTIN_SAMPLES[id]) {
    return { ...BUILTIN_SAMPLES[id] };
  }

  const row = {};
  for (const field of getTemplateFields(template)) {
    if (field.type === 'image') {
      row[field.key] = PLACEHOLDER_IMAGE;
    } else if (field.type === 'textarea') {
      row[field.key] = `Sample ${field.label}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`;
    } else {
      row[field.key] = `Sample ${field.label}`;
    }
  }
  return row;
}
