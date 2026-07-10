/**
 * Generates curated sample rows for audience templates.
 * Run after: node scripts/generate-audience-templates.mjs
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { AUDIENCE_TEMPLATE_REGISTRY } from '../src/templates/audienceTemplateRegistry.js';

const outPath = join(dirname(fileURLToPath(import.meta.url)), '../src/features/domain/audienceTemplateSamples.js');

const u = (id, w = 1080) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** @type {Record<string, Record<string, string>>} */
const COPY = {
  'neuro-play-room-card': {
    PHOTO: u('1586023492125-27b2c045efd7'),
    TITLE: 'Sensory Workspace Layouts',
    SUBTITLE: 'Replacing bright plastic toys with muted natural textures reduces sensory overload and extends independent play focus by 40%.',
    LOGO: '',
  },
  'newborn-micro-investment-card': {
    PHOTO_LEFT: u('1515488764276-beab760ff84a', 600),
    PHOTO_RIGHT: u('1611974789855-9c2a0a0e9a0b', 600),
    TITLE: 'The 18-Year Compound Leverage',
    SUBTITLE: 'Investing just $50 a week in index funds from birth creates a $120,000 launchpad for adulthood tax-free.',
    LOGO: '',
  },
  'computational-literacy-kids-card': {
    PHOTO_1: u('1503454537847-5457f8a0f2e', 600),
    PHOTO_2: u('1587654780292-633765704120', 600),
    PHOTO_3: u('1509062520806-5315964c2690', 600),
    PHOTO_4: u('1516627145497-ae697889e690', 600),
    TITLE: 'Algorithmic Thinking Before Screens',
    SUBTITLE: 'Tip #2: Teach loops and conditionals using physical grid blocks before introducing software tools.',
    LOGO: '',
  },
  'pediatric-biome-strategy-card': {
    PHOTO: u('1490645935967-10de6ba17061'),
    TITLE: 'Rebuilding the Post-Antibiotic Microbiome',
    SUBTITLE: 'Introducing strain-targeted probiotics within 48 hours of an antibiotic cycle helps preserve native gut flora diversity.',
    LOGO: '',
  },
  'scholarship-prompt-hacking-card': {
    PHOTO: u('1517699253803-0a4bd892112b'),
    TITLE: 'Prompting Your Way to Free Tuition',
    SUBTITLE: 'Build a custom language model persona that scans essay prompts, identifies hidden rubrics, and formats winning drafts.',
    LOGO: '',
  },
  'micro-agency-solopreneur-card': {
    PHOTO_LEFT: u('1551288049-bebda4e38f71', 600),
    PHOTO_RIGHT: u('1460925895917-afdab827c52f', 600),
    TITLE: 'Flipping No-Code Automations',
    SUBTITLE: 'The 3-step blueprint for building lead-generation systems for local businesses using simple AI integrations. Charge $2k/mo.',
    LOGO: '',
  },
  'digital-fashion-reselling-card': {
    PHOTO: u('1620641788421-7a1c345ea42a'),
    TITLE: 'Sourcing Rare Skins for Profit',
    SUBTITLE: 'Limited drop virtual wearables are matching real-world streetwear margins before trading volume spikes.',
    LOGO: '',
  },
  'indie-game-micro-funding-card': {
    PHOTO_1: u('1552820728-8b83bb6b773f', 600),
    PHOTO_2: u('1511512578047-dfb367046420', 600),
    PHOTO_3: u('1542753448-9bc1c026ffe3', 600),
    PHOTO_4: u('1614680376613-7d9a0a1f7a06', 600),
    TITLE: 'Funding Your First Steam Launch',
    SUBTITLE: 'Leverage micro-grants and community-led publisher funding without taking corporate venture dilution.',
    LOGO: '',
  },
  'corporate-saas-exit-card': {
    PHOTO: u('1486406146926-c627a92ad1ab'),
    TITLE: 'Replacing Your 9-to-5 with Micro-SaaS',
    SUBTITLE: 'Use low-code frameworks to launch niche B2B scheduling tools, hit $10k MRR, and resign in 9 months.',
    LOGO: '',
  },
  'fertility-nutrition-longevity-card': {
    PHOTO: u('1490645935967-10de6ba17061'),
    TITLE: 'Cellular Energy for Egg Quality',
    SUBTITLE: 'Optimizing mitochondrial function via CoQ10 supplementation and low-glycemic eating before a conception window.',
    LOGO: '',
  },
  'multifamily-syndication-30s-card': {
    PHOTO_LEFT: u('1564014059786-c59d265c168e', 600),
    PHOTO_RIGHT: u('1545324418-20ad527c0a0b', 600),
    TITLE: 'Passive Multifamily Syndication',
    SUBTITLE: 'Accredited tech professionals pool capital into commercial upgrades to offset 40% of active W2 tax liability.',
    LOGO: '',
  },
  'digital-nomad-family-card': {
    PHOTO_1: u('1499793983690-e29da59ef805', 600),
    PHOTO_2: u('1553062407-98ae2248c792', 600),
    PHOTO_3: u('1503676260728-1c00da094a0b', 600),
    PHOTO_4: u('1556742049-0cfed4f6a45d', 600),
    TITLE: 'Structuring Remote International Base Camps',
    SUBTITLE: 'Tip #4: Book villas within 10 minutes of accredited co-learning spaces to maintain work sprints while traveling with toddlers.',
    LOGO: '',
  },
  'dynasty-trust-legacy-card': {
    PHOTO: u('1564014059786-c59d265c168e'),
    TITLE: 'Bypassing Probate with Dynasty Trusts',
    SUBTITLE: 'Isolate real estate and equity portfolios into irrevocable instruments that protect heirs from 40% inheritance taxes.',
    LOGO: '',
  },
  'senior-joint-ergonomics-card': {
    PHOTO_LEFT: u('1571019614248-1cb5114bf937', 600),
    PHOTO_RIGHT: u('1576091160399-112ba8d25d1f', 600),
    TITLE: 'Preserving Hip Hinge Mechanics',
    SUBTITLE: 'Protect your lower back during retirement activities by mastering the hip hinge over the squat.',
    LOGO: '',
  },
  'luxury-rv-retirement-card': {
    PHOTO_1: u('1527786350418-8e1781571099', 600),
    PHOTO_2: u('1504280390367-361c6d9d38f4', 600),
    PHOTO_3: u('1556911220-e15b29be8c8f', 600),
    PHOTO_4: u('1506905925346-21bda4d32df4', 600),
    TITLE: 'The Luxury Nomad Retirement',
    SUBTITLE: 'Discover top-tier private RV cooperatives offering deeded lot ownership, solar microgrids, and country club amenities.',
    LOGO: '',
  },
  'non-executive-board-seating-card': {
    PHOTO: u('1497366216548-37526070297c'),
    TITLE: 'Securing Non-Executive Director Roles',
    SUBTITLE: 'Transition 30 years of operational management into advisory board seats that pay $50k/year for 4 meetings.',
    LOGO: '',
  },
  'cold-chain-shipping-card': {
    PHOTO: u('1494415852008-9c88a75611e7'),
    TITLE: 'Pharma Cold-Chain Validation',
    SUBTITLE: 'Prevent temperature excursions in biological shipping containers using automated IoT data alerts.',
    LOGO: '',
  },
  'yacht-charter-brokerage-card': {
    PHOTO_LEFT: u('1567899378494-47b945a2f0b0', 600),
    PHOTO_RIGHT: u('1544551763-77af6964d786', 600),
    TITLE: 'Sourcing a Superyacht Crew',
    SUBTITLE: 'Insider rules for auditing structural safety and crew performance before signing a $150k weekly charter lease.',
    LOGO: '',
  },
  'cnc-precision-manufacturing-card': {
    PHOTO_1: u('1581091226825-a6a2a5aee158', 600),
    PHOTO_2: u('1565192447864-969366652daa', 600),
    PHOTO_3: u('1581092160562-40aa08e78837', 600),
    PHOTO_4: u('1504917591847-08329c491b8b', 600),
    TITLE: 'Minimizing Tool Head Deflection',
    SUBTITLE: 'Tip #1: Calibrate spindle speeds to match harmonic resonant frequencies and eliminate structural cutting micro-cracks.',
    LOGO: '',
  },
  'micro-hydro-turbine-card': {
    PHOTO: u('1439066615861-d1af74d74000'),
    TITLE: '24/7 Off-Grid Water Power',
    SUBTITLE: 'A micro-hydro turbine in a continuous 5-GPM stream yields reliable baseline home power all winter.',
    LOGO: '',
  },
  'jewelry-gold-casting-card': {
    PHOTO: u('1611595431786-5de7589c6d89'),
    TITLE: 'Preventing Casting Porosity',
    SUBTITLE: 'Manage vacuum pressure inside investment plaster molds to achieve flawless 18k gold surfaces.',
    LOGO: '',
  },
  'architectural-lighting-design-card': {
    PHOTO_LEFT: u('1618221195710-dd6b41fa2c66', 600),
    PHOTO_RIGHT: u('1503387762-592deb58ef4e', 600),
    TITLE: 'The Art of Invisible Sources',
    SUBTITLE: 'Hide light fixtures entirely from line-of-sight, letting only ambient bounce illumination define the geometry.',
    LOGO: '',
  },
  'japanese-wood-joinery-card': {
    PHOTO_1: u('1601925260368-ae2f83cf8b47', 600),
    PHOTO_2: u('1452866321262-8293606d8fa1', 600),
    PHOTO_3: u('1503602642457-2321742693ea', 600),
    PHOTO_4: u('1586023492125-27b2c045efd7', 600),
    TITLE: 'Mastering the Kanawa Tsugi Joint',
    SUBTITLE: 'A traditional Japanese interlocking splice joint that withstands immense shear stress without metal screws or glue.',
    LOGO: '',
  },
  'oil-painting-conservation-card': {
    PHOTO: u('1579783902617-a79fb86a747c'),
    TITLE: 'Safely Removing Yellow Varnish',
    SUBTITLE: 'Use custom blended solvent formulas to strip oxidized mastic varnishes without disrupting fragile pigment layers.',
    LOGO: '',
  },
  'tbi-recovery-protocols-card': {
    PHOTO: u('1559757175-0eb9677a589e'),
    TITLE: 'Accelerating Post-Concussion Neuroplasticity',
    SUBTITLE: 'Combine low-level near-infrared laser therapies with hyperbaric protocols to reduce persistent brain tissue inflammation.',
    LOGO: '',
  },
  'executive-vocal-health-card': {
    PHOTO_LEFT: u('1475729749735-6b3932d2b574', 600),
    PHOTO_RIGHT: u('1576091160399-112ba8d25d1f', 600),
    TITLE: 'Vocal Fatigue Prevention for Keynotes',
    SUBTITLE: 'Tip #3: Perform semi-occluded vocal tract exercises using a water straw before taking the stage.',
    LOGO: '',
  },
  'sensory-integration-therapy-card': {
    PHOTO_1: u('1503454537847-5457f8a0f2e', 600),
    PHOTO_2: u('1586023492125-27b2c045efd7', 600),
    PHOTO_3: u('1509062520806-5315964c2690', 600),
    PHOTO_4: u('1516627145497-ae697889e690', 600),
    TITLE: 'Designing a Sensory Regulation Nook',
    SUBTITLE: 'Position deep-pressure vestibular equipment within a classroom to help neurodivergent kids self-regulate.',
    LOGO: '',
  },
  'hypoxic-adaptation-training-card': {
    PHOTO: u('1464822759023-fed622ff2c3d'),
    TITLE: 'Simulating Altitude on Sea-Level Tracks',
    SUBTITLE: 'Restricting air intake during high-intensity intervals triggers rapid red blood cell production without high-altitude travel.',
    LOGO: '',
  },
  'mineral-rights-acquisition-card': {
    PHOTO: u('1509316785289-025f5b846583'),
    TITLE: 'Investing in Sub-Surface Mineral Leases',
    SUBTITLE: 'Family offices bypass real estate volatility by buying perpetual sub-surface royalty rights to high-producing gas land.',
    LOGO: '',
  },
  'expired-domain-flipping-card': {
    PHOTO_LEFT: u('1551288049-bebda4e38f71', 600),
    PHOTO_RIGHT: u('1460925895917-afdab827c52f', 600),
    TITLE: 'Monetizing High-Authority Domain Drops',
    SUBTITLE: 'Locate dropped business domains that still hold valuable historical search ranking backlinks for instant profit.',
    LOGO: '',
  },
  'orchid-hybrid-cultivation-card': {
    PHOTO_1: u('1463933898007-0f6abad60da0', 600),
    PHOTO_2: u('1466692476869-a0881dee0f6f', 600),
    PHOTO_3: u('1416879595882-3373a0480b05', 600),
    PHOTO_4: u('1490759847868-88d6d6a5f7eb', 600),
    TITLE: 'The Economics of Orchid Tissue Cloning',
    SUBTITLE: 'A single successful hybrid crossing can yield thousands of tissue clones commanding premium wholesale prices globally.',
    LOGO: '',
  },
  'car-wash-portfolio-card': {
    PHOTO: u('1607860104195-20a71ba7461a'),
    TITLE: 'The Subscription Car Wash Flywheel',
    SUBTITLE: 'Converting single washes into recurring monthly membership passes creates predictable, hands-off retail asset cash flows.',
    LOGO: '',
  },
  'serverless-cloud-architecture-card': {
    PHOTO: u('1558494949-ef010cbdcc31'),
    TITLE: 'Cutting AWS Cloud Waste by 60%',
    SUBTITLE: 'Move erratic microservice APIs into self-scaling serverless functions to eliminate massive idle compute spending.',
    LOGO: '',
  },
  'penetration-testing-cyber-card': {
    PHOTO_LEFT: u('1550751827-4bd374c3f58b', 600),
    PHOTO_RIGHT: u('1526374965328-7f61d4dc18c7', 600),
    TITLE: 'Simulating Active Directory Exploit Paths',
    SUBTITLE: 'Deploy mock credential dumping attacks to identify domain admin vulnerabilities before ransomware groups do.',
    LOGO: '',
  },
  'ecommerce-checkout-ui-card': {
    PHOTO_1: u('1611162617474-5b21e279e113', 600),
    PHOTO_2: u('1512941937669-90a1b58e7ddc', 600),
    PHOTO_3: u('1556742049-0cfed4f6a45d', 600),
    PHOTO_4: u('1551288049-bebda4e38f71', 600),
    TITLE: 'Optimizing the Mobile Checkout Screen',
    SUBTITLE: 'Tip #2: Remove all header navigation from the final payment page. Any external link reduces conversion rates by 8%.',
    LOGO: '',
  },
  'self-hosted-data-warehouse-card': {
    PHOTO: u('1558494949-ef010cbdcc31'),
    TITLE: 'Bypassing Third-Party Cloud Risks',
    SUBTITLE: 'Build internal analytical data lakes on self-hosted open-source tools without violating strict privacy laws.',
    LOGO: '',
  },
  'exoplanet-spectroscopy-card': {
    PHOTO: u('1446776653963-447c1ab0434f'),
    TITLE: 'Detecting Biosignature Gaps on Exoplanets',
    SUBTITLE: 'Analyzing infrared star rays filtering through a distant planet\'s air envelope reveals methane gas cycles.',
    LOGO: '',
  },
  'hypernova-gamma-burst-card': {
    PHOTO_LEFT: u('1419247417950-838397cc6332', 600),
    PHOTO_RIGHT: u('1462331940022-916cf1122c4b', 600),
    TITLE: 'The Universe\'s Most Violent Explosions',
    SUBTITLE: 'When a massive star collapses into a black hole, it fires gamma radiation releasing more energy in 10 seconds than our sun in 10 billion years.',
    LOGO: '',
  },
  'europa-ocean-chemistry-card': {
    PHOTO_1: u('1614732414449-2f05099b4e77', 600),
    PHOTO_2: u('1559824482-63c8b7560b3c', 600),
    PHOTO_3: u('1551288049-bebda4e38f71', 600),
    PHOTO_4: u('1451187580459-43490279c0fa', 600),
    TITLE: 'Hunting for Life in Jupiter\'s Moons',
    SUBTITLE: 'Europa\'s deep sub-surface oceans are kept warm by tidal friction, making them prime candidates for alien marine ecosystems.',
    LOGO: '',
  },
  'white-dwarf-crystallization-card': {
    PHOTO: u('1419247417950-838397cc6332'),
    TITLE: 'The Giant Cosmic Diamonds',
    SUBTITLE: 'As a white dwarf cools over billions of years, internal pressure forces its carbon core to solidify into a massive crystal lattice.',
    LOGO: '',
  },
  'icebreaker-polar-navigation-card': {
    PHOTO: u('1551522433-2665e8bb2e85'),
    TITLE: 'Navigating Multi-Year Polar Pack Ice',
    SUBTITLE: 'Modern icebreakers ride up onto thick ice sheets, using the ship\'s sheer weight to crush sheets downward.',
    LOGO: '',
  },
  'high-altitude-weather-station-card': {
    PHOTO_LEFT: u('1464822759023-fed622ff2c3d', 600),
    PHOTO_RIGHT: u('1592210458129-8d721d68d254', 600),
    TITLE: 'Maintaining Sensors in 100-Knot Freezing Winds',
    SUBTITLE: 'High-altitude weather gear must use heated internal housing to prevent ice build-ups from locking wind speed devices.',
    LOGO: '',
  },
  'earthship-desert-architecture-card': {
    PHOTO_1: u('1509316785289-025f5b846583', 600),
    PHOTO_2: u('1416879595882-3373a0480b05', 600),
    PHOTO_3: u('1508518078800-1541be7e4b05', 600),
    PHOTO_4: u('1564014059786-c59d265c168e', 600),
    TITLE: 'Passive Heating in Arid Earthships',
    SUBTITLE: 'Tip #3: Build living spaces deep behind a heavy dirt-packed northern wall that radiates heat back all night.',
    LOGO: '',
  },
  'deep-cave-speleology-card': {
    PHOTO: u('1544735719640-a63bd4fc330d'),
    TITLE: 'Rigging Single Rope Lines in Sub-Surface Caverns',
    SUBTITLE: 'Tip #1: Use stainless steel expansion bolts at primary drop stations to prevent moisture from degrading anchor points.',
    LOGO: '',
  },
};

for (const def of AUDIENCE_TEMPLATE_REGISTRY) {
  const sample = COPY[def.id];
  if (!sample) {
    console.error(`Missing sample copy for ${def.id}`);
    process.exit(1);
  }
  for (const field of def.fields) {
    if (sample[field.key] === undefined) {
      console.error(`Missing field ${field.key} in sample for ${def.id}`);
      process.exit(1);
    }
  }
}

writeFileSync(
  outPath,
  `/** Curated gallery samples for audience templates. Regenerate: node scripts/generate-audience-samples.mjs */\n\nexport const AUDIENCE_SAMPLES = ${JSON.stringify(COPY, null, 2)};\n`,
  'utf8',
);

console.log(`Wrote ${Object.keys(COPY).length} audience samples to ${outPath}`);
