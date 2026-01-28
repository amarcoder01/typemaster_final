import { Link } from 'wouter';
import { Keyboard, Zap, Users, Code, BarChart2, Trophy, Clock, Globe, ChevronDown } from 'lucide-react';
import TypingTest from "@/components/typing-test";
import { useSEO, SEO_CONFIGS } from '@/lib/seo';
import { PLATFORM_STATS, formatNumber } from '@shared/platform-stats';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { RelatedFeatures, QuickLinksFooter } from '@/components/related-features';
import { AuthPrompt } from '@/components/auth-prompt';

// FAQ data matching the structured data in index.html
const FAQ_ITEMS = [
  {
    question: "How do I test my typing speed?",
    answer: "Simply start typing the displayed text above. Your WPM (words per minute) and accuracy will be calculated in real-time. The test takes 60 seconds by default, but you can choose 15s, 30s, 1min, 3min, or 5min durations."
  },
  {
    question: "What is a good typing speed?",
    answer: "The average typing speed is around 40 WPM. 50-80 WPM is considered good, 80-95 WPM is very good, and 95+ WPM is excellent. Professional typists often exceed 120 WPM. The world record is over 200 WPM."
  },
  {
    question: "Is TypeMasterAI free to use?",
    answer: "Yes! TypeMasterAI is 100% free forever. You can take unlimited typing tests, track your progress, compete in multiplayer races, use code typing mode, and access AI-powered analytics without any cost or signup required."
  },
  {
    question: "How accurate is the WPM calculation?",
    answer: "TypeMasterAI uses the standard WPM formula: (characters typed / 5) / minutes elapsed. This industry-standard calculation ensures accurate and comparable results. We also track accuracy, consistency, and keystroke analytics."
  },
  {
    question: "Can I practice typing in different languages?",
    answer: "Yes! TypeMasterAI supports 23+ languages including English, Spanish, French, German, Portuguese, Italian, Russian, Chinese, Japanese, Korean, Arabic, Hindi, and many more."
  }
];

