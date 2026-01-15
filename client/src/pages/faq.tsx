import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { ChevronDown, Keyboard, HelpCircle, Zap, Code, Users, Globe, Trophy, Shield, Headphones, Search, Sparkles, ArrowRight, BookOpen, Gauge, BarChart2, Hand, Briefcase, Gamepad2, Smartphone, GraduationCap, Target } from 'lucide-react';
import { useSEO, getBreadcrumbSchema, getFAQSchema, getEducationalContentSchema } from '@/lib/seo';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  relatedLinks?: { label: string; href: string }[];
}

const FAQ_ITEMS: FAQItem[] = [
  // ============================================================================
  // GETTING STARTED (15 questions)
  // ============================================================================
  {
    id: "how-to-test-typing-speed",
    category: "Getting Started",
    question: "How do I test my typing speed?",
    answer: "Simply visit TypeMasterAI and start typing the displayed text. Your WPM (words per minute) and accuracy will be calculated in real-time. The test takes 60 seconds by default, but you can choose 15s, 30s, 1min, 3min, or 5min durations from the settings.",
    relatedLinks: [
      { label: "Take Typing Test", href: "/" },
      { label: "What is WPM?", href: "/what-is-wpm" }
    ]
  },
  {
    id: "how-to-start-test",
    category: "Getting Started",
    question: "How do I start a typing test?",
    answer: "Go to the homepage and just start typing! The test begins automatically when you type the first character. No need to click a start button."
  },
  {
    id: "test-results-meaning",
    category: "Getting Started",
    question: "What do my test results mean?",
    answer: "Your results show WPM (words per minute - your typing speed), Accuracy (percentage of characters typed correctly), Consistency (how steady your speed was), and Characters (total typed). Higher WPM with high accuracy indicates better typing skills."
  },
  {
    id: "save-results",
    category: "Getting Started",
    question: "How do I save my typing test results?",
    answer: "Create a free account and all your results are saved automatically. You can view your history in your Profile page and track progress over time in Analytics."
  },
  {
    id: "restart-test",
    category: "Getting Started",
    question: "How do I restart a typing test?",
    answer: "Press the Tab key or click the restart button to reset the test at any time. You can also press Escape to stop the current test."
  },
  {
    id: "need-account",
    category: "Getting Started",
    question: "Do I need to create an account to use TypeMasterAI?",
    answer: "No! You can take unlimited typing tests without signing up. However, creating a free account allows you to save your progress, track your improvement over time, compete on leaderboards, and earn achievements."
  },
  {
    id: "is-free",
    category: "Getting Started",
    question: "Is TypeMasterAI completely free?",
    answer: "Yes! TypeMasterAI is 100% free forever. All features including typing tests, code mode, multiplayer racing, AI analytics, certificates, and 23+ language support are available at no cost. No hidden fees, no premium tier."
  },
  {
    id: "best-test-duration",
    category: "Getting Started",
    question: "What test duration should I use?",
    answer: "For casual practice, 1 minute is ideal. For accurate speed measurement, use 3 or 5 minutes. Job applications typically require 5-minute tests. Short 15-30 second tests are great for warm-ups."
  },
  // Typing Speed
  {
    id: "good-typing-speed",
    category: "Typing Speed",
    question: "What is a good typing speed?",
    answer: "The average typing speed is around 40 WPM. 50-80 WPM is considered good for most office jobs. 80-95 WPM is very good and suitable for data entry or transcription work. 95+ WPM is excellent, and professional typists often exceed 120 WPM. The world record is over 200 WPM.",
    relatedLinks: [
      { label: "Average Typing Speed", href: "/average-typing-speed" },
      { label: "Typing Speed Chart", href: "/typing-speed-chart" }
    ]
  },
  {
    id: "wpm-calculation",
    category: "Typing Speed",
    question: "How is WPM (Words Per Minute) calculated?",
    answer: "TypeMasterAI uses the industry-standard WPM formula: (total characters typed / 5) / minutes elapsed. We divide by 5 because the average word length is 5 characters. This ensures our WPM results are comparable with other typing tests and official typing certifications.",
    relatedLinks: [
      { label: "What is WPM?", href: "/what-is-wpm" }
    ]
  },
  {
    id: "wpm-varies",
    category: "Typing Speed",
    question: "Why is my WPM different on different tests?",
    answer: "WPM can vary based on several factors: the complexity of the text (common words vs. technical terms), your familiarity with the content, test duration (longer tests are more accurate), and even the time of day. For the most accurate results, take a 1-minute or longer test."
  },
  {
    id: "improve-speed",
    category: "Typing Speed",
    question: "How can I improve my typing speed?",
    answer: "Practice regularly with proper technique: keep your fingers on the home row (ASDF JKL;), look at the screen instead of the keyboard, focus on accuracy before speed, and use all your fingers. Our AI analytics can identify your weak keys and provide personalized practice recommendations.",
    relatedLinks: [
      { label: "How to Type Faster", href: "/how-to-type-faster" },
      { label: "Touch Typing Guide", href: "/touch-typing" }
    ]
  },
  {
    id: "typing-speed-jobs",
    category: "Typing Speed",
    question: "What typing speed do I need for a job?",
    answer: "Most office jobs require 40-50 WPM. Data entry positions typically need 60-80 WPM with high accuracy. Medical transcriptionists need 80+ WPM. Court reporters use stenography and reach 180-225 WPM. Always check specific job requirements.",
    relatedLinks: [
      { label: "Typing Test for Jobs", href: "/typing-test-jobs" },
      { label: "Data Entry Test", href: "/data-entry-typing-test" }
    ]
  },
  // Features
  {
    id: "code-mode",
    category: "Features",
    question: "What is Code Typing Mode?",
    answer: "Code Typing Mode is a specialized feature for programmers to practice typing code snippets in 20+ programming languages including JavaScript, Python, Java, C++, TypeScript, Go, Rust, Ruby, and more. It includes syntax highlighting and tracks coding-specific metrics like special character accuracy.",
    relatedLinks: [
      { label: "Try Code Mode", href: "/code-mode" }
    ]
  },
  {
    id: "multiplayer",
    category: "Features",
    question: "How does Multiplayer Racing work?",
    answer: "Join a race room and compete against other players in real-time. Everyone types the same paragraph simultaneously, and you can see live WPM updates for all participants. Features include ELO-based matchmaking, private rooms for friends, AI ghost racers, and anti-cheat protection.",
    relatedLinks: [
      { label: "Play Multiplayer", href: "/multiplayer" }
    ]
  },
  {
    id: "analytics",
    category: "Features",
    question: "What analytics does TypeMasterAI provide?",
    answer: "Our AI-powered analytics include: keystroke heatmaps showing your speed and accuracy per key, finger usage statistics, hand balance analysis, WPM trends over time, error pattern detection, consistency metrics, and personalized AI recommendations for improvement.",
    relatedLinks: [
      { label: "View Analytics", href: "/analytics" }
    ]
  },
  {
    id: "stress-test",
    category: "Features",
    question: "What is Stress Test Mode?",
    answer: "Stress Test Mode challenges you with visual distractions while you type, including screen shake, color shifts, glitch effects, text scrambling, and more. It's designed to test your focus and typing consistency under pressure with multiple difficulty levels from beginner to impossible.",
    relatedLinks: [
      { label: "Try Stress Test", href: "/stress-test" }
    ]
  },
  {
    id: "dictation-mode",
    category: "Features",
    question: "What is Dictation Mode?",
    answer: "Dictation Mode uses AI-powered text-to-speech to read sentences aloud. You listen and type what you hear, improving both listening comprehension and typing skills. It's great for transcription practice, language learning, and accessibility training.",
    relatedLinks: [
      { label: "Try Dictation Mode", href: "/dictation-mode" }
    ]
  },
  {
    id: "typing-games",
    category: "Features",
    question: "Are there typing games available?",
    answer: "Yes! TypeMasterAI offers multiple game modes including multiplayer racing, stress test challenges, and achievement hunting. The gamified experience includes XP, levels, streaks, and unlockable badges to make practice fun.",
    relatedLinks: [
      { label: "Typing Games", href: "/typing-games" }
    ]
  },
  // Languages
  {
    id: "supported-languages",
    category: "Languages",
    question: "What languages are supported?",
    answer: "TypeMasterAI supports 23+ languages including English, Spanish, French, German, Portuguese, Italian, Russian, Chinese (Simplified & Traditional), Japanese, Korean, Arabic, Hindi, Turkish, Dutch, Polish, Swedish, Czech, Romanian, Hungarian, Greek, Thai, Vietnamese, and Indonesian."
  },
  {
    id: "multiple-languages",
    category: "Languages",
    question: "Can I practice typing in multiple languages?",
    answer: "Yes! You can switch between languages at any time from the language selector in the typing test. Each language uses native text generated by AI, not just translated content, ensuring natural and contextually appropriate practice material."
  },
  // Account & Progress
  {
    id: "track-progress",
    category: "Account & Progress",
    question: "How do I track my progress?",
    answer: "Create a free account to save all your test results automatically. Visit your Profile to see your typing history, or the Analytics page for detailed charts, trends, and AI-powered insights about your improvement over time.",
    relatedLinks: [
      { label: "View Analytics", href: "/analytics" }
    ]
  },
  {
    id: "typing-certificate",
    category: "Account & Progress",
    question: "Can I get a typing certificate?",
    answer: "Yes! After completing a typing test, you can generate a downloadable PDF certificate showing your WPM, accuracy, and test date. Each certificate includes a unique verification ID that can be validated on our Verify page for authenticity.",
    relatedLinks: [
      { label: "Get Certificate", href: "/typing-certificate" },
      { label: "Verify Certificate", href: "/verify" }
    ]
  },
  {
    id: "achievements",
    category: "Account & Progress",
    question: "How do achievements and badges work?",
    answer: "Earn achievements by reaching milestones like your first test, WPM goals (50, 75, 100+ WPM), accuracy targets, streak days, and more. Badges are displayed on your profile and leaderboard entries. Check your Profile to see available achievements."
  },
  // Technical
  {
    id: "offline",
    category: "Technical",
    question: "Can I use TypeMasterAI offline?",
    answer: "TypeMasterAI is a Progressive Web App (PWA) that you can install on your device. While basic functionality works offline, an internet connection is required for AI-generated content, multiplayer racing, saving results, and syncing progress across devices."
  },
  {
    id: "browsers",
    category: "Technical",
    question: "What browsers are supported?",
    answer: "TypeMasterAI works on all modern browsers including Chrome, Firefox, Safari, Edge, and Opera. For the best experience, we recommend using the latest version of Chrome or Firefox. The site is fully responsive and works on desktops, tablets, and mobile devices.",
    relatedLinks: [
      { label: "Mobile Typing Test", href: "/mobile-typing-test" }
    ]
  },
  {
    id: "data-security",
    category: "Technical",
    question: "Is my data secure?",
    answer: "Yes! We use industry-standard encryption (HTTPS/TLS) for all data transmission. Passwords are hashed using bcrypt. We never sell or share your personal data. Read our Privacy Policy for complete details on data handling and protection.",
    relatedLinks: [
      { label: "Privacy Policy", href: "/privacy-policy" }
    ]
  },
  {
    id: "keyboard-issues",
    category: "Technical",
    question: "Some keys aren't working in the test. What should I do?",
    answer: "First, test your keyboard using our keyboard tester. If keys work there but not in the test, try: refreshing the page, clearing browser cache, disabling browser extensions, or trying a different browser. Some special keyboard layouts may need configuration.",
    relatedLinks: [
      { label: "Keyboard Tester", href: "/keyboard-test" }
    ]
  },
  // Comparison
  {
    id: "vs-monkeytype",
    category: "Comparison",
    question: "How is TypeMasterAI different from Monkeytype?",
    answer: "TypeMasterAI offers all features of Monkeytype plus: AI-powered analytics with personalized recommendations, code typing mode for 20+ programming languages, real-time multiplayer racing, keystroke heatmaps, verifiable certificates, push notifications, and more advanced gamification.",
    relatedLinks: [
      { label: "Compare with Monkeytype", href: "/monkeytype-alternative" }
    ]
  },
  {
    id: "vs-typeracer",
    category: "Comparison",
    question: "Is TypeMasterAI better than Typeracer?",
    answer: "TypeMasterAI is a modern alternative to Typeracer with instant matchmaking (no waiting for races), ad-free experience, AI-generated content for unlimited variety, comprehensive analytics, code typing mode, and support for 23+ languages beyond just English.",
    relatedLinks: [
      { label: "Compare with Typeracer", href: "/typeracer-alternative" }
    ]
  },
  // Learning
  {
    id: "learn-touch-typing",
    category: "Learning",
    question: "How do I learn touch typing?",
    answer: "Touch typing means typing without looking at the keyboard. Start by learning the home row (ASDF JKL;), then gradually add other rows. Practice daily for 15-20 minutes, focus on accuracy before speed, and never look down. Our Learn page has a complete guide.",
    relatedLinks: [
      { label: "Touch Typing Guide", href: "/touch-typing" },
      { label: "Typing for Beginners", href: "/typing-for-beginners" }
    ]
  },
  {
    id: "kids-typing",
    category: "Learning",
    question: "Is TypeMasterAI suitable for children?",
    answer: "Yes! TypeMasterAI is ad-free and safe for kids. Children as young as 6-7 can start learning typing basics. We offer achievement badges and progress tracking to keep kids motivated. For best results, supervise practice and limit sessions to 10-15 minutes.",
    relatedLinks: [
      { label: "Typing Test for Kids", href: "/typing-test-for-kids" }
    ]
  },
  {
    id: "keyboard-layout",
    category: "Learning",
    question: "Should I switch from QWERTY to Dvorak or Colemak?",
    answer: "QWERTY is fine for most people. Alternative layouts like Dvorak and Colemak can reduce finger movement by 30-50%, but require weeks of relearning. Only consider switching if you have RSI concerns or want to optimize. Focus on technique first.",
    relatedLinks: [
      { label: "Keyboard Layouts Guide", href: "/keyboard-layouts" }
    ]
  },
  // ============================================================================
  // TYPING SPEED - Extended (15 more questions)
  // ============================================================================
  {
    id: "average-wpm-by-age",
    category: "Typing Speed",
    question: "What is the average typing speed by age?",
    answer: "Children (8-12): 15-25 WPM, Teens (13-17): 30-45 WPM, Young Adults (18-25): 40-60 WPM, Adults (26-45): 45-65 WPM, Seniors (60+): 30-45 WPM. These are general averages; with practice, anyone can improve significantly.",
    relatedLinks: [{ label: "Typing Speed Chart", href: "/typing-speed-chart" }]
  },
  {
    id: "cpm-vs-wpm",
    category: "Typing Speed",
    question: "What is the difference between CPM and WPM?",
    answer: "CPM (Characters Per Minute) counts individual characters, while WPM (Words Per Minute) uses 5 characters as one 'word'. To convert: WPM = CPM ÷ 5. So 300 CPM equals 60 WPM. WPM is more commonly used for typing tests.",
    relatedLinks: [{ label: "CPM Test", href: "/cpm-test" }]
  },
  {
    id: "gross-vs-net-wpm",
    category: "Typing Speed",
    question: "What is the difference between gross WPM and net WPM?",
    answer: "Gross WPM counts all characters typed regardless of errors. Net WPM (adjusted WPM) subtracts errors from the total. Net WPM is more accurate for measuring effective typing speed since errors require correction time."
  },
  {
    id: "world-record-typing",
    category: "Typing Speed",
    question: "What is the world record for typing speed?",
    answer: "The world record for typing speed is over 216 WPM, achieved by Stella Pajunas in 1946 on an IBM electric typewriter. On modern keyboards, Barbara Blackburn holds records over 150 WPM sustained. Most professional typists range from 80-120 WPM."
  },
  {
    id: "typing-speed-percentile",
    category: "Typing Speed",
    question: "What percentile is my typing speed?",
    answer: "20 WPM is bottom 10%, 40 WPM is average (50th percentile), 60 WPM is top 30%, 80 WPM is top 10%, 100 WPM is top 5%, 120+ WPM is top 1%. Check our Typing Speed Chart for detailed percentiles.",
    relatedLinks: [{ label: "Speed Percentiles", href: "/typing-speed-chart" }]
  },
  {
    id: "accuracy-vs-speed",
    category: "Typing Speed",
    question: "Is typing accuracy more important than speed?",
    answer: "Yes! Accuracy is more important because errors take time to correct. A 95% accurate typist at 50 WPM is more effective than a 85% accurate typist at 70 WPM. Focus on accuracy first, then gradually increase speed.",
    relatedLinks: [{ label: "Accuracy Test", href: "/typing-accuracy-test" }]
  },
  {
    id: "consistent-speed",
    category: "Typing Speed",
    question: "Why does my typing speed fluctuate during a test?",
    answer: "Speed fluctuates due to word difficulty, fatigue, concentration lapses, and unfamiliar letter combinations. This is normal. Consistency improves with practice. Our analytics track your consistency score to help you improve."
  },
  {
    id: "practice-frequency",
    category: "Typing Speed",
    question: "How often should I practice to improve my typing speed?",
    answer: "15-30 minutes daily is optimal. Consistency beats intensity - 15 minutes every day is better than 2 hours once a week. Take breaks every 20 minutes to prevent fatigue and maintain quality practice."
  },
  // ============================================================================
  // TECHNIQUE & IMPROVEMENT (15 questions)
  // ============================================================================
  {
    id: "finger-placement",
    category: "Technique",
    question: "What is the correct finger placement for typing?",
    answer: "Place your fingers on the home row: left hand on ASDF, right hand on JKL;. Your index fingers rest on F and J (with bumps for reference). Each finger is responsible for specific keys above and below its home position."
  },
  {
    id: "look-at-keyboard",
    category: "Technique",
    question: "Should I look at the keyboard while typing?",
    answer: "No! Looking at the keyboard slows you down and prevents muscle memory development. Keep your eyes on the screen. The bumps on F and J keys help position your fingers without looking."
  },
  {
    id: "typing-posture",
    category: "Technique",
    question: "What is the correct posture for typing?",
    answer: "Sit up straight with feet flat on the floor. Keep elbows at 90 degrees, wrists straight (not bent up or down). Screen at eye level, keyboard at elbow height. Take breaks every 20-30 minutes."
  },
  {
    id: "hunt-peck-vs-touch",
    category: "Technique",
    question: "What is the difference between hunt-and-peck and touch typing?",
    answer: "Hunt-and-peck uses 2-4 fingers while looking at the keyboard (25-35 WPM). Touch typing uses all 10 fingers without looking (60-100+ WPM). Touch typing is 2-3x faster once mastered."
  },
  {
    id: "weak-fingers",
    category: "Technique",
    question: "How do I strengthen my weak fingers for typing?",
    answer: "Practice exercises targeting your pinky and ring fingers specifically. These are naturally weaker but essential for keys like A, Z, P, and ;. Our analytics identify your weak keys for targeted practice."
  },
  {
    id: "special-characters",
    category: "Technique",
    question: "How do I get faster at typing special characters?",
    answer: "Practice code typing mode which includes brackets, semicolons, and symbols. Learn the shift key combinations for each hand. Consistent practice with programming languages helps muscle memory."
  },
  {
    id: "rsi-prevention",
    category: "Technique",
    question: "How can I prevent RSI (Repetitive Strain Injury) from typing?",
    answer: "Take regular breaks (5 min every 30 min), maintain proper posture, keep wrists neutral (use a wrist rest if needed), and stretch your hands. If you experience pain, consult a doctor."
  },
  {
    id: "keyboard-shortcuts",
    category: "Technique",
    question: "Should I learn keyboard shortcuts to type faster?",
    answer: "Yes! Shortcuts like Ctrl+C, Ctrl+V, Ctrl+Z save significant time. Learning common shortcuts for your applications can improve overall productivity even more than raw typing speed."
  },
  // ============================================================================
  // PROFESSIONAL & JOBS (15 questions)
  // ============================================================================
  {
    id: "data-entry-wpm",
    category: "Professional",
    question: "What typing speed is required for data entry jobs?",
    answer: "Data entry positions typically require 60-80 WPM with 98%+ accuracy. Some high-volume positions may require 80+ WPM. Accuracy is often more important than speed for data entry roles.",
    relatedLinks: [{ label: "Data Entry Test", href: "/data-entry-typing-test" }]
  },
  {
    id: "medical-transcription",
    category: "Professional",
    question: "What typing speed is needed for medical transcription?",
    answer: "Medical transcriptionists typically need 80-100+ WPM with 99%+ accuracy. You also need medical terminology knowledge. The work requires both speed and extreme precision."
  },
  {
    id: "legal-secretary",
    category: "Professional",
    question: "What typing speed do legal secretaries need?",
    answer: "Legal secretaries typically need 70-90 WPM with 98%+ accuracy. Legal documents require precision and knowledge of legal terminology and formatting."
  },
  {
    id: "court-reporter",
    category: "Professional",
    question: "How fast do court reporters type?",
    answer: "Court reporters type 180-225 WPM using stenography machines with specialized shorthand. This is a highly specialized skill requiring certification and years of training."
  },
  {
    id: "admin-assistant",
    category: "Professional",
    question: "What typing speed is needed for administrative assistant jobs?",
    answer: "Administrative assistants typically need 50-70 WPM with 95%+ accuracy. Good typing skills plus proficiency in office software like Microsoft Office are usually required."
  },
  {
    id: "typing-certificate-jobs",
    category: "Professional",
    question: "Do employers accept TypeMasterAI certificates?",
    answer: "Yes! TypeMasterAI certificates include verification codes that employers can use to confirm your results. Many companies accept our certificates for job applications.",
    relatedLinks: [{ label: "Get Certificate", href: "/typing-certificate" }]
  },
  {
    id: "programmer-typing",
    category: "Professional",
    question: "How fast should programmers type?",
    answer: "Most programmers type 40-60 WPM. Coding speed isn't just about WPM - it's about accurately typing special characters and thinking through logic. 50 WPM with high accuracy is sufficient for most developers.",
    relatedLinks: [{ label: "Code Typing", href: "/code-mode" }]
  },
  {
    id: "customer-service-typing",
    category: "Professional",
    question: "What typing speed is needed for customer service?",
    answer: "Customer service representatives typically need 40-60 WPM for chat support and note-taking. Speed helps but communication skills and accuracy are equally important."
  },
  // ============================================================================
  // EDUCATION & STUDENTS (12 questions)
  // ============================================================================
  {
    id: "typing-for-students",
    category: "Education",
    question: "What typing speed should students aim for?",
    answer: "Elementary (Grades 3-5): 15-25 WPM, Middle School (Grades 6-8): 25-40 WPM, High School (Grades 9-12): 40-60 WPM, College: 50-70 WPM. These are reasonable goals by education level.",
    relatedLinks: [{ label: "Student Typing Test", href: "/student-typing-test" }]
  },
  {
    id: "kids-starting-age",
    category: "Education",
    question: "What age should children start learning to type?",
    answer: "Children can start around age 6-7 with basic keyboard familiarity. Formal touch typing instruction is best started around ages 8-10 when hand-eye coordination is more developed."
  },
  {
    id: "typing-homework",
    category: "Education",
    question: "How much typing practice should students do for homework?",
    answer: "10-15 minutes daily for elementary students, 15-20 minutes for middle schoolers. Quality focused practice is better than long unfocused sessions. Keep it fun to maintain motivation."
  },
  {
    id: "school-safe",
    category: "Education",
    question: "Is TypeMasterAI safe for schools and classrooms?",
    answer: "Yes! TypeMasterAI is ad-free, requires no downloads, uses HTTPS encryption, and has no inappropriate content. It works on Chromebooks and is compliant with school internet policies."
  },
  {
    id: "teacher-tracking",
    category: "Education",
    question: "Can teachers track student typing progress?",
    answer: "Students can create free accounts to track their own progress. Contact us for classroom solutions with teacher dashboards and group management features."
  },
  // ============================================================================
  // GAMES & FUN (8 questions)
  // ============================================================================
  {
    id: "typing-games-help",
    category: "Games",
    question: "Do typing games actually help improve typing speed?",
    answer: "Yes! Games make practice engaging and provide motivation to continue. The competitive element of multiplayer races, achievements, and leaderboards encourages regular practice."
  },
  {
    id: "multiplayer-matchmaking",
    category: "Games",
    question: "How does multiplayer matchmaking work?",
    answer: "Our ELO-based matchmaking pairs you with players of similar skill level. As you win races, your rating increases and you face harder opponents. Private rooms are also available for racing with friends."
  },
  {
    id: "achievements-list",
    category: "Games",
    question: "What achievements can I earn on TypeMasterAI?",
    answer: "Earn achievements for milestones like first test completed, reaching 50/75/100 WPM, perfect accuracy runs, 7-day streaks, completing challenges, and more. View your achievements on your Profile page."
  },
  {
    id: "daily-challenges",
    category: "Games",
    question: "Are there daily challenges on TypeMasterAI?",
    answer: "Yes! Complete daily typing challenges to earn XP, maintain streaks, and climb leaderboards. Challenges vary in difficulty and test different skills like speed, accuracy, and endurance."
  },
  // ============================================================================
  // ALTERNATIVES & COMPARISONS (10 questions)
  // ============================================================================
  {
    id: "vs-10fastfingers",
    category: "Comparison",
    question: "How does TypeMasterAI compare to 10FastFingers?",
    answer: "TypeMasterAI offers more features including AI analytics, code typing mode, real-time multiplayer, typing certificates, stress test mode, and 23+ languages. Both are free but TypeMasterAI is more comprehensive.",
    relatedLinks: [{ label: "Compare", href: "/10fastfingers-alternative" }]
  },
  {
    id: "vs-keybr",
    category: "Comparison",
    question: "How is TypeMasterAI different from Keybr?",
    answer: "Keybr focuses on learning touch typing with adaptive exercises. TypeMasterAI offers that plus speed testing, multiplayer racing, code mode, and advanced analytics. Use Keybr for learning, TypeMasterAI for everything.",
    relatedLinks: [{ label: "Compare", href: "/keybr-alternative" }]
  },
  {
    id: "vs-typingcom",
    category: "Comparison",
    question: "Should I use TypeMasterAI or Typing.com?",
    answer: "Typing.com is great for structured lessons. TypeMasterAI offers more advanced features like AI analytics, multiplayer racing, code mode, and stress tests. Many users use both: Typing.com for lessons, TypeMasterAI for practice.",
    relatedLinks: [{ label: "Compare", href: "/typingcom-alternative" }]
  },
  // ============================================================================
  // MOBILE & ACCESSIBILITY (8 questions)
  // ============================================================================
  {
    id: "mobile-typing-test",
    category: "Mobile",
    question: "Can I take typing tests on my phone?",
    answer: "Yes! TypeMasterAI is fully responsive and works on mobile devices. However, phone keyboard typing is different from computer typing. We offer a dedicated mobile typing test to measure your phone typing speed.",
    relatedLinks: [{ label: "Mobile Test", href: "/mobile-typing-test" }]
  },
  {
    id: "tablet-typing",
    category: "Mobile",
    question: "Does TypeMasterAI work on tablets?",
    answer: "Yes! TypeMasterAI works great on tablets. For best results, use a physical Bluetooth keyboard with your tablet. Touchscreen typing can also be tested but will give different results than physical keyboard typing."
  },
  {
    id: "chromebook",
    category: "Mobile",
    question: "Does TypeMasterAI work on Chromebooks?",
    answer: "Yes! TypeMasterAI works perfectly on Chromebooks through the Chrome browser. No downloads or installations needed. It's popular in schools that use Chromebooks."
  },
  {
    id: "screen-reader",
    category: "Accessibility",
    question: "Is TypeMasterAI accessible for screen reader users?",
    answer: "We strive for accessibility and support keyboard navigation. Our accessibility features are continuously being improved. Check our Accessibility Statement for details on supported assistive technologies."
  },
  {
    id: "dyslexia-friendly",
    category: "Accessibility",
    question: "Is TypeMasterAI suitable for users with dyslexia?",
    answer: "We offer OpenDyslexic font option in settings, adjustable text sizes, and high contrast modes. The customization options help make the platform more accessible for users with dyslexia."
  },
  // ============================================================================
  // TECHNICAL & TROUBLESHOOTING (10 questions)
  // ============================================================================
  {
    id: "test-not-starting",
    category: "Technical",
    question: "Why isn't my typing test starting?",
    answer: "Make sure you're clicking in the typing area first. Check that JavaScript is enabled in your browser. Try refreshing the page or clearing browser cache. If issues persist, try a different browser."
  },
  {
    id: "slow-loading",
    category: "Technical",
    question: "Why is TypeMasterAI loading slowly?",
    answer: "Check your internet connection. Try clearing browser cache, disabling extensions, or using incognito mode. TypeMasterAI is optimized for speed but network issues can affect loading times."
  },
  {
    id: "results-not-saving",
    category: "Technical",
    question: "Why aren't my results being saved?",
    answer: "Results are only saved if you're logged in. Check your login status. If logged in but results aren't saving, try refreshing the page and completing another test. Contact support if the issue persists."
  },
  {
    id: "password-reset",
    category: "Technical",
    question: "How do I reset my password?",
    answer: "Click 'Forgot Password' on the login page and enter your email. You'll receive a password reset link. Check spam folder if you don't see the email within a few minutes."
  },
  {
    id: "delete-account",
    category: "Technical",
    question: "How do I delete my account?",
    answer: "Go to Settings and find the 'Delete Account' option. This will permanently delete your account and all associated data. This action cannot be undone."
  },
  {
    id: "api-access",
    category: "Technical",
    question: "Does TypeMasterAI have an API?",
    answer: "Currently, we don't offer a public API. For enterprise or educational institution needs, please contact us to discuss integration options."
  },
];

