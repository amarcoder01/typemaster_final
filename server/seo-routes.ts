/**
 * SEO Route Configurations for Server-Side Pre-rendering
 * These configurations are used to inject proper meta tags for search engine crawlers
 */

export interface SEORouteConfig {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  ogType?: string;
  ogImage?: string;
  structuredDataType?: string;
  noindex?: boolean;
}

import { BASE_URL } from "./config";

export const SEO_ROUTES: Record<string, SEORouteConfig> = {
  '/': {
    title: 'Free Typing Test | TypeMasterAI - Check Your WPM & Typing Speed Online',
    description: 'Test your typing speed in 60 seconds! Free online typing test with real-time WPM calculator, accuracy tracker, AI-powered analytics, multiplayer racing, code typing mode for developers, and 23+ languages. No signup required.',
    keywords: 'typing test, typing speed test, wpm test, words per minute test, free typing test, typing speed, online typing test, typing test wpm, 1 minute typing test, typing accuracy test, typing game, typing practice, monkeytype alternative, code typing test, multiplayer typing race',
    canonical: `${BASE_URL}/`,
    ogType: 'website',
  },
  '/code-mode': {
    title: 'Code Typing Test for Programmers | 20+ Languages - TypeMasterAI',
    description: 'Improve your coding speed with our specialized code typing test. Practice typing in JavaScript, Python, Java, C++, TypeScript, Go, Rust, and 15+ more languages with syntax highlighting.',
    keywords: 'code typing test, programming typing test, coding speed test, developer typing practice, javascript typing test, python typing test, coding wpm, programmer typing speed',
    canonical: `${BASE_URL}/code-mode`,
    ogType: 'website',
  },
  '/multiplayer': {
    title: 'Multiplayer Typing Race | Compete Live Online - TypeMasterAI',
    description: 'Join real-time multiplayer typing races and compete against players worldwide. Race to type the fastest, see live WPM updates, ELO ratings, and climb the rankings!',
    keywords: 'multiplayer typing race, typing game online, competitive typing, typeracer alternative, online typing competition, typing race multiplayer, typing battle',
    canonical: `${BASE_URL}/multiplayer`,
    ogType: 'website',
  },
  '/leaderboard': {
    title: 'Global Typing Speed Leaderboard | Top WPM Rankings - TypeMasterAI',
    description: 'View the fastest typists in the world! Browse global and code typing leaderboards, filter by language, and compete for the top spot.',
    keywords: 'typing leaderboard, fastest typists, typing speed rankings, wpm leaderboard, typing competition rankings, best typists, world record typing speed',
    canonical: `${BASE_URL}/leaderboard`,
    ogType: 'website',
  },
  '/leaderboards': {
    title: 'Unified Leaderboards | All Typing Rankings - TypeMasterAI',
    description: 'Browse all TypeMasterAI leaderboards in one place. Compare rankings across standard typing, code typing, stress tests, and multiplayer races.',
    keywords: 'typing leaderboards, all rankings, typing competition, wpm rankings, code typing rankings',
    canonical: `${BASE_URL}/leaderboards`,
    ogType: 'website',
  },
  '/analytics': {
    title: 'Typing Analytics & Performance Insights | AI-Powered - TypeMasterAI',
    description: 'Get detailed typing analytics with keystroke heatmaps, finger usage stats, WPM trends, accuracy metrics, and AI-powered personalized recommendations to improve faster.',
    keywords: 'typing analytics, typing statistics, keystroke analysis, typing performance, wpm tracking, typing improvement insights, finger usage analysis',
    canonical: `${BASE_URL}/analytics`,
    ogType: 'website',
  },
  '/profile': {
    title: 'Your Typing Profile & Progress | Track Improvement - TypeMasterAI',
    description: 'View your typing history, track progress over time, earn achievements, manage badges, and monitor your typing speed improvement journey.',
    keywords: 'typing profile, typing progress, typing history, typing achievements, track typing speed, typing improvement',
    canonical: `${BASE_URL}/profile`,
    ogType: 'profile',
  },
  '/stress-test': {
    title: 'Stress Typing Test | Challenge Your Focus Under Pressure - TypeMasterAI',
    description: 'Test your typing skills under pressure with visual distractions, screen shake, glitch effects, and more. Multiple difficulty levels from beginner to impossible.',
    keywords: 'stress typing test, hard typing test, typing test with distractions, challenging typing test, focus test, typing under pressure',
    canonical: `${BASE_URL}/stress-test`,
    ogType: 'website',
  },
  '/stress-leaderboard': {
    title: 'Stress Test Leaderboard | Top Performers Under Pressure - TypeMasterAI',
    description: 'See who types the fastest under pressure! Browse the stress test leaderboard and compare your performance against the best.',
    keywords: 'stress test leaderboard, hard typing rankings, focus test rankings, pressure typing rankings',
    canonical: `${BASE_URL}/stress-leaderboard`,
    ogType: 'website',
  },
  '/code-leaderboard': {
    title: 'Code Typing Leaderboard | Best Developer Typists - TypeMasterAI',
    description: 'View the fastest code typists! Browse rankings by programming language and see who types code the fastest.',
    keywords: 'code typing leaderboard, programmer typing rankings, developer typing speed, coding speed rankings',
    canonical: `${BASE_URL}/code-leaderboard`,
    ogType: 'website',
  },
  '/dictation-test': {
    title: 'Dictation Typing Test | Listen & Type Audio Practice Free | TypeMasterAI',
    description: 'Free dictation typing test - listen to audio and type what you hear. Practice transcription with real-time accuracy feedback, adjustable speed, and instant results.',
    keywords: 'dictation typing test, listen and type test, audio typing test, transcription practice, dictation practice online, type what you hear, listening typing test, audio transcription practice, dictation speed test, transcription test free',
    canonical: `${BASE_URL}/dictation-test`,
    ogType: 'website',
  },
  '/dictation-mode': {
    title: 'Dictation Typing Test | Listen & Type Practice - Free AI Audio Typing | TypeMasterAI',
    description: 'Free dictation typing test - listen to audio and type what you hear. 3 practice modes, AI-powered feedback, certificates. Improve transcription speed & accuracy now!',
    keywords: 'dictation typing test, listen and type practice, audio typing test, transcription typing practice, dictation practice online, type what you hear, dictation speed test, listening typing test, audio transcription practice, speech to text typing, dictation accuracy test, transcription test free, dictation WPM test, listen type test online, AI dictation practice, voice dictation typing',
    canonical: `${BASE_URL}/dictation-mode`,
    ogType: 'website',
  },
  '/1-minute-typing-test': {
    title: '1 Minute Typing Test | Quick WPM Speed Test - TypeMasterAI',
    description: 'Take a quick 1-minute typing speed test and get instant WPM results. Track your accuracy, view detailed analytics, and compare with global averages. No signup required.',
    keywords: '1 minute typing test, one minute typing test, quick typing test, 60 second typing test, fast wpm test, typing speed 1 min',
    canonical: `${BASE_URL}/1-minute-typing-test`,
    ogType: 'website',
  },
  '/3-minute-typing-test': {
    title: '3 Minute Typing Test | Extended WPM Speed Test - TypeMasterAI',
    description: 'Take a 3-minute typing test for more accurate WPM results. Longer tests provide better consistency measurements and more reliable speed readings.',
    keywords: '3 minute typing test, three minute typing test, extended typing test, 180 second typing test, accurate wpm test',
    canonical: `${BASE_URL}/3-minute-typing-test`,
    ogType: 'website',
  },
  '/5-minute-typing-test': {
    title: '5 Minute Typing Test | Professional WPM Speed Test - TypeMasterAI',
    description: 'Take a comprehensive 5-minute typing test for professional-grade WPM measurements. Ideal for job applications and official typing certifications.',
    keywords: '5 minute typing test, five minute typing test, professional typing test, 300 second typing test, job typing test, certification typing test',
    canonical: `${BASE_URL}/5-minute-typing-test`,
    ogType: 'website',
  },
  '/monkeytype-alternative': {
    title: 'Monkeytype Alternative | TypeMasterAI - Free Typing Test with AI Features',
    description: 'Looking for a Monkeytype alternative? TypeMasterAI offers everything Monkeytype has plus AI-powered analytics, code typing mode, multiplayer racing, and 23+ languages. Try the best free typing test alternative now!',
    keywords: 'monkeytype alternative, typing test alternative, better than monkeytype, monkeytype vs typemaster, free typing test, typing speed test online, monkeytype competitor',
    canonical: `${BASE_URL}/monkeytype-alternative`,
    ogType: 'website',
  },
  '/typeracer-alternative': {
    title: 'Typeracer Alternative | TypeMasterAI - Free Multiplayer Typing Race',
    description: 'Looking for a Typeracer alternative? TypeMasterAI offers instant multiplayer racing with no ads, AI analytics, code typing mode, and more. Race against others for free!',
    keywords: 'typeracer alternative, typing race alternative, better than typeracer, typeracer vs typemaster, free typing race, multiplayer typing game',
    canonical: `${BASE_URL}/typeracer-alternative`,
    ogType: 'website',
  },
  '/10fastfingers-alternative': {
    title: '10FastFingers Alternative | TypeMasterAI - Modern Typing Test',
    description: 'Looking for a 10FastFingers alternative? TypeMasterAI offers a modern, ad-free typing test with AI analytics, multiplayer racing, and more features.',
    keywords: '10fastfingers alternative, 10 fast fingers alternative, better than 10fastfingers, typing test alternative, free typing test',
    canonical: `${BASE_URL}/10fastfingers-alternative`,
    ogType: 'website',
  },
  '/typingcom-alternative': {
    title: 'Typing.com Alternative | TypeMasterAI - 100% Free Typing Practice',
    description: 'Looking for a Typing.com alternative? TypeMasterAI is 100% free with all premium features included. No paywall, no ads, just pure typing practice.',
    keywords: 'typing.com alternative, typingcom alternative, free typing lessons, typing practice free, learn typing free',
    canonical: `${BASE_URL}/typingcom-alternative`,
    ogType: 'website',
  },
  '/about': {
    title: 'About TypeMasterAI | Our Mission & Story',
    description: 'Learn about TypeMasterAI, the AI-powered typing test platform. Discover our mission to help everyone improve their typing speed and accuracy with cutting-edge technology.',
    keywords: 'about typemasterai, typing test company, typing software, ai typing test, typing improvement platform',
    canonical: `${BASE_URL}/about`,
    ogType: 'website',
  },
  '/contact': {
    title: 'Contact Us | TypeMasterAI Support',
    description: 'Get in touch with the TypeMasterAI team. We\'re here to help with questions, feedback, and support for our typing test platform.',
    keywords: 'contact typemasterai, typing test support, typing test help, typemasterai email',
    canonical: `${BASE_URL}/contact`,
    ogType: 'website',
  },
  '/learn': {
    title: 'Learn Touch Typing | Free Typing Lessons - TypeMasterAI',
    description: 'Learn touch typing with our comprehensive free lessons. Master proper finger placement, build muscle memory, and increase your typing speed systematically.',
    keywords: 'learn touch typing, typing lessons, typing tutorial, learn to type, typing course free, touch typing guide, keyboard lessons',
    canonical: `${BASE_URL}/learn`,
    ogType: 'website',
    structuredDataType: 'Course',
  },
  '/chat': {
    title: 'AI Typing Coach | Get Personalized Tips - TypeMasterAI',
    description: 'Chat with our AI typing coach to get personalized tips and recommendations for improving your typing speed and accuracy.',
    keywords: 'ai typing coach, typing tips, typing advice, improve typing speed, typing help, ai assistant',
    canonical: `${BASE_URL}/chat`,
    ogType: 'website',
  },
  '/settings': {
    title: 'Settings | Customize Your Experience - TypeMasterAI',
    description: 'Customize your TypeMasterAI experience. Adjust themes, test duration, language preferences, and notification settings.',
    keywords: 'typing test settings, customize typing test, typemasterai settings',
    canonical: `${BASE_URL}/settings`,
    ogType: 'website',
  },
  '/notifications': {
    title: 'Notification Settings | TypeMasterAI',
    description: 'Manage your TypeMasterAI notification preferences. Control daily reminders, streak alerts, and achievement notifications.',
    keywords: 'notification settings, typing reminders, practice alerts',
    canonical: `${BASE_URL}/notifications`,
    ogType: 'website',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | TypeMasterAI',
    description: 'Read TypeMasterAI\'s privacy policy. Learn how we collect, use, and protect your data while you use our typing test platform.',
    keywords: 'privacy policy, data protection, typemasterai privacy',
    canonical: `${BASE_URL}/privacy-policy`,
    ogType: 'website',
  },
  '/terms-of-service': {
    title: 'Terms of Service | TypeMasterAI',
    description: 'Read TypeMasterAI\'s terms of service. Understand the rules and guidelines for using our typing test platform.',
    keywords: 'terms of service, terms and conditions, typemasterai terms',
    canonical: `${BASE_URL}/terms-of-service`,
    ogType: 'website',
  },
  '/cookie-policy': {
    title: 'Cookie Policy | TypeMasterAI',
    description: 'Learn about how TypeMasterAI uses cookies to improve your experience on our typing test platform.',
    keywords: 'cookie policy, cookies, typemasterai cookies',
    canonical: `${BASE_URL}/cookie-policy`,
    ogType: 'website',
  },
  '/ai-transparency': {
    title: 'AI Transparency | How We Use AI - TypeMasterAI',
    description: 'Learn how TypeMasterAI uses artificial intelligence to power analytics, generate content, and provide personalized recommendations.',
    keywords: 'ai transparency, artificial intelligence, ai disclosure, typemasterai ai',
    canonical: `${BASE_URL}/ai-transparency`,
    ogType: 'website',
  },
  '/accessibility': {
    title: 'Accessibility Statement | TypeMasterAI',
    description: 'TypeMasterAI\'s commitment to accessibility. Learn about our efforts to make our typing test platform accessible to all users.',
    keywords: 'accessibility, wcag, accessible typing test, disability support',
    canonical: `${BASE_URL}/accessibility`,
    ogType: 'website',
  },
  '/blog': {
    title: 'TypeMasterAI Blog | Guides, Tips, and Product Updates',
    description: 'Professional articles on typing, productivity, learning, and product updates. Learn best practices and improve your skills.',
    keywords: 'typing blog, productivity tips, typing guides, learning, updates',
    canonical: `${BASE_URL}/blog`,
    ogType: 'website',
  },
  '/blog/tags': {
    title: 'Blog Tags | TypeMasterAI',
    description: 'Browse blog tags and discover articles by topic.',
    keywords: 'typing blog tags',
    canonical: `${BASE_URL}/blog/tags`,
    ogType: 'website',
  },
  '/verify': {
    title: 'Certificate Verification | TypeMasterAI',
    description: 'Verify the authenticity of TypeMasterAI typing certificates. Enter a verification ID to confirm certificate validity and view achievement details.',
    keywords: 'certificate verification, typing certificate, verify certificate, authentic certificate',
    canonical: `${BASE_URL}/verify`,
    ogType: 'website',
  },
  // New SEO Landing Pages
  '/typing-practice': {
    title: 'Free Typing Practice Online | Improve Your Speed - TypeMasterAI',
    description: 'Practice typing online for free with TypeMasterAI. Build muscle memory, improve accuracy, and increase your WPM with our AI-powered typing practice exercises.',
    keywords: 'typing practice, typing practice online, free typing practice, practice typing, typing exercises, improve typing speed, typing drills, keyboard practice',
    canonical: `${BASE_URL}/typing-practice`,
    ogType: 'website',
  },
  '/wpm-test': {
    title: 'WPM Test - Check Your Words Per Minute | Free Online - TypeMasterAI',
    description: 'Take a free WPM test and measure your typing speed in words per minute. Get accurate results with our professional-grade WPM calculator and detailed analytics.',
    keywords: 'wpm test, words per minute test, wpm calculator, check wpm, typing wpm, wpm speed test, how fast do i type, wpm checker, words per minute calculator',
    canonical: `${BASE_URL}/wpm-test`,
    ogType: 'website',
  },
  '/typing-games': {
    title: 'Typing Games Online | Fun & Free - TypeMasterAI',
    description: 'Play free typing games online and improve your typing speed while having fun. Race against others, complete challenges, and climb the leaderboard!',
    keywords: 'typing games, typing games online, free typing games, fun typing games, typing race game, keyboard games, typing game for kids, typing practice games',
    canonical: `${BASE_URL}/typing-games`,
    ogType: 'website',
  },
  '/keyboard-test': {
    title: 'Online Keyboard Test | Check All Keys Work - TypeMasterAI',
    description: 'Test your keyboard online for free. Check if all keys are working, test key response time, and verify your keyboard layout. Works with any keyboard type.',
    keywords: 'keyboard test, keyboard tester, online keyboard test, test keyboard, keyboard checker, key test, check keyboard keys, keyboard test online',
    canonical: `${BASE_URL}/keyboard-test`,
    ogType: 'website',
  },
  '/typing-certificate': {
    title: 'Typing Certificate | Get Certified Speed Results - TypeMasterAI',
    description: 'Earn a verified typing certificate with your WPM and accuracy scores. Download shareable certificates for job applications, schools, and professional use.',
    keywords: 'typing certificate, typing speed certificate, wpm certificate, typing test certificate, professional typing certificate, typing certification, verified typing results',
    canonical: `${BASE_URL}/typing-certificate`,
    ogType: 'website',
  },
  // Phase 3 Pillar Pages
  '/average-typing-speed': {
    title: 'Average Typing Speed by Age & Gender | 2026 Statistics - TypeMasterAI',
    description: 'What is the average typing speed? Comprehensive statistics on WPM benchmarks by age, gender, and profession. See how you compare to the world.',
    keywords: 'average typing speed, average wpm, typing speed statistics, average typing speed by age, average words per minute',
    canonical: `${BASE_URL}/average-typing-speed`,
    ogType: 'article',
  },
  '/typing-speed-chart': {
    title: 'Typing Speed Chart & Distributions | WPM Visualized - TypeMasterAI',
    description: 'Visualizing typing speed distributions worldwide. See where you rank on the bell curve of WPM scores. Detailed infographic data included.',
    keywords: 'typing speed chart, wpm chart, typing speed distribution, wpm percentile, typing skill levels',
    canonical: `${BASE_URL}/typing-speed-chart`,
    ogType: 'article',
  },
  '/typing-test-jobs': {
    title: 'Typing Speed Requirements for Jobs | WPM Careers 2026 - TypeMasterAI',
    description: 'Which jobs require fast typing? Discover the WPM requirements for data entry, transcription, administrative roles, and more.',
    keywords: 'typing jobs, data entry wpm requirements, transcription typing speed, administrative assistant typing test, typing speed for jobs',
    canonical: `${BASE_URL}/typing-test-jobs`,
    ogType: 'article',
  },
  '/touch-typing': {
    title: 'What is Touch Typing? | Learn Faster Typing - TypeMasterAI',
    description: 'Learn the fundamentals of touch typing. Discover how to type without looking at the keyboard, improve your speed to 60+ WPM, and reduce physical strain.',
    keywords: 'what is touch typing, learn touch typing, touch typing guide, proper finger placement, home row keys, typing without looking',
    canonical: `${BASE_URL}/touch-typing`,
    ogType: 'article',
  },
  '/keybr-alternative': {
    title: 'Keybr Alternative | Best Adaptive Typing Practice - TypeMasterAI',
    description: 'Looking for a Keybr alternative? TypeMasterAI offers standard WPM tests plus adaptive learning features, multiplayer modes, and detailed analytics.',
    keywords: 'keybr alternative, better than keybr, keybr vs typemaster, adaptive typing practice, learn to type free',
    canonical: `${BASE_URL}/keybr-alternative`,
    ogType: 'website',
  },
  // Pillar-Cluster Content Pages
  '/what-is-wpm': {
    title: 'What is WPM? Words Per Minute Explained | TypeMasterAI',
    description: 'Learn what WPM (Words Per Minute) means, how it\'s calculated, and what constitutes a good typing speed. Understand gross WPM, net WPM, and CPM.',
    keywords: 'what is wpm, words per minute, wpm meaning, wpm definition, how to calculate wpm, typing speed, wpm vs cpm, gross wpm, net wpm',
    canonical: `${BASE_URL}/what-is-wpm`,
    ogType: 'article',
  },
  '/how-to-type-faster': {
    title: 'How to Type Faster: 10 Proven Tips to Increase WPM | TypeMasterAI',
    description: 'Learn how to type faster with proven techniques. From touch typing basics to advanced speed tips, increase your WPM from 40 to 80+ with daily practice.',
    keywords: 'how to type faster, increase typing speed, typing tips, improve wpm, type faster, fast typing, typing techniques, speed typing tips',
    canonical: `${BASE_URL}/how-to-type-faster`,
    ogType: 'article',
  },
  '/keyboard-layouts': {
    title: 'Keyboard Layouts Compared: QWERTY vs Dvorak vs Colemak | TypeMasterAI',
    description: 'Compare QWERTY, Dvorak, and Colemak keyboard layouts. Learn the pros, cons, and speed differences of each layout to choose the best one for you.',
    keywords: 'keyboard layouts, qwerty vs dvorak, colemak, dvorak keyboard, keyboard layout comparison, best keyboard layout, typing layout',
    canonical: `${BASE_URL}/keyboard-layouts`,
    ogType: 'article',
  },
  '/typing-for-beginners': {
    title: 'Typing for Beginners: Learn to Type from Scratch | TypeMasterAI',
    description: 'Complete beginner\'s guide to typing. Learn touch typing from scratch with step-by-step instructions, home row basics, and free practice exercises.',
    keywords: 'typing for beginners, learn to type, beginner typing, how to type, typing lessons for beginners, learn keyboard typing, start typing, typing basics',
    canonical: `${BASE_URL}/typing-for-beginners`,
    ogType: 'article',
  },
  '/data-entry-typing-test': {
    title: 'Data Entry Typing Test: Practice for Job Applications | TypeMasterAI',
    description: 'Prepare for data entry job typing tests. Practice with realistic 5-minute tests, learn WPM requirements for different jobs, and get certified results.',
    keywords: 'data entry typing test, typing test for jobs, employment typing test, data entry wpm, typing speed for jobs, job typing test, alphanumeric typing test',
    canonical: `${BASE_URL}/data-entry-typing-test`,
    ogType: 'website',
  },
  '/typing-test-for-kids': {
    title: 'Typing Test for Kids: Fun & Free Typing Practice | TypeMasterAI',
    description: 'Free typing test designed for kids and students. Age-appropriate practice, fun achievements, and progress tracking. Perfect for learning touch typing.',
    keywords: 'typing test for kids, kids typing practice, typing for children, child typing test, student typing test, typing games for kids, learn typing kids',
    canonical: `${BASE_URL}/typing-test-for-kids`,
    ogType: 'website',
  },
  '/mobile-typing-test': {
    title: 'Mobile Typing Test: Test Your Phone Typing Speed | TypeMasterAI',
    description: 'Test your mobile typing speed on phone or tablet. Practice thumb typing, measure your WPM, and improve your smartphone keyboard skills.',
    keywords: 'mobile typing test, phone typing speed, typing test on phone, mobile typing speed, thumb typing test, smartphone typing test, tablet typing test',
    canonical: `${BASE_URL}/mobile-typing-test`,
    ogType: 'website',
  },
  // Programming Language Typing Tests
  '/javascript-typing-test': {
    title: 'JavaScript Typing Test: Practice Coding Speed | TypeMasterAI',
    description: 'Practice typing JavaScript code with syntax highlighting. Improve your coding speed with arrow functions, async/await, and modern JS syntax.',
    keywords: 'javascript typing test, js typing practice, code typing test, programming typing test, javascript coding speed, developer typing test',
    canonical: `${BASE_URL}/javascript-typing-test`,
    ogType: 'website',
  },
  '/python-typing-test': {
    title: 'Python Typing Test: Practice Coding Speed | TypeMasterAI',
    description: 'Practice typing Python code with syntax highlighting. Improve your coding speed with functions, classes, and Pythonic syntax.',
    keywords: 'python typing test, python coding practice, code typing test, programming typing test, python coding speed, developer typing test',
    canonical: `${BASE_URL}/python-typing-test`,
    ogType: 'website',
  },
  // Additional SEO Landing Pages
  '/free-online-typing-test': {
    title: 'Free Online Typing Test | No Sign Up Required - TypeMasterAI',
    description: 'Take a completely free online typing test with no sign up required. Measure your WPM, track accuracy, and get instant results. Works on any device.',
    keywords: 'free online typing test, free typing test, online typing test free, typing test no sign up, free wpm test, typing speed test free online',
    canonical: `${BASE_URL}/free-online-typing-test`,
    ogType: 'website',
  },
  '/cpm-test': {
    title: 'CPM Test - Characters Per Minute Typing Test | TypeMasterAI',
    description: 'Measure your typing speed in characters per minute (CPM) with our free CPM test. Get accurate CPM results and compare with WPM metrics.',
    keywords: 'cpm test, characters per minute test, cpm typing test, typing speed cpm, cpm calculator, cpm vs wpm, characters per minute',
    canonical: `${BASE_URL}/cpm-test`,
    ogType: 'website',
  },
  '/typing-speed-requirements': {
    title: 'Typing Speed Requirements by Job & Industry | TypeMasterAI',
    description: 'Discover the typing speed requirements for different jobs and industries. Learn the WPM standards for data entry, administrative roles, transcription, and more.',
    keywords: 'typing speed requirements, wpm requirements, typing requirements for jobs, minimum typing speed, typing speed standards, job typing requirements',
    canonical: `${BASE_URL}/typing-speed-requirements`,
    ogType: 'article',
  },
  '/typing-accuracy-test': {
    title: 'Typing Accuracy Test | Measure Your Precision - TypeMasterAI',
    description: 'Test your typing accuracy with our precision-focused typing test. Track error rates, identify problem keys, and improve your typing precision.',
    keywords: 'typing accuracy test, accuracy test, typing precision test, error rate test, typing mistakes test, accurate typing test',
    canonical: `${BASE_URL}/typing-accuracy-test`,
    ogType: 'website',
  },
  '/professional-typing-test': {
    title: 'Professional Typing Test | Employment & Certification - TypeMasterAI',
    description: 'Take a professional-grade typing test for employment or certification purposes. 5-minute test with verified results suitable for job applications.',
    keywords: 'professional typing test, employment typing test, typing test for job, certification typing test, business typing test, official typing test',
    canonical: `${BASE_URL}/professional-typing-test`,
    ogType: 'website',
  },
  '/student-typing-test': {
    title: 'Student Typing Test | For Schools & Education - TypeMasterAI',
    description: 'Typing test designed for students and educational settings. Age-appropriate content, progress tracking, and performance reports for teachers.',
    keywords: 'student typing test, school typing test, typing test for students, educational typing test, classroom typing test, typing test for school',
    canonical: `${BASE_URL}/student-typing-test`,
    ogType: 'website',
  },
  // International (Pilot)
  '/es/typing-test': {
    title: 'Prueba de Mecanografía Gratis | Test de Velocidad - TypeMasterAI',
    description: 'Comprueba tu velocidad de escritura en español con nuestra prueba de mecanografía gratuita de 1 minuto. Calcula tu WPM (palabras por minuto) y mejora tu precisión.',
    keywords: 'prueba de mecanografía, test de velocidad, test de escritura, mecanografia online gratis, typing test español, wpm español',
    canonical: `${BASE_URL}/es/typing-test`,
    ogType: 'website',
  },
  '/fr/typing-test': {
    title: 'Test de Dactylo Gratuit | Test de Vitesse - TypeMasterAI',
    description: 'Vérifiez votre vitesse de frappe en français avec notre test de dactylo gratuit d\'une minute. Calculez vos MPM (mots par minute) et améliorez votre précision.',
    keywords: 'test de dactylo, test de vitesse, test d’écriture, dactylographie en ligne gratuit, typing test français, mpm français',
    canonical: `${BASE_URL}/fr/typing-test`,
    ogType: 'website',
  },
  '/de/typing-test': {
    title: 'Kostenloser Schreibtest | Tippgeschwindigkeit - TypeMasterAI',
    description: 'Überprüfen Sie Ihre Tippgeschwindigkeit auf Deutsch mit unserem kostenlosen 1-Minuten-Schreibtest. Berechnen Sie Ihre WpM (Wörter pro Minute) und verbessern Sie Ihre Genauigkeit.',
    keywords: 'schreibtest, tippgeschwindigkeit test, schreibgeschwindigkeit, kostenloser schreibtest online, typing test deutsch, wpm deutsch',
    canonical: `${BASE_URL}/de/typing-test`,
    ogType: 'website',
  },
  // Noindex pages
  '/login': {
    title: 'Login | TypeMasterAI',
    description: 'Log in to your TypeMasterAI account to access your typing history, achievements, and personalized analytics.',
    keywords: 'login, sign in, typemasterai account',
    canonical: `${BASE_URL}/login`,
    noindex: true,
  },
  '/register': {
    title: 'Create Account | TypeMasterAI',
    description: 'Create a free TypeMasterAI account to save your typing progress, earn achievements, and compete on leaderboards.',
    keywords: 'register, sign up, create account, typemasterai',
    canonical: `${BASE_URL}/register`,
    noindex: true,
  },
  '/forgot-password': {
    title: 'Forgot Password | TypeMasterAI',
    description: 'Reset your TypeMasterAI password. Enter your email to receive a password reset link.',
    keywords: 'forgot password, reset password, account recovery',
    canonical: `${BASE_URL}/forgot-password`,
    noindex: true,
  },
  '/reset-password': {
    title: 'Reset Password | TypeMasterAI',
    description: 'Create a new password for your TypeMasterAI account.',
    keywords: 'reset password, new password',
    canonical: `${BASE_URL}/reset-password`,
    noindex: true,
  },
  '/verify-email': {
    title: 'Verify Email | TypeMasterAI',
    description: 'Verify your email address to complete your TypeMasterAI account setup.',
    keywords: 'verify email, email verification',
    canonical: `${BASE_URL}/verify-email`,
    noindex: true,
  },
  '/profile/edit': {
    title: 'Edit Profile | TypeMasterAI',
    description: 'Update your TypeMasterAI profile information, avatar, and display settings.',
    keywords: 'edit profile, update profile',
    canonical: `${BASE_URL}/profile/edit`,
    noindex: true,
  },
  '/faq': {
    title: 'FAQ | Frequently Asked Questions - TypeMasterAI',
    description: 'Find answers to common questions about TypeMasterAI typing tests. Learn about WPM calculation, typing speed improvement, features, languages, and more.',
    keywords: 'typing test faq, wpm questions, typing speed help, how to type faster, monkeytype alternative questions, typing test help',
    canonical: `${BASE_URL}/faq`,
    ogType: 'website',
  },
  '/knowledge': {
    title: 'Knowledge Base & Platform Mechanics | TypeMasterAI',
    description: 'The authoritative source for TypeMasterAI platform mechanics, scoring algorithms, and terminology. Designed for users and AI agents.',
    keywords: 'typing mechanics, wpm calculation, typemasterai documentation, platform guide, typing accuracy formula',
    canonical: `${BASE_URL}/knowledge`,
    ogType: 'article',
  },
  '/admin/feedback': {
    title: 'Admin Feedback Dashboard | TypeMasterAI',
    description: 'Admin dashboard for managing user feedback.',
    keywords: 'admin, feedback, dashboard',
    canonical: `${BASE_URL}/admin/feedback`,
    noindex: true,
  },
};

