import { useEffect } from 'react';

export interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  canonical?: string;
  structuredData?: object;
  noindex?: boolean;
}

/**
 * SEO Component for dynamic meta tag management
 * Updates page-specific meta tags for better search engine optimization
 * Includes cleanup to remove dynamic structured data on unmount
 */
export function useSEO(config: SEOConfig) {
  useEffect(() => {
    // Store original title for potential cleanup
    const originalTitle = document.title;

    // Update document title
    if (config.title) {
      document.title = config.title;
      updateMetaTag('name', 'title', config.title);
      updateMetaTag('property', 'og:title', config.ogTitle || config.title);
      updateMetaTag('name', 'twitter:title', config.twitterTitle || config.title);
    }

    // Update description
    if (config.description) {
      updateMetaTag('name', 'description', config.description);
      updateMetaTag('property', 'og:description', config.ogDescription || config.description);
      updateMetaTag('name', 'twitter:description', config.twitterDescription || config.description);
    }

    // Update keywords
    if (config.keywords) {
      updateMetaTag('name', 'keywords', config.keywords);
    }

    // Update canonical URL
    if (config.canonical) {
      const canonicalUrl = config.canonical.startsWith('http')
        ? config.canonical
        : `${BASE_URL}${config.canonical.startsWith('/') ? '' : '/'}${config.canonical}`;
      updateLinkTag('canonical', canonicalUrl);
    }

    // Update Open Graph URL
    if (config.ogUrl) {
      const ogUrl = config.ogUrl.startsWith('http')
        ? config.ogUrl
        : `${BASE_URL}${config.ogUrl.startsWith('/') ? '' : '/'}${config.ogUrl}`;
      updateMetaTag('property', 'og:url', ogUrl);
      updateMetaTag('name', 'twitter:url', ogUrl);
    }

    // Add structured data if provided, otherwise provide a minimal default
    if (config.structuredData) {
      addStructuredData(config.structuredData);
    } else {
      const fallback = getDefaultStructuredData(config);
      if (fallback) {
        addStructuredData(fallback);
      }
    }

    // Handle noindex pages
    if (config.noindex) {
      updateMetaTag('name', 'robots', 'noindex, nofollow');
    }

    // Cleanup function to remove dynamic structured data on unmount
    // This prevents stale SEO data when navigating between pages in SPA
    return () => {
      const dynamicScript = document.querySelector('script[data-dynamic-seo="true"]');
      if (dynamicScript) {
        dynamicScript.remove();
      }
      // Restore original title if it was changed
      // Page-specific meta tags are left as they get overwritten by next page
    };
  }, [config]);
}

/**
 * Update or create a meta tag
 */
function updateMetaTag(attribute: string, key: string, content: string) {
  let element = document.querySelector(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

/**
 * Update or create a link tag
 */
function updateLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }

  element.href = href;
}

/**
 * Add structured data (JSON-LD) to the page
 */