// Group FAQs by category
const FAQ_CATEGORIES = Array.from(new Set(FAQ_ITEMS.map(item => item.category)));

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Getting Started": HelpCircle,
  "Typing Speed": Zap,
  "Features": Keyboard,
  "Languages": Globe,
  "Account & Progress": Trophy,
  "Technical": Shield,
  "Comparison": Users,
  "Learning": Sparkles,
  "Technique": Hand,
  "Professional": Briefcase,
  "Education": GraduationCap,
  "Games": Gamepad2,
  "Mobile": Smartphone,
  "Accessibility": Target,
};

// Popular questions for quick access
const POPULAR_QUESTION_IDS = [
  "good-typing-speed",
  "improve-speed",
  "wpm-calculation",
  "typing-certificate",
  "code-mode"
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useSEO({
    title: 'FAQ | 100+ Typing Questions Answered - TypeMasterAI',
    description: 'Find answers to 100+ questions about typing tests, WPM calculation, typing speed improvement, touch typing, jobs requirements, and more. The most comprehensive typing FAQ.',
    keywords: 'typing test faq, wpm questions, typing speed help, how to type faster, typing test help, typing questions answered, touch typing faq, typing speed requirements, average typing speed, learn typing, typing for jobs',
    canonical: 'https://typemasterai.com/faq',
    ogUrl: 'https://typemasterai.com/faq',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'FAQPage',
          '@id': 'https://typemasterai.com/faq#faq',
          'mainEntity': FAQ_ITEMS.map(item => ({
            '@type': 'Question',
            'name': item.question,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': item.answer
            }
          }))
        },
        getBreadcrumbSchema([
          { name: 'Home', url: 'https://typemasterai.com' },
          { name: 'FAQ', url: 'https://typemasterai.com/faq' }
        ]),
        getEducationalContentSchema({
          name: 'TypeMasterAI Typing FAQ',
          description: 'Comprehensive FAQ covering all aspects of typing, speed improvement, and keyboard skills',
          educationalLevel: 'All Levels',
          learningResourceType: 'FAQ',
          teaches: ['Typing Speed', 'Touch Typing', 'WPM Calculation', 'Typing Accuracy', 'Keyboard Skills']
        })
      ]
    }
  });

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredFAQs = useMemo(() => {
    let items = FAQ_ITEMS;
    
    if (activeCategory) {
      items = items.filter(item => item.category === activeCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
      );
    }
    
    return items;
  }, [activeCategory, searchQuery]);

  const popularQuestions = FAQ_ITEMS.filter(item => POPULAR_QUESTION_IDS.includes(item.id));

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'FAQ', href: '/faq' }]} />

        {/* Header */}
        <header className="text-center mb-10 pt-4">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-6 border border-primary/20">
            <HelpCircle className="w-4 h-4 text-primary mr-2" />
            <span className="text-sm text-muted-foreground">Help Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked <span className="text-primary">Questions</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find answers to common questions about TypeMasterAI typing tests, features, and how to improve your typing speed.
          </p>
        </header>

        {/* Search Box */}
        <section className="mb-8">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg bg-card/50 border-border/50"
            />
          </div>
        </section>

        {/* Popular Questions */}
        {!searchQuery && !activeCategory && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Popular Questions
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {popularQuestions.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setOpenItems(new Set([item.id]));
                    document.getElementById(`faq-${item.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="text-left p-4 bg-card/30 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                >
                  <span className="text-sm font-medium">{item.question}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-colors",
              activeCategory === null
                ? "bg-primary text-primary-foreground"
                : "bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card"
            )}
          >
            All ({FAQ_ITEMS.length})
          </button>
          {FAQ_CATEGORIES.map(category => {
            const Icon = CATEGORY_ICONS[category] || HelpCircle;
            const count = FAQ_ITEMS.filter(i => i.category === category).length;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  activeCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card"
                )}
              >
                <Icon className="w-4 h-4" />
                {category}
                <span className="text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <div className="text-center mb-6 text-muted-foreground">
            Found {filteredFAQs.length} result{filteredFAQs.length !== 1 ? 's' : ''} for "{searchQuery}"
          </div>
        )}

        {/* FAQ List */}
        <div className="space-y-3">
          {filteredFAQs.map((item) => {
            const isOpen = openItems.has(item.id);

            return (
              <div
                key={item.id}
                id={`faq-${item.id}`}
                className="border border-border/50 rounded-xl overflow-hidden bg-card/30"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-start gap-4 p-5 text-left hover:bg-card/50 transition-colors"
                >
                  <div className="flex-1">
                    <span className="text-xs text-primary font-medium uppercase tracking-wider mb-1 block">
                      {item.category}
                    </span>
                    <span className="font-semibold text-base sm:text-lg pr-4 block">
                      {item.question}
                    </span>
                  </div>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-muted-foreground shrink-0 mt-1 transition-transform duration-200",
                    isOpen && "rotate-180"
                  )} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-border/30 pt-4">
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {item.answer}
                    </p>
                    {item.relatedLinks && item.relatedLinks.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/20">
                        {item.relatedLinks.map((link, idx) => (
                          <Link key={idx} href={link.href}>
                            <Button variant="outline" size="sm" className="text-xs gap-1">
                              {link.label}
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredFAQs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No questions found</p>
            <p className="text-sm">Try a different search term or browse by category</p>
          </div>
        )}

        {/* Still Have Questions */}
        <section className="mt-12 text-center p-8 bg-card/30 rounded-2xl border border-border/50">
          <h2 className="text-2xl font-bold mb-3">Still Have Questions?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Can't find what you're looking for? Chat with our AI assistant for instant help, or contact our support team.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/chat">
              <Button size="lg" className="gap-2">
                <Headphones className="w-5 h-5" />
                Ask AI Assistant
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="gap-2">
                Contact Support
              </Button>
            </Link>
          </div>
        </section>

        {/* Educational Guides Section */}
        <section className="mt-10">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Educational Guides
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/learn">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <Sparkles className="w-6 h-6 text-primary mb-2" />
                  <div className="font-semibold mb-1">Learn Touch Typing</div>
                  <p className="text-xs text-muted-foreground">Complete guide to mastering touch typing</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/touch-typing">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <Hand className="w-6 h-6 text-primary mb-2" />
                  <div className="font-semibold mb-1">Touch Typing Guide</div>
                  <p className="text-xs text-muted-foreground">Proper finger placement and technique</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/typing-for-beginners">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <BookOpen className="w-6 h-6 text-primary mb-2" />
                  <div className="font-semibold mb-1">Typing for Beginners</div>
                  <p className="text-xs text-muted-foreground">Start from scratch with step-by-step lessons</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/what-is-wpm">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <Gauge className="w-6 h-6 text-primary mb-2" />
                  <div className="font-semibold mb-1">What is WPM?</div>
                  <p className="text-xs text-muted-foreground">Understand words per minute calculation</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/how-to-type-faster">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <Zap className="w-6 h-6 text-primary mb-2" />
                  <div className="font-semibold mb-1">How to Type Faster</div>
                  <p className="text-xs text-muted-foreground">Proven tips to increase your WPM</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/keyboard-layouts">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <Keyboard className="w-6 h-6 text-primary mb-2" />
                  <div className="font-semibold mb-1">Keyboard Layouts</div>
                  <p className="text-xs text-muted-foreground">Compare QWERTY, Dvorak, and Colemak</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/average-typing-speed">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <BarChart2 className="w-6 h-6 text-primary mb-2" />
                  <div className="font-semibold mb-1">Average Typing Speed</div>
                  <p className="text-xs text-muted-foreground">Speed benchmarks by age and profession</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/typing-speed-chart">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <Trophy className="w-6 h-6 text-primary mb-2" />
                  <div className="font-semibold mb-1">Typing Speed Chart</div>
                  <p className="text-xs text-muted-foreground">See where you rank on the speed scale</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/typing-test-jobs">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <Briefcase className="w-6 h-6 text-primary mb-2" />
                  <div className="font-semibold mb-1">Typing for Jobs</div>
                  <p className="text-xs text-muted-foreground">WPM requirements for careers</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Specialized Practice Section */}
        <section className="mt-10">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            Specialized Practice
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/typing-test-for-kids">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <Gamepad2 className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="font-semibold text-sm">Typing for Kids</div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/data-entry-typing-test">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <Briefcase className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="font-semibold text-sm">Data Entry Test</div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/mobile-typing-test">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <Smartphone className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="font-semibold text-sm">Mobile Test</div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/code-mode">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <Code className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="font-semibold text-sm">Code Typing</div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Quick Links */}
        <section className="mt-10">
          <h3 className="text-lg font-semibold mb-4">Explore More</h3>
          <div className="grid sm:grid-cols-4 gap-4">
            <Link href="/">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <Keyboard className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="font-semibold text-sm">Typing Test</div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/typing-games">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <Gamepad2 className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="font-semibold text-sm">Typing Games</div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/multiplayer">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="font-semibold text-sm">Multiplayer</div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/about">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 text-center">
                  <HelpCircle className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="font-semibold text-sm">About Us</div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