export default function Home() {
  useSEO(SEO_CONFIGS.home);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="relative">
      {/* Ambient Background - CSS-based geometric pattern */}
      <div className="fixed inset-0 z-[-1] opacity-20 pointer-events-none" aria-hidden="true">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(30deg, hsl(var(--primary) / 0.1) 12%, transparent 12.5%, transparent 87%, hsl(var(--primary) / 0.1) 87.5%, hsl(var(--primary) / 0.1)),
              linear-gradient(150deg, hsl(var(--primary) / 0.1) 12%, transparent 12.5%, transparent 87%, hsl(var(--primary) / 0.1) 87.5%, hsl(var(--primary) / 0.1)),
              linear-gradient(30deg, hsl(var(--primary) / 0.1) 12%, transparent 12.5%, transparent 87%, hsl(var(--primary) / 0.1) 87.5%, hsl(var(--primary) / 0.1)),
              linear-gradient(150deg, hsl(var(--primary) / 0.1) 12%, transparent 12.5%, transparent 87%, hsl(var(--primary) / 0.1) 87.5%, hsl(var(--primary) / 0.1)),
              linear-gradient(60deg, hsl(var(--muted) / 0.15) 25%, transparent 25.5%, transparent 75%, hsl(var(--muted) / 0.15) 75%, hsl(var(--muted) / 0.15)),
              linear-gradient(60deg, hsl(var(--muted) / 0.15) 25%, transparent 25.5%, transparent 75%, hsl(var(--muted) / 0.15) 75%, hsl(var(--muted) / 0.15))
            `,
            backgroundSize: '80px 140px',
            backgroundPosition: '0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px'
          }}
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
      </div>

      {/* Hero Section with H1 for SEO */}
      <header className="flex flex-col items-center gap-3 sm:gap-4 mb-8 sm:mb-12 px-4 sm:px-0">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/40">
          Master the Flow
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl text-center">
          Test your typing speed, track your progress, and compete with others in a distraction-free environment.
        </p>
      </header>

      {/* Main Typing Test Component */}
      <TypingTest />

      {/* Login prompt for guests */}
      <div className="max-w-4xl mx-auto px-4">
        <AuthPrompt />
      </div>

      {/* Extended SEO Content & Features Sections */}
      <section className="hidden mt-16 sm:mt-24 space-y-16 sm:space-y-24">

        {/* AI Answer / TL;DR Section */}
        <div className="hidden max-w-4xl mx-auto px-4">
          <div className="bg-card/30 border border-primary/20 rounded-xl p-6 shadow-lg shadow-primary/5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground m-0">Quick Answer: Free Online Typing Test</h2>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed mb-4">
              <strong>TypeMasterAI</strong> is a free, professional-grade typing test that measures your WPM (Words Per Minute) and accuracy. It features 23+ languages, code typing modes, and detailed analytics.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-primary mb-1">Instant Results</h3>
                <p className="text-sm text-muted-foreground">Get your certified WPM score immediately after the 60-second test.</p>
              </div>
              <div>
                <h3 className="font-semibold text-primary mb-1">No Signup Needed</h3>
                <p className="text-sm text-muted-foreground">Start testing right away. Create an account only if you want to save history.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics / Social Proof */}
        <div className="hidden grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto px-4">
          <div className="text-center p-4 sm:p-6 bg-card/30 rounded-xl border border-border/50">
            <div className="text-2xl sm:text-3xl font-bold text-primary font-mono mb-1">
              {formatNumber(PLATFORM_STATS.TOTAL_USERS)}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Active Users</div>
          </div>
          <div className="text-center p-4 sm:p-6 bg-card/30 rounded-xl border border-border/50">
            <div className="text-2xl sm:text-3xl font-bold text-primary font-mono mb-1">
              {formatNumber(PLATFORM_STATS.TOTAL_TESTS)}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Tests Completed</div>
          </div>
          <div className="text-center p-4 sm:p-6 bg-card/30 rounded-xl border border-border/50">
            <div className="text-2xl sm:text-3xl font-bold text-primary font-mono mb-1">
              {PLATFORM_STATS.TOTAL_LANGUAGES}+
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Languages</div>
          </div>
          <div className="text-center p-4 sm:p-6 bg-card/30 rounded-xl border border-border/50">
            <div className="text-2xl sm:text-3xl font-bold text-primary font-mono mb-1">
              20+
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Code Languages</div>
          </div>
        </div>

        {/* Features Section */}
        <div className="hidden max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">
            Why Choose TypeMasterAI for Your Typing Test?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <article className="p-6 bg-card/30 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
              <Zap className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Real-Time WPM Tracking</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                See your words per minute update live as you type. Our accurate WPM calculator uses the industry-standard formula for reliable results.
              </p>
            </article>

            <article className="p-6 bg-card/30 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
              <Code className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Code Typing Mode</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Practice typing code in 20+ programming languages including JavaScript, Python, Java, C++, TypeScript, and Rust with syntax highlighting.
              </p>
            </article>

            <article className="p-6 bg-card/30 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
              <Users className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Multiplayer Racing</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Compete against other typists in real-time races. See live WPM updates, earn ELO ratings, and climb the global leaderboard.
              </p>
            </article>

            <article className="p-6 bg-card/30 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
              <BarChart2 className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">AI-Powered Analytics</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Get detailed keystroke heatmaps, finger usage statistics, accuracy metrics, and personalized AI recommendations to improve faster.
              </p>
            </article>

            <article className="p-6 bg-card/30 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
              <Globe className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">23+ Languages</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Practice typing in your preferred language. We support English, Spanish, French, German, Japanese, Chinese, Korean, Arabic, and more.
              </p>
            </article>

            <article className="p-6 bg-card/30 rounded-xl border border-border/50 hover:border-primary/30 transition-colors">
              <Trophy className="w-8 h-8 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Achievements & Certificates</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Earn achievements, unlock badges, and download verifiable certificates. Track your progress and showcase your typing skills.
              </p>
            </article>
          </div>
        </div>

        {/* How It Works */}
        <div className="hidden max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">
            How to Test Your Typing Speed
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold mb-2">Choose Duration</h3>
              <p className="text-muted-foreground text-sm">Select 15s, 30s, 1min, 3min, or 5min. One minute is recommended for accurate results.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold mb-2">Start Typing</h3>
              <p className="text-muted-foreground text-sm">Click the text area and type the displayed paragraph. Your WPM updates in real-time.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold mb-2">View Results</h3>
              <p className="text-muted-foreground text-sm">See your WPM, accuracy, and detailed analytics. Save results by creating a free account.</p>
            </div>
          </div>
        </div>

        {/* Quick Links to Test Modes */}
        <div className="hidden max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            Choose Your Typing Test
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/1-minute-typing-test">
              <div className="p-4 bg-card/30 rounded-xl border border-border/50 hover:border-primary/50 transition-colors text-center cursor-pointer">
                <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="font-semibold">1 Minute Test</div>
                <div className="text-xs text-muted-foreground">Quick WPM check</div>
              </div>
            </Link>
            <Link href="/3-minute-typing-test">
              <div className="p-4 bg-card/30 rounded-xl border border-border/50 hover:border-primary/50 transition-colors text-center cursor-pointer">
                <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="font-semibold">3 Minute Test</div>
                <div className="text-xs text-muted-foreground">Extended practice</div>
              </div>
            </Link>
            <Link href="/code-mode">
              <div className="p-4 bg-card/30 rounded-xl border border-border/50 hover:border-primary/50 transition-colors text-center cursor-pointer">
                <Code className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="font-semibold">Code Typing</div>
                <div className="text-xs text-muted-foreground">For developers</div>
              </div>
            </Link>
            <Link href="/multiplayer">
              <div className="p-4 bg-card/30 rounded-xl border border-border/50 hover:border-primary/50 transition-colors text-center cursor-pointer">
                <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="font-semibold">Multiplayer Race</div>
                <div className="text-xs text-muted-foreground">Compete live</div>
              </div>
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="hidden max-w-3xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => (
              <div key={index} className="border border-border/50 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-card/30 transition-colors"
                >
                  <span className="font-medium pr-4">{item.question}</span>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-muted-foreground shrink-0 transition-transform",
                    openFaq === index && "rotate-180"
                  )} />
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4 text-muted-foreground text-sm leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/faq" className="text-primary hover:underline text-sm">
              View all FAQs →
            </Link>
          </div>
        </div>

        {/* Related Features - Internal Linking */}
        <div className="hidden max-w-4xl mx-auto px-4">
          <RelatedFeatures
            title="Explore More Features"
            features="specialized"
            columns={4}
          />
          <RelatedFeatures
            title="Learning Resources"
            features="learning"
            columns={4}
          />
        </div>

        {/* Final CTA */}
        <div className="hidden max-w-2xl mx-auto px-4 text-center pb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Improve Your Typing Speed?
          </h2>
          <p className="text-muted-foreground mb-6">
            Join {formatNumber(PLATFORM_STATS.TOTAL_USERS)} users who have improved their typing speed with TypeMasterAI. No signup required to start.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            <Keyboard className="w-5 h-5" />
            Start Typing Test
          </button>
        </div>

        {/* Quick Links Footer */}
        <div className="max-w-4xl mx-auto px-4 border-t border-border/30 mt-8">
          <QuickLinksFooter exclude={['/']} />
        </div>

      </section>
    </div>
  );
}