function addStructuredData(data: object) {
  // Remove existing dynamic structured data
  const existing = document.querySelector('script[data-dynamic-seo="true"]');
  if (existing) {
    existing.remove();
  }

  // Add new structured data
  const script = document.createElement('script');
  script.setAttribute('type', 'application/ld+json');
  script.setAttribute('data-dynamic-seo', 'true');
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

// Base URL for canonical URLs and structured data
import { BASE_URL } from './config';

// ============================================================================
// CENTRALIZED KEYWORD CONFIGURATION - Authority Typing Platform
// ============================================================================

/**
 * Comprehensive keyword database for complete typing mastery coverage.
 * Organized by feature category for deep SEO integration.
 */
export const TYPING_KEYWORDS = {
  // Core Typing Test Keywords
  core: {
    primary: ['typing test', 'typing speed test', 'wpm test', 'free typing test', 'online typing test'],
    secondary: ['typing test online', 'test typing speed', 'free online typing test', 'keyboard typing test'],
    longTail: [
      'test my typing speed',
      'how fast can i type',
      'check typing speed online free',
      '60 second typing test',
      'one minute typing test',
      'typing speed test with timer',
      'quick typing test',
      'instant typing test',
      'accurate typing test',
      'typing test no signup',
    ],
  },

  // WPM Specific Keywords
  wpm: {
    primary: ['wpm test', 'words per minute test', 'wpm calculator', 'typing wpm'],
    secondary: ['check wpm', 'wpm speed test', 'wpm typing test', 'measure wpm'],
    longTail: [
      'what is my wpm',
      'how many words per minute can i type',
      'calculate typing speed wpm',
      'wpm test 1 minute',
      'wpm test online free',
      'accurate wpm test',
      'professional wpm test',
    ],
  },

  // Typing Practice Keywords
  practice: {
    primary: ['typing practice', 'practice typing', 'typing exercises', 'typing drills'],
    secondary: ['free typing practice', 'online typing practice', 'keyboard practice', 'typing trainer'],
    longTail: [
      'daily typing practice',
      'typing practice for adults',
      'typing practice sentences',
      'typing practice paragraphs',
      'professional typing practice',
      'typing practice for work',
      'improve typing with practice',
      'typing practice routine',
    ],
  },

  // Touch Typing & Learning Keywords
  learning: {
    primary: ['learn typing', 'touch typing', 'typing lessons', 'typing tutorial'],
    secondary: ['learn to type', 'typing course', 'typing training', 'keyboard lessons'],
    longTail: [
      'touch typing for beginners',
      'learn touch typing free',
      'proper finger placement typing',
      'typing posture guide',
      'how to type without looking',
      'touch typing techniques',
      'typing lessons for adults',
      'free typing lessons online',
      'typing basics for beginners',
    ],
  },

  // Speed Improvement Keywords
  improvement: {
    primary: ['improve typing speed', 'type faster', 'increase typing speed', 'speed typing'],
    secondary: ['faster typing', 'typing speed improvement', 'boost typing speed', 'quick typing'],
    longTail: [
      'how to type faster',
      'tips to improve typing speed',
      'typing speed improvement exercises',
      'double your typing speed',
      'typing speed training',
      'become a faster typer',
      'professional typing speed',
    ],
  },

  // Accuracy Keywords
  accuracy: {
    primary: ['typing accuracy', 'typing accuracy test', 'accurate typing', 'typing precision'],
    secondary: ['accuracy test', 'typing mistakes', 'error-free typing', 'typing errors'],
    longTail: [
      'improve typing accuracy',
      'reduce typing errors',
      'typing accuracy vs speed',
      'professional typing accuracy',
      '99% typing accuracy',
      'how to type accurately',
    ],
  },

  // Dictation & Audio Keywords - Comprehensive coverage for voice/audio typing
  dictation: {
    primary: ['dictation typing test', 'audio typing test', 'transcription practice', 'listen and type test'],
    secondary: ['dictation typing practice', 'listening typing test', 'speech to text typing', 'dictation mode', 'type what you hear'],
    longTail: [
      'free dictation typing test online',
      'practice transcription typing speed',
      'how to improve dictation accuracy',
      'audio dictation practice for beginners',
      'dictation WPM test',
      'type what you hear test',
      'transcription speed test',
      'listening comprehension typing test',
      'audio transcription practice free',
      'dictation typing test with audio',
      'online dictation practice test',
      'improve listening and typing skills',
      'voice dictation typing practice',
      'speech to text typing test',
      'audio typing speed test',
      'transcription test for jobs',
      'dictation accuracy test online',
      'listen type practice free',
    ],
  },

  // Code Typing Keywords
  code: {
    primary: ['code typing test', 'programming typing test', 'coding speed test', 'developer typing'],
    secondary: ['coding typing practice', 'programmer typing', 'syntax typing', 'code speed test'],
    longTail: [
      'javascript typing test',
      'python typing practice',
      'coding wpm test',
      'programming typing speed',
      'typing test for programmers',
      'developer keyboard skills',
      'code typing practice',
    ],
  },

  // Multiplayer & Competition Keywords
  multiplayer: {
    primary: ['typing race', 'multiplayer typing', 'typing competition', 'typing game'],
    secondary: ['online typing race', 'typing battle', 'competitive typing', 'race typing'],
    longTail: [
      'typeracer alternative free',
      'multiplayer typing race online',
      'typing competition online',
      'compete in typing',
      'typing race with friends',
      'real-time typing race',
    ],
  },

  // Analytics & Progress Keywords
  analytics: {
    primary: ['typing analytics', 'typing progress', 'typing statistics', 'wpm tracking'],
    secondary: ['typing performance', 'keystroke analysis', 'typing metrics', 'progress tracking'],
    longTail: [
      'track typing improvement',
      'typing speed over time',
      'typing heatmap',
      'finger usage statistics',
      'typing weakness analysis',
      'personalized typing insights',
    ],
  },

  // Certificate & Professional Keywords
  certificate: {
    primary: ['typing certificate', 'typing certification', 'wpm certificate', 'typing credentials'],
    secondary: ['verified typing speed', 'professional certificate', 'typing proof', 'certified typist'],
    longTail: [
      'free typing certificate',
      'typing certificate for jobs',
      'professional typing certification',
      'verified wpm certificate',
      'typing speed proof',
      'downloadable typing certificate',
    ],
  },

  // Job & Professional Keywords
  professional: {
    primary: ['typing test for jobs', 'professional typing', 'employment typing test', 'job typing test'],
    secondary: ['work typing test', 'office typing', 'business typing', 'career typing'],
    longTail: [
      'typing speed requirements for jobs',
      'data entry typing test',
      'administrative typing test',
      'secretary typing speed',
      'receptionist typing test',
      'typing requirements by profession',
    ],
  },

  // Education Keywords
  education: {
    primary: ['typing for students', 'student typing test', 'school typing', 'educational typing'],
    secondary: ['kids typing test', 'children typing', 'classroom typing', 'academic typing'],
    longTail: [
      'typing test for kids',
      'typing practice for students',
      'school typing test',
      'typing for middle school',
      'typing for high school',
      'college typing requirements',
    ],
  },

  // Average Speed & Benchmarks Keywords
  benchmarks: {
    primary: ['average typing speed', 'typing speed chart', 'good typing speed', 'typing benchmarks'],
    secondary: ['normal typing speed', 'typing speed by age', 'fast typing speed', 'typing standards'],
    longTail: [
      'average wpm by age',
      'what is good typing speed',
      'professional typing speed requirements',
      'typing speed percentile',
      'how fast should i type',
      'typing speed comparison',
    ],
  },

  // Keyboard & Equipment Keywords
  keyboard: {
    primary: ['keyboard test', 'keyboard tester', 'key test', 'keyboard check'],
    secondary: ['keyboard layout', 'keyboard testing', 'key response test', 'keyboard diagnostics'],
    longTail: [
      'test all keyboard keys',
      'keyboard key tester online',
      'mechanical keyboard test',
      'keyboard ghosting test',
      'n-key rollover test',
      'keyboard input lag test',
    ],
  },

  // Games & Fun Keywords
  games: {
    primary: ['typing games', 'fun typing', 'typing game online', 'keyboard games'],
    secondary: ['typing game free', 'play typing', 'typing challenge', 'typing arcade'],
    longTail: [
      'free typing games online',
      'typing games for adults',
      'typing games for kids',
      'fun way to practice typing',
      'addictive typing games',
      'typing game with levels',
    ],
  },

  // Alternative/Comparison Keywords
  alternatives: {
    primary: ['monkeytype alternative', 'typeracer alternative', 'keybr alternative', '10fastfingers alternative'],
    secondary: ['typing.com alternative', 'nitrotype alternative', 'free typing test alternative'],
    longTail: [
      'best monkeytype alternative',
      'free typeracer alternative',
      'better than monkeytype',
      'typing test like monkeytype',
    ],
  },
} as const;

/**
 * Get combined keywords string for a feature category
 */
export function getKeywordsForFeature(category: keyof typeof TYPING_KEYWORDS, limit = 15): string {
  const keywords = TYPING_KEYWORDS[category];
  const all = [...keywords.primary, ...keywords.secondary, ...keywords.longTail.slice(0, 5)];
  return all.slice(0, limit).join(', ');
}

/**
 * Get all keywords for multiple categories
 */
export function getCombinedKeywords(categories: Array<keyof typeof TYPING_KEYWORDS>, limit = 20): string {
  const all: string[] = [];
  for (const cat of categories) {
    const keywords = TYPING_KEYWORDS[cat];
    all.push(...keywords.primary, ...keywords.secondary.slice(0, 2));
  }
  return [...new Set(all)].slice(0, limit).join(', ');
}

function getDefaultStructuredData(config: SEOConfig): object | null {
  const title = config.title || 'TypeMasterAI';
  const description = config.description || 'Free online typing test with real-time WPM, accuracy tracking, and AI analytics.';
  const url = ((): string => {
    if (config.canonical) return config.canonical.startsWith('http') ? config.canonical : `${BASE_URL}${config.canonical.startsWith('/') ? '' : '/'}${config.canonical}`;
    try {
      const loc = window.location?.href;
      return typeof loc === 'string' && loc ? loc : BASE_URL;
    } catch {
      return BASE_URL;
    }
  })();

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: title, item: url },
        ],
      },
      {
        '@type': 'WebPage',
        'name': title,
        'description': description,
        'url': url,
      },
    ],
  };
}

/**
 * Generate common WebApplication structured data
 */
function getWebAppSchema(pageName: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': `TypeMasterAI ${pageName}`,
    'description': description,
    'url': BASE_URL,
    'applicationCategory': 'EducationalApplication',
    'operatingSystem': 'Web Browser',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.8',
      'ratingCount': '2847',
    },
  };
}

/**
 * Generate BreadcrumbList structured data
 */
export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url,
    })),
  };
}

/**
 * Generate FAQPage structured data
 */
export function getFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer,
      },
    })),
  };
}

/**
 * Generate Product/Service comparison structured data
 */
export function getComparisonSchema(productName: string, competitors: string[], features: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': productName,
    'description': `${productName} comparison with ${competitors.join(', ')}`,
    'brand': {
      '@type': 'Brand',
      'name': 'TypeMasterAI',
    },
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
      'availability': 'https://schema.org/InStock',
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.8',
      'ratingCount': '2847',
    },
  };
}