/**
 * Get SEO config for a given path
 */
export function getSEOConfig(path: string): SEORouteConfig | null {
  // Exact match
  if (SEO_ROUTES[path]) {
    return SEO_ROUTES[path];
  }

  // Handle dynamic routes
  if (path.startsWith('/verify/')) {
    return {
      ...SEO_ROUTES['/verify'],
      canonical: `${BASE_URL}${path}`,
    };
  }

  if (path.startsWith('/share/')) {
    return {
      title: 'Shared Typing Result | TypeMasterAI',
      description: 'View this shared typing test result from TypeMasterAI. See WPM, accuracy, and other statistics.',
      keywords: 'shared result, typing result, wpm result',
      canonical: `${BASE_URL}${path}`,
      ogType: 'website',
    };
  }

  if (path.startsWith('/result/')) {
    return {
      title: 'Typing Test Result | TypeMasterAI',
      description: 'View your typing test result with detailed statistics including WPM, accuracy, and keystroke analytics.',
      keywords: 'typing result, wpm result, test result',
      canonical: `${BASE_URL}${path}`,
      ogType: 'website',
    };
  }

  if (path.startsWith('/blog/')) {
    const slug = path.replace('/blog/', '').trim();
    if (!slug) return {
      ...SEO_ROUTES['/blog'],
      canonical: `${BASE_URL}/blog`,
    };
    if (slug.startsWith('tag/')) {
      const tagSlug = slug.replace('tag/', '');
      return {
        title: `Tag: ${tagSlug} | TypeMasterAI Blog`,
        description: `Articles tagged "${tagSlug}" on the TypeMasterAI Blog.`,
        keywords: `typing blog, ${tagSlug}`,
        canonical: `${BASE_URL}/blog/tag/${tagSlug}`,
        ogType: 'website',
      };
    }
    return {
      title: `TypeMasterAI Blog`,
      description: 'Read this article on the TypeMasterAI blog.',
      keywords: 'typing blog, article',
      canonical: `${BASE_URL}${path}`,
      ogType: 'article',
    };
  }

  if (path.startsWith('/race/')) {
    return {
      title: 'Typing Race | TypeMasterAI',
      description: 'Join this multiplayer typing race and compete against other typists in real-time!',
      keywords: 'typing race, multiplayer race, compete typing',
      canonical: `${BASE_URL}${path}`,
      ogType: 'website',
      noindex: true, // Race rooms are temporary
    };
  }

  return null;
}

export const BASE_URL_CONST = BASE_URL;
