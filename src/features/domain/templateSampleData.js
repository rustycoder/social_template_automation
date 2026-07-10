/**
 * @file features/domain/templateSampleData.js
 * @description Sample row values for gallery thumbnails and empty-state previews.
 * @dependencies features/domain/templateFields.js
 * @state None — static sample generators.
 */

/**
 * Sample row data for template gallery thumbnails and demos.
 */
import { getTemplateFields } from './templateFields.js';

const SAMPLE_IMAGE =
  'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1080&q=80';

const PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%231e293b"/><text x="200" y="205" font-family="system-ui,sans-serif" font-size="18" fill="%2394a3b8" text-anchor="middle">Sample Image</text></svg>`;

const BUILTIN_SAMPLES = {
  'viral-shock-card': {
    PHOTO: SAMPLE_IMAGE,
    BADGE: 'SHOCKING',
    HEADLINE: 'Scientists discover [[new method]] to reverse ocean acidification',
    DESCRIPTION: 'Researchers say the breakthrough could restore coral reefs within a decade.',
    SOURCE: '@WorldNewsWire',
  },
  'highlight-wire-card': {
    PHOTO: SAMPLE_IMAGE,
    TAG: 'BREAKING',
    HEADLINE: 'Senate passes infrastructure bill in [late-night vote]',
    SUBTEXT: 'The 68–32 vote clears the way for $1.2 trillion in nationwide spending.',
    SOURCE: 'Reuters Wire',
  },
  'banner-bold-card': {
    PHOTO: SAMPLE_IMAGE,
    BANNER_TEXT: 'EXCLUSIVE',
    HEADLINE: 'The quiet return of [small-town newsrooms]',
    SOURCE: '@LocalPressDaily',
  },
  'stamp-breaking-card': {
    PHOTO: SAMPLE_IMAGE,
    DATELINE: '01 July 2026',
    STAMP_TEXT: 'SEALED',
    HEADLINE_BIG: 'FUEL',
    HEADLINE_ACCENT: 'PUMPS',
    DESCRIPTION: 'Government seals several fuel pumps accused of overcharging customers.',
    SOURCE: 'FollowNepalTimes',
  },
  'news-update-card': {
    PHOTO: SAMPLE_IMAGE,
    HEADLINE: 'Central bank holds rates steady amid [[inflation concerns]]',
    SUBTITLE: 'Policy makers signal patience as global markets watch for signs of easing price pressures.',
    LOGO: '',
  },
  'entertainment-scoop-card': {
    PHOTO_LEFT: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
    PHOTO_RIGHT: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=600&q=80',
    TOP_TEXT: '[[EXCLUSIVE]] Trailer Drop Tonight',
    BOTTOM_TEXT: 'Fans camp outside theaters as the [blockbuster sequel] breaks pre-sale records worldwide.',
    LOGO: '',
  },
  'infographic-breakdown-card': {
    PHOTO: SAMPLE_IMAGE,
    TITLE: '5G Rollout at a Glance',
    SECTION1_ICON: '📡',
    SECTION1_HEADING: 'Coverage',
    SECTION1_DESC: 'Urban areas reach 92% availability with expanding rural buildout through 2027.',
    SECTION2_ICON: '⚡',
    SECTION2_HEADING: 'Speed',
    SECTION2_DESC: 'Average download speeds up 3× compared to LTE networks in major metros.',
    SECTION3_ICON: '🔋',
    SECTION3_HEADING: 'Devices',
    SECTION3_DESC: 'Over 68% of new smartphones sold this year are 5G-ready.',
    LOGO: '',
  },
  'quote-of-the-day-card': {
    PHOTO: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1080&q=80',
    QUOTE: 'The only way to do great work is to love what you do.',
    AUTHOR: 'Steve Jobs',
    LOGO: '',
  },
  'daily-tips-card': {
    HEADER: 'Daily Productivity Tips',
    PHOTO_1: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=500&q=80',
    TIP1_ICON: '✍️',
    TIP1_TITLE: 'Write it down',
    TIP1_DESC: 'Capture tasks immediately so nothing slips through the cracks.',
    PHOTO_2: 'https://images.unsplash.com/photo-1491434639811-a264a0c2d0ea?auto=format&fit=crop&w=500&q=80',
    TIP2_ICON: '⏰',
    TIP2_TITLE: 'Time block',
    TIP2_DESC: 'Schedule deep work in 90-minute focused sessions.',
    PHOTO_3: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=500&q=80',
    TIP3_ICON: '📵',
    TIP3_TITLE: 'Mute distractions',
    TIP3_DESC: 'Silence notifications during your most important hours.',
    PHOTO_4: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=500&q=80',
    TIP4_ICON: '🚶',
    TIP4_TITLE: 'Take breaks',
    TIP4_DESC: 'Short walks restore focus and reduce afternoon fatigue.',
    LOGO: '',
  },
  'fact-of-the-day-card': {
    PHOTO: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1080&q=80',
    FACT: 'Honey never [[spoils]] — archaeologists have found 3,000-year-old jars still edible.',
    CAPTION: 'Low moisture and acidic pH create an environment where bacteria cannot survive.',
    LOGO: '',
  },
  'comparison-challenge-card': {
    TITLE: 'Which would you choose?',
    PHOTO_LEFT: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80',
    LEFT_TITLE: 'Wireless Pro',
    LEFT_FEATURES: '• Active noise canceling\n• 40-hour battery\n• Spatial audio',
    LEFT_RATING: '4.8',
    PHOTO_RIGHT: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=500&q=80',
    RIGHT_TITLE: 'Studio Classic',
    RIGHT_FEATURES: '• Wired reference sound\n• Replaceable ear pads\n• Fold-flat design',
    RIGHT_RATING: '4.6',
    LOGO: '',
  },
  'celebrity-profile-card': {
    PHOTO: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1080&q=80',
    NAME: 'Elena Vasquez',
    PROFESSION: 'Actor & Director',
    BIO: 'Rising star known for bold performances in independent cinema and award-winning streaming dramas.',
    FACTS: '• Born in Barcelona\n• Speaks four languages\n• Founded a youth film workshop in 2022',
    QUOTE: 'Storytelling is how we make sense of the world.',
    LOGO: '',
  },
  'movie-rating-card': {
    PHOTO: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1080&q=80',
    TITLE: 'Midnight Horizon',
    GENRE: 'Sci-Fi Thriller',
    RATING: '8.4',
    SUMMARY: 'A gripping tale of astronauts racing against time as their station drifts into an unknown orbit.',
    LOGO: '',
  },
  'nature-walk-card': {
    PHOTO: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1080&q=80',
    TITLE: 'Morning Trail Discoveries',
    WALK_DESC: 'A peaceful 4 km walk through the oak forest revealed surprising biodiversity after last night\'s rain.',
    FINDING1_ICON: '🍄',
    FINDING1: 'Cluster of golden chanterelles near the creek bend',
    FINDING2_ICON: '🦌',
    FINDING2: 'Roe deer tracks fresh in the muddy path',
    FINDING3_ICON: '🦉',
    FINDING3: 'Tawny owl heard calling from the old beech grove',
    LOGO: '',
  },
  'space-fact-card': {
    PHOTO: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1080&q=80',
    FACT: 'A day on [[Venus]] is longer than its year',
    EXPLANATION: 'Venus rotates so slowly that it takes 243 Earth days to spin once — but only 225 days to orbit the Sun.',
    MORE_INFO: 'Learn more at nasa.gov/solar-system',
    LOGO: '',
  },
  'general-info-card': {
    PHOTO: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1080&q=80',
    TITLE: 'Understanding [Remote Work] Policies',
    SUBTITLE: 'A quick guide for teams transitioning to hybrid schedules',
    DESCRIPTION: 'Clear expectations around availability, communication channels, and core hours help distributed teams stay aligned without sacrificing flexibility.',
    LOGO: '',
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