/**
 * Generate HowTo structured data
 */
export function getHowToSchema(
  name: string,
  description: string,
  steps: Array<{ name: string; text: string }>,
  totalTime?: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    'name': name,
    'description': description,
    'totalTime': totalTime || 'PT5M',
    'estimatedCost': {
      '@type': 'MonetaryAmount',
      'currency': 'USD',
      'value': '0',
    },
    'step': steps.map((step, index) => ({
      '@type': 'HowToStep',
      'position': index + 1,
      'name': step.name,
      'text': step.text,
    })),
  };
}

/**
 * Generate SoftwareApplication structured data for landing pages
 */
export function getSoftwareAppSchema(name: string, description: string, features: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': name,
    'description': description,
    'applicationCategory': ['EducationalApplication', 'UtilitiesApplication'],
    'operatingSystem': 'Any',
    'browserRequirements': 'Requires JavaScript',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
      'availability': 'https://schema.org/InStock',
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.8',
      'bestRating': '5',
      'ratingCount': '2847',
    },
    'featureList': features,
    'author': {
      '@type': 'Organization',
      'name': 'TypeMasterAI',
      'url': BASE_URL,
    },
  };
}

/**
 * Page-specific SEO configurations - Updated January 2026
 */
/**
 * Generate SpeakableSpecification structured data for voice search
 */
export function getSpeakableSchema(cssSelectors: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'speakable': {
      '@type': 'SpeakableSpecification',
      'cssSelector': cssSelectors,
    },
  };
}

/**
 * Generate Course structured data
 */
export function getCourseSchema(name: string, description: string, providerName: string = 'TypeMasterAI') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    'name': name,
    'description': description,
    'provider': {
      '@type': 'Organization',
      'name': providerName,
      'url': BASE_URL
    },
    'isAccessibleForFree': true,
    'educationalLevel': 'Beginner',
  };
}

/**
 * Generate VideoGame structured data
 */
export function getVideoGameSchema(name: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    'name': name,
    'description': description,
    'genre': ['Educational', 'Arcade', 'Typing'],
    'gamePlatform': 'Web Browser',
    'applicationCategory': 'Game',
    'numberOfPlayers': {
      '@type': 'QuantitativeValue',
      'minValue': 1,
      'maxValue': 10,
    },
    'author': {
      '@type': 'Organization',
      'name': 'TypeMasterAI',
      'url': BASE_URL,
    },
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
      'availability': 'https://schema.org/InStock',
    },
  };
}

// ============================================================================
// ENHANCED STRUCTURED DATA SCHEMAS - Topical Authority
// ============================================================================

/**
 * Generate EducationalOccupationalProgram schema for typing courses/lessons
 */
export function getTypingCourseSchema(course: {
  name: string;
  description: string;
  duration?: string;
  modules?: Array<{ name: string; description: string; position: number }>;
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    'name': course.name,
    'description': course.description,
    'provider': {
      '@type': 'Organization',
      'name': 'TypeMasterAI',
      'url': BASE_URL,
      'sameAs': [BASE_URL],
    },
    'courseCode': course.name.replace(/\s+/g, '-').toLowerCase(),
    'educationalLevel': course.skillLevel || 'Beginner',
    'timeRequired': course.duration || 'P4W',
    'isAccessibleForFree': true,
    'inLanguage': 'en',
    'hasCourseInstance': {
      '@type': 'CourseInstance',
      'courseMode': 'online',
      'courseWorkload': course.duration || 'P4W',
    },
    ...(course.modules && {
      'hasPart': course.modules.map((mod) => ({
        '@type': 'Course',
        'name': mod.name,
        'description': mod.description,
        'position': mod.position,
      })),
    }),
    'teaches': [
      'Touch Typing',
      'Keyboard Skills',
      'Typing Speed Improvement',
      'Typing Accuracy',
    ],
  };
}

/**
 * Generate EducationalContent schema for learning pages
 */
export function getEducationalContentSchema(content: {
  name: string;
  description: string;
  educationalLevel?: string;
  learningResourceType?: string;
  teaches?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    'name': content.name,
    'description': content.description,
    'provider': {
      '@type': 'Organization',
      'name': 'TypeMasterAI',
      'url': BASE_URL,
    },
    'educationalLevel': content.educationalLevel || 'Beginner',
    'learningResourceType': content.learningResourceType || 'Tutorial',
    'isAccessibleForFree': true,
    'inLanguage': 'en',
    'teaches': content.teaches || ['Typing Speed', 'Touch Typing', 'Keyboard Skills'],
    'audience': {
      '@type': 'EducationalAudience',
      'educationalRole': 'student',
    },
  };
}

/**
 * Generate ProfessionalService schema for job-related typing content
 */
export function getProfessionalTypingSchema(service: {
  name: string;
  description: string;
  serviceType?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    'name': service.name,
    'description': service.description,
    'serviceType': service.serviceType || 'Typing Assessment',
    'provider': {
      '@type': 'Organization',
      'name': 'TypeMasterAI',
      'url': BASE_URL,
    },
    'areaServed': 'Worldwide',
    'hasOfferCatalog': {
      '@type': 'OfferCatalog',
      'name': 'Typing Services',
      'itemListElement': [
        {
          '@type': 'Offer',
          'itemOffered': {
            '@type': 'Service',
            'name': 'Free Typing Test',
            'description': 'Professional-grade typing speed assessment',
          },
        },
        {
          '@type': 'Offer',
          'itemOffered': {
            '@type': 'Service',
            'name': 'Typing Certificate',
            'description': 'Verified typing speed certificate for employment',
          },
        },
      ],
    },
  };
}

/**
 * Generate TypingTool schema for feature pages
 */
export function getTypingToolSchema(tool: {
  name: string;
  description: string;
  features?: string[];
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${tool.url}#tool`,
    'name': tool.name,
    'description': tool.description,
    'url': tool.url,
    'applicationCategory': ['EducationalApplication', 'UtilitiesApplication'],
    'operatingSystem': 'Any',
    'browserRequirements': 'Requires JavaScript and HTML5',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
      'availability': 'https://schema.org/InStock',
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.8',
      'bestRating': '5',
      'ratingCount': '2847',
    },
    'featureList': tool.features || [],
    'author': {
      '@type': 'Organization',
      'name': 'TypeMasterAI',
      'url': BASE_URL,
    },
    'isAccessibleForFree': true,
  };
}

/**
 * Generate ComparisonPage schema for alternative pages
 */
