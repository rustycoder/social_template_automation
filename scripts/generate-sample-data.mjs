/**
 * Generates builtinTemplateSamples.js — one curated sample row per template.
 * Validates every registry field is populated. Run: node scripts/generate-sample-data.mjs
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { LEGACY_TEMPLATE_REGISTRY } from '../src/templates/legacyTemplateRegistry.js';
import { NICHE_TEMPLATE_REGISTRY } from '../src/templates/nicheTemplateRegistry.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = join(root, 'src/features/domain/builtinTemplateSamples.js');

const u = (id, w = 1080) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** @type {Record<string, Record<string, string>>} */
const SAMPLES = {
  'viral-shock-card': {
    PHOTO: u('1504711434969-e33886168d6c'),
    BADGE: 'BREAKING',
    HEADLINE: 'Major blackout hits capital as [[power grid]] fails without warning',
    DESCRIPTION: 'Engineers race to restore electricity as record heat pushes demand to historic highs.',
    SOURCE: '@WorldNewsWire',
  },
  'highlight-wire-card': {
    PHOTO: u('1495020689067-958852a7765e'),
    TAG: 'POLITICS',
    HEADLINE: 'Senate passes infrastructure bill in [late-night vote]',
    SUBTEXT: 'The 68–32 vote clears the way for $1.2 trillion in nationwide spending.',
    SOURCE: 'Reuters Wire',
  },
  'banner-bold-card': {
    PHOTO: u('1451187580459-43490279c0fa'),
    BANNER_TEXT: 'UPSC CURRENT AFFAIRS — JULY 2026',
    HEADLINE: '[Chandrayaan-5] lands near the lunar south pole in a [[historic first]]',
    SOURCE: 'Source: ISRO Press Release',
  },
  'stamp-breaking-card': {
    PHOTO: u('1541872703-74c5e44368f9'),
    DATELINE: '08 JUL 2026',
    STAMP_TEXT: 'VERIFIED',
    HEADLINE_BIG: 'EARTHQUAKE',
    HEADLINE_ACCENT: 'ROCKS CAPITAL',
    DESCRIPTION: 'A [magnitude 6.4 quake] struck at dawn, damaging hundreds of structures citywide.',
    SOURCE: 'FollowNepal Times',
  },
  'news-update-card': {
    PHOTO: u('1504711434969-e33886168d6c'),
    HEADLINE: 'Central bank holds rates steady amid [[inflation concerns]]',
    SUBTITLE: 'Policy makers signal patience as markets watch for signs of easing price pressures.',
    LOGO: '',
  },
  'entertainment-scoop-card': {
    PHOTO_LEFT: u('1489599849927-2ee91cede3ba', 600),
    PHOTO_RIGHT: u('1522869635100-9f4c5e86aa37', 600),
    TOP_TEXT: '[[EXCLUSIVE]] Trailer drops tonight',
    BOTTOM_TEXT: 'Fans line up worldwide as the [blockbuster sequel] shatters pre-sale records.',
    LOGO: '',
  },
  'infographic-breakdown-card': {
    PHOTO: u('1677442136019-21780ecad995'),
    TITLE: '5G Rollout at a Glance',
    SECTION1_ICON: '📡',
    SECTION1_HEADING: 'Coverage',
    SECTION1_DESC: 'Urban areas reach 92% availability with rural buildout expanding through 2027.',
    SECTION2_ICON: '⚡',
    SECTION2_HEADING: 'Speed',
    SECTION2_DESC: 'Average downloads are 3× faster than LTE in major metro networks.',
    SECTION3_ICON: '📱',
    SECTION3_HEADING: 'Adoption',
    SECTION3_DESC: '68% of smartphones sold this year ship with 5G-ready chipsets.',
    LOGO: '',
  },
  'quote-of-the-day-card': {
    PHOTO: u('1506905925346-21bda4d32df4'),
    QUOTE: 'Trust is built in drops and lost in buckets.',
    AUTHOR: 'Rachel Botsman',
    LOGO: '',
  },
  'daily-tips-card': {
    HEADER: 'Daily Productivity Tips',
    PHOTO_1: u('1434030216411-0b793f4b4173', 500),
    TIP1_ICON: '✍️',
    TIP1_TITLE: 'Capture tasks',
    TIP1_DESC: 'Write down ideas the moment they appear so nothing slips away.',
    PHOTO_2: u('1491434639811-a264a0c2d0ea', 500),
    TIP2_ICON: '⏰',
    TIP2_TITLE: 'Time block',
    TIP2_DESC: 'Protect 90-minute windows for your most important deep work.',
    PHOTO_3: u('1516321318423-f06f85e504b3', 500),
    TIP3_ICON: '📵',
    TIP3_TITLE: 'Mute noise',
    TIP3_DESC: 'Silence notifications during focus hours to protect momentum.',
    PHOTO_4: u('1544027993-37dbfe43562a', 500),
    TIP4_ICON: '🚶',
    TIP4_TITLE: 'Reset often',
    TIP4_DESC: 'Short walks between sessions restore clarity and energy.',
    LOGO: '',
  },
  'fact-of-the-day-card': {
    PHOTO: u('1451187580459-43490279c0fa'),
    FACT: 'Honey never [[spoils]] — 3,000-year-old jars remain edible.',
    CAPTION: 'Low moisture and acidic pH prevent bacterial growth in sealed honey.',
    LOGO: '',
  },
  'comparison-challenge-card': {
    TITLE: 'Which headphones win?',
    PHOTO_LEFT: u('1505740420928-5e560c06d30e', 600),
    LEFT_TITLE: 'Wireless Pro',
    LEFT_FEATURES: '• Active noise canceling\n• 40-hour battery\n• Spatial audio',
    LEFT_RATING: '4.8',
    PHOTO_RIGHT: u('1484704849700-f032a568e944', 600),
    RIGHT_TITLE: 'Studio Classic',
    RIGHT_FEATURES: '• Wired reference sound\n• Replaceable pads\n• Fold-flat carry',
    RIGHT_RATING: '4.6',
    LOGO: '',
  },
  'celebrity-profile-card': {
    PHOTO: u('1534528741775-53994a69daeb'),
    NAME: 'Elena Vasquez',
    PROFESSION: 'Actor & Director',
    BIO: 'Known for fearless performances in independent cinema and acclaimed streaming dramas.',
    FACTS: '• Born in Barcelona\n• Speaks four languages\n• Runs a youth film workshop',
    QUOTE: 'Storytelling is how we make sense of the world.',
    LOGO: '',
  },
  'movie-rating-card': {
    PHOTO: u('1489599849927-2ee91cede3ba'),
    TITLE: 'Midnight Horizon',
    GENRE: 'Sci-Fi Thriller',
    RATING: '8.4',
    SUMMARY: 'Astronauts race against time as their station drifts into an unknown orbit.',
    LOGO: '',
  },
  'nature-walk-card': {
    PHOTO: u('1441974231531-c6227db76b6e'),
    TITLE: 'Morning Trail Discoveries',
    WALK_DESC: 'A quiet 4 km loop through oak woodland after overnight rain.',
    FINDING1_ICON: '🍄',
    FINDING1: 'Golden chanterelles clustered near the creek bend',
    FINDING2_ICON: '🦌',
    FINDING2: 'Fresh roe deer tracks pressed into the muddy path',
    FINDING3_ICON: '🦉',
    FINDING3: 'Tawny owl calling from the old beech grove',
    LOGO: '',
  },
  'space-fact-card': {
    PHOTO: u('1462331940025-496dfbfc7564'),
    FACT: 'A day on [[Venus]] is longer than its year',
    EXPLANATION: 'Venus rotates once every 243 Earth days but orbits the Sun in 225.',
    MORE_INFO: 'nasa.gov/solar-system/venus',
    LOGO: '',
  },
  'general-info-card': {
    PHOTO: u('1454165804606-c3d57bc86b40'),
    TITLE: 'Understanding [Remote Work] Policies',
    SUBTITLE: 'A practical guide for hybrid teams',
    DESCRIPTION: 'Clear expectations on availability, channels, and core hours keep distributed teams aligned.',
    LOGO: '',
  },

  'high-ticket-freelance-card': {
    PHOTO_LEFT: u('1522071820081-009f0129c71c', 600),
    PHOTO_RIGHT: u('1497366216548-37526070297c', 600),
    TITLE: 'Land [[$10K clients]] without cold outreach',
    SUBTITLE: 'Position your offer around outcomes, not hourly rates, and close retainers faster.',
    LOGO: '',
  },
  'micro-saas-builder-card': {
    PHOTO: u('1511467687858-090d0d1a6522'),
    TITLE: 'Ship your first [[micro-SaaS]] in 30 days',
    STEP1: '1. Validate one painful workflow with 5 interviews',
    STEP2: '2. Build a narrow MVP with billing on day one',
    STEP3: '3. Launch to a single niche community',
    STEP4: '4. Iterate weekly from support tickets',
    LOGO: '',
  },
  'solopreneur-systems-card': {
    PHOTO_1: u('1611532641345-41f5f1b1d8a3', 500),
    PHOTO_2: u('1544244015-0df4b3ffc6b0', 500),
    PHOTO_3: u('1587825140708-dfaf72ae4bec', 500),
    PHOTO_4: u('1512941937669-90a1b58e7e9c', 500),
    TITLE: 'Automate the busywork. Protect the [[deep work]].',
    LOGO: '',
  },
  'remote-team-culture-card': {
    PHOTO: u('1487958449943-2429e8be8625'),
    QUOTE: 'Culture is how people behave when no one is watching the calendar.',
    SUBTITLE: '— Remote leadership playbook',
    LOGO: '',
  },
  'ai-prompt-enterprise-card': {
    PHOTO: u('1677442136019-21780ecad995'),
    TITLE: 'Enterprise [[prompt systems]] that scale',
    SUBTITLE: 'Governance, evaluation, and versioning for production LLM workflows.',
    LOGO: '',
  },
  'container-home-design-card': {
    PHOTO_LEFT: u('1518780664697-10e978683fed', 600),
    PHOTO_RIGHT: u('1586023492125-27b2c045efd7', 600),
    TITLE: 'Brutalist shell. [[Luxury]] interior.',
    SUBTITLE: 'How shipping-container architecture is redefining affordable high-design living.',
    LOGO: '',
  },
  'heritage-restoration-card': {
    PHOTO_LEFT: u('1560448204-e02f11c45748', 600),
    PHOTO_RIGHT: u('1616486338812-3fada67843fe', 600),
    LEFT_LABEL: '1920s Original',
    RIGHT_LABEL: 'Modern Restored',
    TITLE: 'Heritage restoration done right',
    LOGO: '',
  },
  'biophilic-interior-card': {
    PHOTO: u('1583847268969-b962dc3ac5ef'),
    TITLE: 'Design that breathes with [[nature]]',
    SUBTITLE: 'Skylights, living walls, and oak textures for calmer, healthier rooms.',
    LOGO: '',
  },
  'tiny-house-glamping-card': {
    PHOTO_1: u('1449158743715-f0001b208d3e', 500),
    PHOTO_2: u('1518780664697-10e978683fed', 500),
    PHOTO_3: u('1470770841076-f0c3a4d5a1d5', 500),
    PHOTO_4: u('1501785880828-f957dc43d047', 500),
    TITLE: 'Glass A-Frame in the pines',
    RATING_1_LABEL: 'Design',
    RATING_1_SCORE: '9.2',
    RATING_2_LABEL: 'Location',
    RATING_2_SCORE: '10',
    LOGO: '',
  },
  'commercial-re-syndication-card': {
    PHOTO: u('1486406146926-c627a92ad1ab'),
    TITLE: 'Institutional-grade [[CRE]] access',
    SUBTITLE: 'Diversified exposure to core office and logistics assets with transparent reporting.',
    LOGO: '',
  },
  'restomod-porsche-card': {
    PHOTO_LEFT: u('1503376780353-7ebb82114f20', 600),
    PHOTO_RIGHT: u('1492144534655-ae79c964c9d7', 600),
    TITLE: '[[Restomod]] culture rises',
    SUBTITLE: 'Classic silhouettes meet modern performance in warehouse-built 911s.',
    LOGO: '',
  },
  'vintage-watch-collecting-card': {
    PHOTO: u('1523171136478-4d7ff290aa41'),
    TITLE: '1970s dial. [[Modern]] movement.',
    SUBTITLE: 'What collectors look for when comparing vintage pieces to faithful reissues.',
    LOGO: '',
  },
  'mechanical-keyboards-card': {
    PHOTO: u('1595222455819-87196f2c8a0a'),
    TITLE: 'Pastel keycaps. [[Brass]] plate. Perfect sound.',
    SUBTITLE: "A builder's guide to tactile switches, foam, and artisan caps.",
    LOGO: '',
  },
  'audiophile-gear-card': {
    PHOTO: u('1598487653445-a36b4d4e2b4a'),
    TITLE: 'Tube warmth meets [[modern]] DACs',
    SUBTITLE: 'Signal path, impedance, and why listening rooms matter more than hype.',
    LOGO: '',
  },
  'whiskey-investment-card': {
    PHOTO: u('1527281400685-1acd2a6a1c8a'),
    TITLE: 'Rare casks as [[alternative]] assets',
    SUBTITLE: 'How provenance, age statements, and limited releases drive collector demand.',
    LOGO: '',
  },
  'longevity-biohacking-card': {
    PHOTO: u('1571019613454-1cb2f99b2d8b'),
    TITLE: 'Recovery metrics that [[matter]]',
    SUBTITLE: 'HRV, sleep depth, and red-light protocols in evidence-based longevity plans.',
    LOGO: '',
  },
  'pediatric-neurodiversity-card': {
    PHOTO: u('1587654780291-7c9d9dc262331'),
    TITLE: 'Calm spaces for [[sensory]] learning',
    SUBTITLE: 'Routines, textures, and visual schedules that support focused play.',
    LOGO: '',
  },
  'athletic-sleep-optimization-card': {
    PHOTO: u('1541781774459-bb2a7f055e09'),
    TITLE: 'Sleep is the [[performance]] multiplier',
    SUBTITLE: 'Cool rooms, consistent bedtimes, and wind-down rituals for elite recovery.',
    LOGO: '',
  },
  'executive-ergonomics-card': {
    PHOTO: u('1593640408189-3f8a0f3d6ffd'),
    TITLE: 'Your chair is a [[strategy]] decision',
    SUBTITLE: 'Neutral spine, monitor height, and micro-breaks reduce executive fatigue.',
    LOGO: '',
  },
  'functional-medicine-nutrition-card': {
    PHOTO: u('1512621776951-a57141f2eefd'),
    TITLE: 'Food as [[clinical]] input',
    SUBTITLE: 'Whole ingredients, gut diversity, and anti-inflammatory patterns that stick.',
    LOGO: '',
  },
  'micro-angel-investing-card': {
    PHOTO: u('1521737711894-6748f84b4b9c'),
    TITLE: 'Write [[$25K]] checks with conviction',
    SUBTITLE: 'How operators angel into pre-seed teams they can actively support.',
    LOGO: '',
  },
  'agriculture-land-investing-card': {
    PHOTO: u('1506377247377-2a5b3b417ead'),
    TITLE: 'Timberland & [[vineyard]] yields',
    SUBTITLE: 'Farmland and managed forestry as inflation-aware portfolio ballast.',
    LOGO: '',
  },
  'saas-acquisition-flip-card': {
    PHOTO: u('1558494949-ef010cbdcc31'),
    TITLE: 'Buy distressed. [[Rebuild]] MRR.',
    SUBTITLE: 'Operational playbooks for turning under-monetized SaaS into cash-flow assets.',
    LOGO: '',
  },
  'web3-micro-grants-card': {
    PHOTO: u('1639762681485-074b7f938ba0'),
    TITLE: '[[Micro-grants]] for open builders',
    SUBTITLE: 'Funding public goods, dev tooling, and protocol experiments at small scale.',
    LOGO: '',
  },
  'dividend-growth-card': {
    PHOTO: u('1611974789855-9c2a0a0e6382'),
    TITLE: 'Compounding [[income]] portfolios',
    SUBTITLE: 'Quality cash flows, payout ratios, and decades of dividend growth history.',
    LOGO: '',
  },
  'nocode-enterprise-card': {
    PHOTO: u('1557683316-973673baf926'),
    TITLE: 'No-code [[architecture]] for ops teams',
    SUBTITLE: 'Connect CRM, billing, and internal tools without waiting on engineering queues.',
    LOGO: '',
  },
  'devops-automation-card': {
    PHOTO: u('1461749280684-dccba630e2f6'),
    TITLE: 'Pipelines that [[ship]] while you sleep',
    SUBTITLE: 'CI/CD, infra as code, and observability patterns for reliable releases.',
    LOGO: '',
  },
  'privacy-data-engineering-card': {
    PHOTO: u('1555949963-aa79dcee981c'),
    TITLE: 'Privacy-first [[data]] pipelines',
    SUBTITLE: 'Encryption, access controls, and audit trails for regulated environments.',
    LOGO: '',
  },
  'ai-ecommerce-personalization-card': {
    PHOTO: u('1441986300917-64674bd600d8'),
    TITLE: 'Personalization without [[creepiness]]',
    SUBTITLE: 'On-site recommendations that respect consent and improve conversion.',
    LOGO: '',
  },
  'sustainable-supply-chain-card': {
    PHOTO: u('1601584129945-219816deb2b8'),
    TITLE: 'Greener [[logistics]] networks',
    SUBTITLE: 'Electric fleets, route optimization, and transparent emissions reporting.',
    LOGO: '',
  },
  'deep-space-astrophoto-card': {
    PHOTO: u('1419246902791-3e06470baffe'),
    TITLE: 'Orion in [[true color]]',
    SUBTITLE: 'Narrowband stacks and tracking mounts for backyard deep-sky imaging.',
    LOGO: '',
  },
  'quantum-computing-card': {
    PHOTO: u('1635070041078-e43db80487f7'),
    TITLE: 'Qubits meet [[reality]]',
    SUBTITLE: 'Where error correction and cryogenic systems are pushing the field today.',
    LOGO: '',
  },
  'deep-ocean-marine-card': {
    PHOTO: u('1559823818-0a1dd6d38b06'),
    TITLE: 'Life in the [[midnight]] zone',
    SUBTITLE: 'Bioluminescence and pressure-adapted species in the deep ocean.',
    LOGO: '',
  },
  'paleontology-dig-card': {
    PHOTO: u('1582719478250-c89cae4dc85b'),
    TITLE: 'Bones in the [[badlands]]',
    SUBTITLE: 'Field notes from a late Cretaceous site in Montana.',
    LOGO: '',
  },
  'materials-science-card': {
    PHOTO: u('1581094794329-c8112a89af12'),
    TITLE: 'Carbon fiber [[everywhere]]',
    SUBTITLE: 'Why weave patterns and resin systems define strength-to-weight ratios.',
    LOGO: '',
  },
  'cyberpunk-cinema-card': {
    PHOTO: u('1515636948829-bf8ee0c37711'),
    TITLE: 'Neon rain. [[Neon]] regret.',
    SUBTITLE: 'Rating the best cyberpunk films for atmosphere, world-building, and score.',
    LOGO: '',
  },
  'indie-game-studio-card': {
    PHOTO: u('1511512578047-dfb367046420'),
    TITLE: 'Pixels with [[personality]]',
    SUBTITLE: 'Inside a two-person studio shipping a handcrafted roguelike.',
    LOGO: '',
  },
  'retro-anime-cells-card': {
    PHOTO: u('1578632762645-d39612fddf4e'),
    TITLE: 'Hand-painted [[skies]] of the 90s',
    SUBTITLE: 'Why original production cels remain treasured by collectors.',
    LOGO: '',
  },
  'peak-tv-screenplay-card': {
    PHOTO: u('1485846234645-a62644f84728'),
    TITLE: 'INT. APARTMENT — [[NIGHT]]',
    SUBTITLE: 'How a single scene turn redefines the entire season arc.',
    LOGO: '',
  },
  'true-crime-forensic-card': {
    PHOTO: u('1450101499163-c8848c66ca85'),
    TITLE: 'Evidence in the [[folder]]',
    SUBTITLE: 'Declassified notes from a cold case reopened in 1987.',
    LOGO: '',
  },
  'bespoke-leather-card': {
    PHOTO: u('1601925260368-ae2f83cf8b47'),
    TITLE: 'Every stitch by [[hand]]',
    SUBTITLE: 'Waxed thread, vegetable-tanned hides, and a lifetime of patina.',
    LOGO: '',
  },
  'brutalist-graphic-design-card': {
    PHOTO: u('1618005182382-a83a8bd57fbe'),
    TITLE: 'Xerox. Distort. [[Repeat]].',
    SUBTITLE: 'Anti-design posters that reject polish on purpose.',
    LOGO: '',
  },
  'sustainable-haute-couture-card': {
    PHOTO: u('1558171813-edc850d53133'),
    TITLE: 'Runway with [[low impact]]',
    SUBTITLE: 'Organic silks, natural dyes, and circular atelier practices.',
    LOGO: '',
  },
  'ceramic-arts-card': {
    PHOTO: u('1578662996442-48f60103fc96'),
    TITLE: 'Clay on the [[wheel]]',
    SUBTITLE: 'Centering, pulling walls, and the quiet rhythm of the studio.',
    LOGO: '',
  },
  'architectural-model-making-card': {
    PHOTO: u('1503387762-592deb58ef4e'),
    TITLE: 'City at [[1:500]] scale',
    SUBTITLE: 'Laser-cut balsa, tweezers, and patience in the model shop.',
    LOGO: '',
  },
  'polar-expedition-card': {
    PHOTO: u('1551522433-2665e8bb2e85'),
    TITLE: 'Camp beside the [[ice]]',
    SUBTITLE: 'Route planning, layering systems, and safety in Arctic crossings.',
    LOGO: '',
  },
  'spearfishing-card': {
    PHOTO: u('1559824482-63c8b7560b3c'),
    TITLE: 'Blue water. [[Clean]] shot.',
    SUBTITLE: 'Breath-hold technique and sustainable spearfishing ethics.',
    LOGO: '',
  },
  'alpine-cabin-review-card': {
    PHOTO: u('1518684079-3c830dcef090'),
    TITLE: 'Off-grid [[alpine]] retreat',
    SUBTITLE: 'Fireplace warmth, solar arrays, and views worth the climb.',
    LOGO: '',
  },
  'mountaineering-tech-card': {
    PHOTO: u('1464822759023-fed622ff2c3d'),
    TITLE: 'Gear tested on [[vertical]] ice',
    SUBTITLE: 'Crampons, harness systems, and layering for high-altitude routes.',
    LOGO: '',
  },
  'catamaran-community-card': {
    PHOTO: u('1544551763-77af6964d786'),
    TITLE: 'Life on the [[trampoline]] net',
    SUBTITLE: 'Live-aboard crews sharing routes, repairs, and turquoise anchorages.',
    LOGO: '',
  },
};

const REGISTRY = [...LEGACY_TEMPLATE_REGISTRY, ...NICHE_TEMPLATE_REGISTRY];

for (const def of REGISTRY) {
  const sample = SAMPLES[def.id];
  if (!sample) {
    console.error(`Missing sample for template: ${def.id}`);
    process.exit(1);
  }
  for (const field of def.fields) {
    if (sample[field.key] === undefined) {
      console.error(`Missing field ${field.key} in sample for ${def.id}`);
      process.exit(1);
    }
  }
}

const file = `/**
 * Curated gallery sample rows — one entry per template.
 * Regenerate: node scripts/generate-sample-data.mjs
 */

export const BUILTIN_SAMPLES = ${JSON.stringify(SAMPLES, null, 2)};
`;

writeFileSync(outPath, file, 'utf8');
console.log(`Wrote ${Object.keys(SAMPLES).length} complete template samples to ${outPath}`);