export function getComparisonPageSchema(comparison: {
  mainProduct: string;
  competitor: string;
  advantages?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': `${comparison.mainProduct} vs ${comparison.competitor} - Comparison`,
    'description': `Compare ${comparison.mainProduct} with ${comparison.competitor}. Discover features, pros, and cons to choose the best typing test platform.`,
    'about': {
      '@type': 'Product',
      'name': comparison.mainProduct,
      'description': `${comparison.mainProduct} - Free AI-powered typing test platform`,
      'brand': {
        '@type': 'Brand',
        'name': 'TypeMasterAI',
      },
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD',
      },
      'isSimilarTo': {
        '@type': 'Product',
        'name': comparison.competitor,
      },
    },
    'mainEntity': {
      '@type': 'ItemList',
      'name': `${comparison.mainProduct} Advantages over ${comparison.competitor}`,
      'itemListElement': (comparison.advantages || []).map((adv, i) => ({
        '@type': 'ListItem',
        'position': i + 1,
        'name': adv,
      })),
    },
  };
}

/**
 * Generate ItemList schema for collection/listing pages
 */
export function getItemListSchema(list: {
  name: string;
  description: string;
  items: Array<{ name: string; url: string; position: number }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': list.name,
    'description': list.description,
    'numberOfItems': list.items.length,
    'itemListElement': list.items.map((item) => ({
      '@type': 'ListItem',
      'position': item.position,
      'name': item.name,
      'url': item.url,
    })),
  };
}

/**
 * Generate DataCatalog schema for typing statistics/benchmarks pages
 */
export function getTypingDataSchema(data: {
  name: string;
  description: string;
  datasets?: Array<{ name: string; description: string }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    'name': data.name,
    'description': data.description,
    'creator': {
      '@type': 'Organization',
      'name': 'TypeMasterAI',
      'url': BASE_URL,
    },
    'license': 'https://creativecommons.org/publicdomain/zero/1.0/',
    'isAccessibleForFree': true,
    'includedInDataCatalog': {
      '@type': 'DataCatalog',
      'name': 'TypeMasterAI Typing Statistics',
    },
    ...(data.datasets && {
      'distribution': data.datasets.map((ds) => ({
        '@type': 'DataDownload',
        'name': ds.name,
        'description': ds.description,
        'contentUrl': BASE_URL,
      })),
    }),
  };
}

/**
 * Generate Certification schema for typing certificate pages
 */
export function getTypingCertificationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOccupationalCredential',
    'name': 'TypeMasterAI Typing Certificate',
    'description': 'Verified typing speed and accuracy certificate for professional use',
    'credentialCategory': 'Certificate',
    'educationalLevel': 'Professional',
    'recognizedBy': {
      '@type': 'Organization',
      'name': 'TypeMasterAI',
      'url': BASE_URL,
    },
    'validIn': 'Worldwide',
    'competencyRequired': [
      'Minimum 50 WPM typing speed',
      'Minimum 95% accuracy',
      '5-minute sustained typing test',
    ],
  };
}

/**
 * Generate BlogPosting structured data for blog articles
 */
export function getBlogArticleSchema(article: {
  title: string;
  description?: string;
  slug: string;
  coverImageUrl?: string | null;
  authorName: string;
  authorBio?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  wordCount?: number;
  readingTimeMinutes?: number;
  tags?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${BASE_URL}/blog/${article.slug}#article`,
    'headline': article.title,
    'description': article.description || '',
    'image': article.coverImageUrl ? {
      '@type': 'ImageObject',
      'url': article.coverImageUrl,
    } : undefined,
    'author': {
      '@type': 'Person',
      'name': article.authorName,
      'description': article.authorBio || undefined,
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'TypeMasterAI',
      'url': BASE_URL,
      'logo': {
        '@type': 'ImageObject',
        'url': `${BASE_URL}/icon-512x512.png`,
        'width': 512,
        'height': 512,
      },
    },
    'datePublished': article.publishedAt || undefined,
    'dateModified': article.updatedAt || article.publishedAt || undefined,
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/blog/${article.slug}`,
    },
    'wordCount': article.wordCount,
    'timeRequired': article.readingTimeMinutes ? `PT${article.readingTimeMinutes}M` : undefined,
    'keywords': article.tags?.join(', ') || undefined,
    'inLanguage': 'en-US',
    'isAccessibleForFree': true,
    'isPartOf': {
      '@type': 'Blog',
      '@id': `${BASE_URL}/blog#blog`,
      'name': 'TypeMasterAI Blog',
      'url': `${BASE_URL}/blog`,
    },
  };
}

/**
 * Generate Blog index structured data
 */
export function getBlogIndexSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${BASE_URL}/blog#blog`,
    'name': 'TypeMasterAI Blog',
    'description': 'Professional articles on typing, productivity, learning, and product updates.',
    'url': `${BASE_URL}/blog`,
    'publisher': {
      '@type': 'Organization',
      'name': 'TypeMasterAI',
      'url': BASE_URL,
      'logo': {
        '@type': 'ImageObject',
        'url': `${BASE_URL}/icon-512x512.png`,
      },
    },
    'inLanguage': 'en-US',
  };
}

/**
 * Page-specific SEO configurations - Updated January 2026
 */
export const SEO_CONFIGS = {
  home: {
    title: 'Free Typing Test | TypeMasterAI - Check Your WPM & Typing Speed Online',
    description: 'Test your typing speed in 60 seconds! Free online typing test with real-time WPM calculator, accuracy tracker, AI-powered analytics, multiplayer racing, code typing mode for developers, and 23+ languages. No signup required.',
    keywords: 'typing test, typing speed test, wpm test, words per minute test, free typing test, typing speed, online typing test, typing test wpm, 1 minute typing test, typing accuracy test, typing game, typing practice, monkeytype alternative, code typing test, multiplayer typing race',
    canonical: `${BASE_URL}/`,
    ogUrl: `${BASE_URL}/`,
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': ['WebApplication', 'SoftwareApplication'],
          '@id': `${BASE_URL}/#webapp`,
          'name': 'TypeMasterAI',
          'alternateName': ['TypeMaster AI Typing Test', 'TypeMaster', 'Type Master AI', 'Typing Speed Test'],
          'url': BASE_URL,
          'description': 'Advanced AI-powered typing test platform with real-time WPM measurement, accuracy tracking, code typing mode for developers, multiplayer racing, and personalized analytics across 23+ languages.',
          'applicationCategory': ['UtilitiesApplication', 'EducationalApplication', 'GameApplication'],
          'applicationSubCategory': 'Typing Practice',
          'operatingSystem': 'Any',
          'browserRequirements': 'Requires JavaScript and HTML5 support',
          'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'USD',
            'availability': 'https://schema.org/InStock',
            'priceValidUntil': '2026-12-31'
          },
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': '4.8',
            'bestRating': '5',
            'worstRating': '1',
            'ratingCount': '2847',
            'reviewCount': '1523'
          },
          'isAccessibleForFree': true,
          'featureList': [
            "Real-time WPM calculation",
            "Accuracy percentage tracking",
            "AI-generated typing content",
            "Code typing mode (20+ languages)",
            "Multiplayer typing race",
            "Keystroke heatmaps & analytics",
            "Finger usage statistics",
            "AI personalized insights",
            "23+ language support",
            "Daily challenges & achievements",
            "Progressive Web App (PWA)",
            "Global leaderboards"
          ],
          'softwareVersion': '2.0.0',
          'author': { '@id': `${BASE_URL}/#organization` },
          'publisher': { '@id': `${BASE_URL}/#organization` },
          'creator': { '@id': `${BASE_URL}/#organization` },
          'inLanguage': ["en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko", "ar", "hi"],
          'screenshot': {
            '@type': 'ImageObject',
            'url': `${BASE_URL}/opengraph.jpg`,
            'caption': 'TypeMasterAI - Free Online Typing Speed Test'
          }
        },
        {
          '@type': 'Organization',
          '@id': `${BASE_URL}/#organization`,
          'name': 'TypeMasterAI',
          'url': BASE_URL,
          'logo': {
            '@type': 'ImageObject',
            'url': `${BASE_URL}/icon-512x512.png`,
            'width': 512,
            'height': 512,
            'caption': 'TypeMasterAI Logo'
          },
          'image': `${BASE_URL}/icon-512x512.png`,
          'description': 'TypeMasterAI provides free AI-powered typing tests with real-time analytics, code typing mode, and multiplayer racing.',
          'email': 'support@typemasterai.com',
          'sameAs': [
            'https://twitter.com/replit',
            'https://github.com/replit'
          ]
        },
        {
          '@type': 'WebSite',
          '@id': `${BASE_URL}/#website`,
          'url': BASE_URL,
          'name': 'TypeMasterAI - Free Online Typing Test',
          'publisher': { '@id': `${BASE_URL}/#organization` },
          'potentialAction': {
            '@type': 'SearchAction',
            'target': `${BASE_URL}/?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/#breadcrumb`,
          'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': BASE_URL }
          ]
        },
        {
          '@type': 'HowTo',
          '@id': `${BASE_URL}/#howto`,
          'name': 'How to Test and Improve Your Typing Speed',
          'description': 'Learn how to accurately measure your typing speed in WPM and improve your typing skills using TypeMasterAI.',
          'totalTime': 'PT5M',
          'tool': { '@type': 'HowToTool', 'name': 'TypeMasterAI Typing Test' },
          'step': [
            { '@type': 'HowToStep', 'position': 1, 'name': 'Visit TypeMasterAI', 'text': 'Go to typemasterai.com in your web browser.', 'url': BASE_URL },
            { '@type': 'HowToStep', 'position': 2, 'name': 'Select test duration', 'text': 'Choose from 15s, 30s, 1min, 3min, or 5min.' },
            { '@type': 'HowToStep', 'position': 3, 'name': 'Start typing', 'text': 'Type the displayed paragraph. WPM is calculated in real-time.' },
            { '@type': 'HowToStep', 'position': 4, 'name': 'View results', 'text': 'See your WPM, accuracy, and detailed analytics.' },
            { '@type': 'HowToStep', 'position': 5, 'name': 'Track progress', 'text': 'Save results and compete on the leaderboard.' }
          ]
        },
        {
          '@type': 'FAQPage',
          '@id': `${BASE_URL}/#faq`,
          'mainEntity': [
            {
              '@type': 'Question',
              'name': 'How do I test my typing speed?',
              'acceptedAnswer': { '@type': 'Answer', 'text': 'Simply visit TypeMasterAI and start typing. Your WPM and accuracy are calculated in real-time.' }
            },
            {
              '@type': 'Question',
              'name': 'What is a good typing speed?',
              'acceptedAnswer': { '@type': 'Answer', 'text': 'Average is 40 WPM. 50-80 WPM is good, 80-95 very good, and 100+ expert.' }
            },
            {
              '@type': 'Question',
              'name': 'Is TypeMasterAI free?',
              'acceptedAnswer': { '@type': 'Answer', 'text': 'Yes, TypeMasterAI is 100% free with unlimited tests and features.' }
            },
            {
              '@type': 'Question',
              'name': 'What is code typing mode?',
              'acceptedAnswer': { '@type': 'Answer', 'text': 'A mode for programmers to practice typing code in 20+ languages like Python and JavaScript.' }
            },
            {
              '@type': 'Question',
              'name': 'How does multiplayer work?',
              'acceptedAnswer': { '@type': 'Answer', 'text': 'Join a room and race against others in real-time to type the same paragraph.' }
            }
          ]
        },
        {
          '@type': 'ItemList',
          '@id': `${BASE_URL}/#features`,
          'name': 'TypeMasterAI Features',
          'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': 'Real-time WPM' },
            { '@type': 'ListItem', 'position': 2, 'name': 'Code Typing Mode' },
            { '@type': 'ListItem', 'position': 3, 'name': 'Multiplayer Racing' },
            { '@type': 'ListItem', 'position': 4, 'name': 'AI Analytics' },
            { '@type': 'ListItem', 'position': 5, 'name': '23+ Languages' }
          ]
        },
        // Speakable Specification
        {
          '@type': 'WebPage',
          'speakable': {
            '@type': 'SpeakableSpecification',
            'cssSelector': ['h1', '.wpm-display', '.accuracy-display'],
          },
        },
      ],
    },
  },
  test: {
    title: '1 Minute Typing Speed Test | Free WPM Calculator - TypeMasterAI',
    description: 'Take a quick 1-minute typing speed test and get instant WPM results. Track your accuracy, view detailed analytics, and compare with global averages. No signup required.',
    keywords: '1 minute typing test, typing speed test, wpm calculator, typing test 60 seconds, free typing test, online typing speed test, check typing speed',
    canonical: `${BASE_URL}/test`,
    ogUrl: `${BASE_URL}/test`,
    structuredData: getBreadcrumbSchema([{ name: 'Home', url: BASE_URL }, { name: 'Typing Test', url: `${BASE_URL}/test` }]),
  },
  codeMode: {
    title: 'Code Typing Test for Programmers | 20+ Languages - TypeMasterAI',
    description: 'Improve your coding speed with our specialized code typing test. Practice typing in JavaScript, Python, Java, C++, TypeScript, Go, Rust, and 15+ more languages with syntax highlighting.',
    keywords: 'code typing test, programming typing test, coding speed test, developer typing practice, javascript typing test, python typing test, coding wpm, programmer typing speed',
    canonical: `${BASE_URL}/code-mode`,
    ogUrl: `${BASE_URL}/code-mode`,
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          'name': 'TypeMasterAI Code Typing Mode',
          'description': 'Specialized code typing test for programmers with 20+ programming languages',
          'applicationCategory': 'DeveloperApplication',
          'operatingSystem': 'Web Browser',
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
          'featureList': ['JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift'],
        },
        getBreadcrumbSchema([{ name: 'Home', url: BASE_URL }, { name: 'Code Mode', url: `${BASE_URL}/code-mode` }]),
      ]
    },
  },
  multiplayer: {
    title: 'Multiplayer Typing Race | Compete Live Online - TypeMasterAI',
    description: 'Join real-time multiplayer typing races and compete against players worldwide. Race to type the fastest, see live WPM updates, ELO ratings, and climb the rankings!',
    keywords: 'multiplayer typing race, typing game online, competitive typing, typeracer alternative, online typing competition, typing race multiplayer, typing battle',
    canonical: `${BASE_URL}/multiplayer`,
    ogUrl: `${BASE_URL}/multiplayer`,
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        getVideoGameSchema('TypeMasterAI Multiplayer Racing', 'Real-time multiplayer typing race game where you compete to type paragraphs the fastest.'),
        getBreadcrumbSchema([{ name: 'Home', url: BASE_URL }, { name: 'Multiplayer', url: `${BASE_URL}/multiplayer` }]),
      ]
    },
  },
  leaderboard: {
    title: 'Global Typing Speed Leaderboard | Top WPM Rankings - TypeMasterAI',
    description: 'View the fastest typists in the world! Browse global and code typing leaderboards, filter by language, and compete for the top spot.',
    keywords: 'typing leaderboard, fastest typists, typing speed rankings, wpm leaderboard, typing competition rankings, best typists, world record typing speed',
    canonical: `${BASE_URL}/leaderboard`,
    ogUrl: `${BASE_URL}/leaderboard`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'TypeMasterAI Typing Speed Leaderboard',
      'description': 'Global rankings of fastest typists by WPM',
      'itemListOrder': 'https://schema.org/ItemListOrderDescending',
    },
  },
  analytics: {
    title: 'Typing Analytics & Performance Insights | AI-Powered - TypeMasterAI',
    description: 'Get detailed typing analytics with keystroke heatmaps, finger usage stats, WPM trends, accuracy metrics, and AI-powered personalized recommendations to improve faster.',
    keywords: 'typing analytics, typing statistics, keystroke analysis, typing performance, wpm tracking, typing improvement insights, finger usage analysis',
    canonical: `${BASE_URL}/analytics`,
    ogUrl: `${BASE_URL}/analytics`,
  },
  profile: {
    title: 'Your Typing Profile & Progress | Track Improvement - TypeMasterAI',
    description: 'View your typing history, track progress over time, earn achievements, manage badges, and monitor your typing speed improvement journey.',
    keywords: 'typing profile, typing progress, typing history, typing achievements, track typing speed, typing improvement',
    canonical: `${BASE_URL}/profile`,
    ogUrl: `${BASE_URL}/profile`,
  },
  stressTest: {
    title: 'Stress Typing Test | Challenge Your Focus Under Pressure - TypeMasterAI',
    description: 'Test your typing skills under pressure with visual distractions, screen shake, glitch effects, and more. Multiple difficulty levels from beginner to impossible.',
    keywords: 'stress typing test, hard typing test, typing test with distractions, challenging typing test, focus test, typing under pressure',
    canonical: `${BASE_URL}/stress-test`,
    ogUrl: `${BASE_URL}/stress-test`,
    structuredData: getWebAppSchema('Stress Test Mode', 'Test your typing under pressure with visual distractions'),
  },
  dictationTest: {
    title: 'Dictation Typing Test | Listen & Type Audio Practice Free | TypeMasterAI',
    description: 'Free dictation typing test - listen to audio and type what you hear. Practice transcription with real-time accuracy feedback, adjustable speed, and instant results.',
    keywords: 'dictation typing test, listen and type test, audio typing test, transcription practice, dictation practice online, type what you hear, listening typing test, audio transcription practice, dictation speed test, transcription test free',
    canonical: `${BASE_URL}/dictation-test`,
    ogUrl: `${BASE_URL}/dictation-test`,
    structuredData: getSpeakableSchema(['.dictation-text', '.transcription-area', '.wpm-display', '.accuracy-display']),
  },
  learn: {
    title: 'Learn Touch Typing | Free Typing Lessons - TypeMasterAI',
    description: 'Learn touch typing with our comprehensive free lessons. Master proper finger placement, build muscle memory, and increase your typing speed systematically.',
    keywords: 'learn touch typing, typing lessons, typing tutorial, learn to type, typing course free, touch typing guide, keyboard lessons',
    canonical: `${BASE_URL}/learn`,
    ogUrl: `${BASE_URL}/learn`,
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        getCourseSchema('Touch Typing Fundamentals', 'Comprehensive touch typing course with 5 levels of mastery.'),
        getBreadcrumbSchema([{ name: 'Home', url: BASE_URL }, { name: 'Learn', url: `${BASE_URL}/learn` }]),
      ]
    },
  },
  faq: {
    title: 'FAQ | Frequently Asked Questions - TypeMasterAI',
    description: 'Find answers to common questions about TypeMasterAI typing tests. Learn about WPM calculation, typing speed improvement, features, languages, and more.',
    keywords: 'typing test faq, wpm questions, typing speed help, how to type faster, monkeytype alternative questions, typing test help',
    canonical: `${BASE_URL}/faq`,
    ogUrl: `${BASE_URL}/faq`,
    structuredData: getBreadcrumbSchema([{ name: 'Home', url: BASE_URL }, { name: 'FAQ', url: `${BASE_URL}/faq` }]),
  },
  // New SEO Landing Pages
  typingPractice: {
    title: 'Free Typing Practice Online | Improve Your Speed - TypeMasterAI',
    description: 'Practice typing online for free with TypeMasterAI. Build muscle memory, improve accuracy, and increase your WPM with our AI-powered typing practice exercises.',
    keywords: 'typing practice, typing practice online, free typing practice, practice typing, typing exercises, improve typing speed, typing drills, keyboard practice',
    canonical: `${BASE_URL}/typing-practice`,
    ogUrl: `${BASE_URL}/typing-practice`,
    structuredData: getBreadcrumbSchema([{ name: 'Home', url: BASE_URL }, { name: 'Typing Practice', url: `${BASE_URL}/typing-practice` }]),
  },
  wpmTest: {
    title: 'WPM Test - Check Your Words Per Minute | Free Online - TypeMasterAI',
    description: 'Take a free WPM test and measure your typing speed in words per minute. Get accurate results with our professional-grade WPM calculator and detailed analytics.',
    keywords: 'wpm test, words per minute test, wpm calculator, check wpm, typing wpm, wpm speed test, how fast do i type, wpm checker, words per minute calculator',
    canonical: `${BASE_URL}/wpm-test`,
    ogUrl: `${BASE_URL}/wpm-test`,
    structuredData: getBreadcrumbSchema([{ name: 'Home', url: BASE_URL }, { name: 'WPM Test', url: `${BASE_URL}/wpm-test` }]),
  },
  typingGames: {
    title: 'Typing Games Online | Fun & Free - TypeMasterAI',
    description: 'Play free typing games online and improve your typing speed while having fun. Race against others, complete challenges, and climb the leaderboard!',
    keywords: 'typing games, typing games online, free typing games, fun typing games, typing race game, keyboard games, typing game for kids, typing practice games',
    canonical: `${BASE_URL}/typing-games`,
    ogUrl: `${BASE_URL}/typing-games`,
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        getVideoGameSchema('TypeMasterAI Typing Games Collection', 'A collection of fun typing games to improve speed and accuracy.'),
        getBreadcrumbSchema([{ name: 'Home', url: BASE_URL }, { name: 'Typing Games', url: `${BASE_URL}/typing-games` }]),
      ]
    },
  },
  keyboardTest: {
    title: 'Online Keyboard Test | Check All Keys Work - TypeMasterAI',
    description: 'Test your keyboard online for free. Check if all keys are working, test key response time, and verify your keyboard layout. Works with any keyboard type.',
    keywords: 'keyboard test, keyboard tester, online keyboard test, test keyboard, keyboard checker, key test, check keyboard keys, keyboard test online',
    canonical: `${BASE_URL}/keyboard-test`,
    ogUrl: `${BASE_URL}/keyboard-test`,
    structuredData: getSoftwareAppSchema('Online Keyboard Tester', 'Utility to test keyboard keys functionality', ['Key Response Time', 'Multi-key Rollover', 'Layout Detection']),
  },
  typingCertificate: {
    title: 'Typing Certificate | Get Certified Speed Results - TypeMasterAI',
    description: 'Earn a verified typing certificate with your WPM and accuracy scores. Download shareable certificates for job applications, schools, and professional use.',
    keywords: 'typing certificate, typing speed certificate, wpm certificate, typing test certificate, professional typing certificate, typing certification, verified typing results',
    canonical: `${BASE_URL}/typing-certificate`,
    ogUrl: `${BASE_URL}/typing-certificate`,
    structuredData: getBreadcrumbSchema([{ name: 'Home', url: BASE_URL }, { name: 'Certificate', url: `${BASE_URL}/typing-certificate` }]),
  },
  
  // ============================================================================
  // ENHANCED SEO CONFIGS - Deep Keyword Integration
  // ============================================================================
  
  // Average Typing Speed page
  averageTypingSpeed: {
    title: 'Average Typing Speed by Age & Profession | WPM Chart 2025 - TypeMasterAI',
    description: 'Discover average typing speed by age, profession, and skill level. See WPM benchmarks, typing speed percentiles, and how fast you should type for different jobs.',
    keywords: 'average typing speed, average wpm, typing speed by age, average words per minute, good typing speed, normal typing speed, typing speed chart, wpm by age, professional typing speed, typing speed percentile, how fast should i type',
    canonical: `${BASE_URL}/average-typing-speed`,
    ogUrl: `${BASE_URL}/average-typing-speed`,
  },
  
  // What is WPM page
  whatIsWpm: {
    title: 'What is WPM? Words Per Minute Explained | Typing Speed Guide - TypeMasterAI',
    description: 'Learn what WPM (Words Per Minute) means, how it\'s calculated, and why it matters. Understand typing speed measurement, CPM vs WPM, and how to improve your typing speed.',
    keywords: 'what is wpm, words per minute, wpm meaning, wpm definition, how is wpm calculated, typing speed meaning, wpm vs cpm, typing speed explained, wpm calculation formula',
    canonical: `${BASE_URL}/what-is-wpm`,
    ogUrl: `${BASE_URL}/what-is-wpm`,
  },
  
  // How to Type Faster page
  howToTypeFaster: {
    title: 'How to Type Faster | 15 Proven Tips to Increase Typing Speed - TypeMasterAI',
    description: 'Learn how to type faster with proven techniques. Master touch typing, proper finger placement, posture, and daily practice routines to double your typing speed.',
    keywords: 'how to type faster, increase typing speed, improve typing, type faster tips, speed typing techniques, boost typing speed, faster typing, typing speed tips, double typing speed, touch typing tips',
    canonical: `${BASE_URL}/how-to-type-faster`,
    ogUrl: `${BASE_URL}/how-to-type-faster`,
  },
  
  // Touch Typing page
  touchTyping: {
    title: 'Touch Typing Guide | Learn Proper Finger Placement - TypeMasterAI',
    description: 'Master touch typing with our comprehensive guide. Learn proper finger placement, home row position, typing posture, and build muscle memory for faster typing.',
    keywords: 'touch typing, touch typing guide, finger placement typing, home row typing, typing without looking, proper typing technique, touch type, blind typing, keyboard finger position',
    canonical: `${BASE_URL}/touch-typing`,
    ogUrl: `${BASE_URL}/touch-typing`,
  },
  
  // Typing for Beginners page
  typingForBeginners: {
    title: 'Typing for Beginners | Start Learning to Type Today - TypeMasterAI',
    description: 'New to typing? Start here! Learn typing basics, keyboard layout, finger placement, and build speed gradually with beginner-friendly lessons and exercises.',
    keywords: 'typing for beginners, learn typing, beginner typing, start typing, typing basics, learn keyboard, typing from scratch, how to start typing, basic typing lessons',
    canonical: `${BASE_URL}/typing-for-beginners`,
    ogUrl: `${BASE_URL}/typing-for-beginners`,
  },
  
  // Typing Test for Kids page
  typingTestForKids: {
    title: 'Typing Test for Kids | Fun & Easy - TypeMasterAI',
    description: 'Kid-friendly typing test with fun exercises and age-appropriate content. Help children develop typing skills early with engaging practice and games.',
    keywords: 'typing test for kids, kids typing, children typing test, typing for children, typing games for kids, kid friendly typing, learn typing kids, typing practice for kids',
    canonical: `${BASE_URL}/typing-test-for-kids`,
    ogUrl: `${BASE_URL}/typing-test-for-kids`,
  },
  
  // Typing Test for Jobs page
  typingTestForJobs: {
    title: 'Typing Test for Jobs | Employment Typing Speed Assessment - TypeMasterAI',
    description: 'Prepare for job typing tests with our professional assessment. Practice data entry, administrative, and office typing tests with realistic job requirements.',
    keywords: 'typing test for jobs, employment typing test, job typing test, typing speed for jobs, office typing test, data entry typing test, administrative typing test, typing test employment',
    canonical: `${BASE_URL}/typing-test-jobs`,
    ogUrl: `${BASE_URL}/typing-test-jobs`,
  },
  
  // Typing Speed Chart page
  typingSpeedChart: {
    title: 'Typing Speed Chart | WPM Benchmarks & Percentiles - TypeMasterAI',
    description: 'View comprehensive typing speed charts showing WPM benchmarks, percentiles, and skill levels. Compare your typing speed with beginners, average typists, and professionals.',
    keywords: 'typing speed chart, wpm chart, typing speed benchmarks, typing percentile, wpm percentile, typing skill levels, typing speed comparison, typing speed rankings',
    canonical: `${BASE_URL}/typing-speed-chart`,
    ogUrl: `${BASE_URL}/typing-speed-chart`,
  },
  
  // Data Entry Typing Test page
  dataEntryTypingTest: {
    title: 'Data Entry Typing Test | Practice for Data Entry Jobs - TypeMasterAI',
    description: 'Practice data entry typing with number-heavy content and forms. Prepare for data entry positions with realistic practice tests and accuracy tracking.',
    keywords: 'data entry typing test, data entry practice, typing test numbers, data entry speed test, data entry job test, numeric typing test, data entry typing speed',
    canonical: `${BASE_URL}/data-entry-typing-test`,
    ogUrl: `${BASE_URL}/data-entry-typing-test`,
  },
  
  // Keyboard Layouts page
  keyboardLayouts: {
    title: 'Keyboard Layouts Explained | QWERTY, Dvorak, Colemak - TypeMasterAI',
    description: 'Learn about different keyboard layouts including QWERTY, Dvorak, Colemak, and more. Understand the pros and cons of each layout for typing speed and ergonomics.',
    keywords: 'keyboard layouts, qwerty keyboard, dvorak keyboard, colemak keyboard, keyboard layout comparison, alternative keyboard layouts, ergonomic keyboard layouts',
    canonical: `${BASE_URL}/keyboard-layouts`,
    ogUrl: `${BASE_URL}/keyboard-layouts`,
  },
  
  // Timed Typing Test pages
  typingTest1Min: {
    title: '1 Minute Typing Test | Quick WPM Test - TypeMasterAI',
    description: 'Take a quick 1-minute typing test to measure your WPM. Perfect for a fast speed check with instant results and accuracy tracking.',
    keywords: '1 minute typing test, one minute typing test, 60 second typing test, quick typing test, fast typing test, 1 min wpm test, typing test 1 minute',
    canonical: `${BASE_URL}/typing-test-1-min`,
    ogUrl: `${BASE_URL}/typing-test-1-min`,
  },
  
  typingTest3Min: {
    title: '3 Minute Typing Test | Standard WPM Assessment - TypeMasterAI',
    description: 'Take a 3-minute typing test for a more accurate WPM measurement. Standard duration for employment tests with comprehensive accuracy analysis.',
    keywords: '3 minute typing test, three minute typing test, 180 second typing test, standard typing test, typing test 3 min, wpm test 3 minutes',
    canonical: `${BASE_URL}/typing-test-3-min`,
    ogUrl: `${BASE_URL}/typing-test-3-min`,
  },
  
  typingTest5Min: {
    title: '5 Minute Typing Test | Extended Accuracy Test - TypeMasterAI',
    description: 'Take a 5-minute typing test for the most accurate WPM assessment. Tests endurance and consistency for professional typing certification.',
    keywords: '5 minute typing test, five minute typing test, 300 second typing test, long typing test, typing test 5 min, endurance typing test, professional wpm test',
    canonical: `${BASE_URL}/typing-test-5-min`,
    ogUrl: `${BASE_URL}/typing-test-5-min`,
  },
  
  // Programming Language Typing Tests
  javascriptTypingTest: {
    title: 'JavaScript Typing Test | Code Typing for JS Developers - TypeMasterAI',
    description: 'Practice typing JavaScript code with syntax highlighting. Improve your JS coding speed with realistic code snippets including ES6+, React, and Node.js patterns.',
    keywords: 'javascript typing test, js typing practice, coding typing test javascript, javascript typing speed, type javascript faster, js code typing',
    canonical: `${BASE_URL}/javascript-typing-test`,
    ogUrl: `${BASE_URL}/javascript-typing-test`,
  },
  
  pythonTypingTest: {
    title: 'Python Typing Test | Code Typing for Python Developers - TypeMasterAI',
    description: 'Practice typing Python code with proper indentation handling. Improve your Python coding speed with real-world code snippets and data science examples.',
    keywords: 'python typing test, python typing practice, coding typing test python, python typing speed, type python faster, python code typing',
    canonical: `${BASE_URL}/python-typing-test`,
    ogUrl: `${BASE_URL}/python-typing-test`,
  },
  
  // Mobile Typing Test page
  mobileTypingTest: {
    title: 'Mobile Typing Test | Test Your Phone Typing Speed - TypeMasterAI',
    description: 'Test your mobile typing speed on phone or tablet. Measure your touch screen typing WPM with mobile-optimized tests and swipe keyboard support.',
    keywords: 'mobile typing test, phone typing test, typing speed mobile, touchscreen typing test, tablet typing test, smartphone typing, mobile wpm test',
    canonical: `${BASE_URL}/mobile-typing-test`,
    ogUrl: `${BASE_URL}/mobile-typing-test`,
  },
  
  // Alternative Comparison pages
  monkeytypeAlternative: {
    title: 'Best Monkeytype Alternative | TypeMasterAI vs Monkeytype',
    description: 'Looking for a Monkeytype alternative? TypeMasterAI offers AI-powered analytics, code typing mode, multiplayer racing, and more features for free.',
    keywords: 'monkeytype alternative, like monkeytype, better than monkeytype, monkeytype vs typemasterai, free monkeytype alternative, monkeytype competitor',
    canonical: `${BASE_URL}/monkeytype-alternative`,
    ogUrl: `${BASE_URL}/monkeytype-alternative`,
  },
  
  typeracerAlternative: {
    title: 'Best TypeRacer Alternative | Free Multiplayer Typing - TypeMasterAI',
    description: 'Looking for a TypeRacer alternative? TypeMasterAI offers free multiplayer typing races with ELO ratings, live competition, and no subscription required.',
    keywords: 'typeracer alternative, like typeracer, free typeracer alternative, typeracer vs typemasterai, typeracer competitor, multiplayer typing free',
    canonical: `${BASE_URL}/typeracer-alternative`,
    ogUrl: `${BASE_URL}/typeracer-alternative`,
  },
  
  keybrAlternative: {
    title: 'Best Keybr Alternative | Learn Touch Typing - TypeMasterAI',
    description: 'Looking for a Keybr alternative? TypeMasterAI offers comprehensive touch typing lessons with AI-powered learning and progress tracking.',
    keywords: 'keybr alternative, like keybr, keybr vs typemasterai, keybr competitor, touch typing alternative, learn typing free',
    canonical: `${BASE_URL}/keybr-alternative`,
    ogUrl: `${BASE_URL}/keybr-alternative`,
  },
  
  tenFastFingersAlternative: {
    title: 'Best 10FastFingers Alternative | Typing Competition - TypeMasterAI',
    description: 'Looking for a 10FastFingers alternative? TypeMasterAI offers competitive typing tests with global leaderboards and multiplayer racing.',
    keywords: '10fastfingers alternative, 10 fast fingers alternative, like 10fastfingers, 10fastfingers vs typemasterai, typing competition alternative',
    canonical: `${BASE_URL}/10fastfingers-alternative`,
    ogUrl: `${BASE_URL}/10fastfingers-alternative`,
  },
  
  typingcomAlternative: {
    title: 'Best Typing.com Alternative | Free Typing Lessons - TypeMasterAI',
    description: 'Looking for a Typing.com alternative? TypeMasterAI offers free typing lessons, practice exercises, and progress tracking for students and adults.',
    keywords: 'typing.com alternative, like typing.com, typingcom alternative, typing.com vs typemasterai, free typing lessons alternative',
    canonical: `${BASE_URL}/typingcom-alternative`,
    ogUrl: `${BASE_URL}/typingcom-alternative`,
  },
  
  // Knowledge Base page
  knowledgeBase: {
    title: 'Typing Knowledge Base | Complete Typing Guide - TypeMasterAI',
    description: 'Comprehensive typing knowledge base with guides, tutorials, and tips. Learn everything about typing speed, accuracy, technique, and keyboard mastery.',
    keywords: 'typing knowledge base, typing guide, typing tutorials, typing tips, keyboard mastery, typing education, typing resources, learn typing',
    canonical: `${BASE_URL}/knowledge-base`,
    ogUrl: `${BASE_URL}/knowledge-base`,
  },
};
