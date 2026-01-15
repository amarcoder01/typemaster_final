import { Link } from 'wouter';
import { Smartphone, Zap, ArrowRight, HelpCircle, ChevronDown, Keyboard, Target, Clock } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { AuthorBio } from '@/components/author-bio';
import TypingTest from '@/components/typing-test';
import { AuthPrompt } from "@/components/auth-prompt";
import { useState } from 'react';
import { cn } from '@/lib/utils';

const PAGE_FAQS = [
  {
    question: "What is a good typing speed on a phone?",
    answer: "Average mobile typing speed is 35-40 WPM. Good mobile typists reach 50-60 WPM, and expert thumb typists can exceed 70 WPM. This is generally slower than desktop typing due to smaller keys."
  },
  {
    question: "Is mobile typing speed measured the same as desktop?",
    answer: "Yes, WPM is calculated the same way. However, mobile tests often account for autocorrect usage. Pure typing tests (without autocorrect) give more accurate measurements."
  },
  {
    question: "How can I type faster on my phone?",
    answer: "Use both thumbs, enable swipe typing if available, learn your keyboard's shortcuts, practice regularly, and consider using a third-party keyboard optimized for speed."
  },
  {
    question: "Should I use swipe typing or tap typing?",
    answer: "Swipe typing can be faster for words but requires learning. Tap typing is more accurate for names and uncommon words. Most fast typists use a combination of both."
  },
  {
    question: "Does phone screen size affect typing speed?",
    answer: "Yes, larger screens generally allow faster typing due to bigger key targets. However, very large phones may require repositioning hands, which can slow you down."
  },
  {
    question: "Can I practice mobile typing on this site?",
    answer: "Absolutely! TypeMasterAI is fully responsive and works on phones and tablets. The typing test automatically adapts to your screen size for optimal practice."
  }
];

export default function MobileTypingTestPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useSEO({
    title: 'Mobile Typing Test: Test Your Phone Typing Speed | TypeMasterAI',
    description: 'Test your mobile typing speed on phone or tablet. Practice thumb typing, measure your WPM, and improve your smartphone keyboard skills.',
    keywords: 'mobile typing test, phone typing speed, typing test on phone, mobile typing speed, thumb typing test, smartphone typing test, tablet typing test',
    canonical: 'https://typemasterai.com/mobile-typing-test',
    ogUrl: 'https://typemasterai.com/mobile-typing-test',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'Mobile Typing Test',
          description: 'Typing speed test optimized for mobile phones and tablets',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'iOS, Android',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD'
          }
        },
        {
          '@type': 'FAQPage',
          mainEntity: PAGE_FAQS.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer
            }
          }))
        }
      ]
    }
  });

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pt-8 pb-16 max-w-4xl">
        <Breadcrumbs items={[
          { label: 'Typing Tests', href: '/' },
          { label: 'Mobile Typing Test', href: '/mobile-typing-test' }
        ]} />

        {/* Hero Section */}
        <header className="text-center pt-8 sm:pt-12 md:pt-16 pb-8 sm:pb-12 md:pb-16">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4 sm:mb-6 border border-primary/20">
            <Smartphone className="w-3 h-3 sm:w-4 sm:h-4 text-primary mr-2" />
            <span className="text-xs sm:text-sm text-muted-foreground">Mobile Optimized</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 px-2">
            <span className="text-primary">Mobile</span> Typing Test
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 sm:mb-6 px-2">
            Test and improve your phone typing speed. Fully optimized for touchscreen devices.
          </p>
          <AuthPrompt message="save your mobile typing results and track your thumb speed!" />
        </header>

        {/* AI Answer Box */}
        <section className="mb-8 sm:mb-12">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <h2 className="text-base sm:text-lg font-bold">Quick Answer</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                Average mobile typing speed is <strong>35-40 WPM</strong>, compared to 40-50 WPM on desktop.
                Good mobile typists reach <strong>50-60 WPM</strong>. To improve: use both thumbs,
                enable swipe typing, and practice regularly on your device.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Typing Test */}
        <section className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 px-2">
            <Keyboard className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Test Your Mobile Typing Speed
          </h2>
          <Card className="bg-card/50 p-3 sm:p-4">
            <TypingTest />
          </Card>
          <p className="text-xs sm:text-sm text-muted-foreground text-center mt-3 sm:mt-4 px-2">
            For best results, hold your device in portrait mode and use both thumbs
          </p>
        </section>

        {/* Mobile vs Desktop Comparison */}
        <section className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 px-2">Mobile vs Desktop Typing Speeds</h2>
          <Card className="bg-card/50">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="text-center p-3 sm:p-4 bg-background/50 rounded-lg">
                  <Smartphone className="w-10 h-10 sm:w-12 sm:h-12 text-primary mx-auto mb-2 sm:mb-3" />
                  <h3 className="font-bold text-base sm:text-lg mb-2">Mobile (Touchscreen)</h3>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <p>Average: <strong className="text-foreground">35-40 WPM</strong></p>
                    <p>Good: <strong className="text-foreground">50-60 WPM</strong></p>
                    <p>Expert: <strong className="text-foreground">70+ WPM</strong></p>
                  </div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-background/50 rounded-lg">
                  <Keyboard className="w-10 h-10 sm:w-12 sm:h-12 text-primary mx-auto mb-2 sm:mb-3" />
                  <h3 className="font-bold text-base sm:text-lg mb-2">Desktop (Physical)</h3>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <p>Average: <strong className="text-foreground">40-50 WPM</strong></p>
                    <p>Good: <strong className="text-foreground">60-80 WPM</strong></p>
                    <p>Expert: <strong className="text-foreground">100+ WPM</strong></p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Tips for Mobile Typing */}
        <section className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 px-2">Tips to Type Faster on Mobile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              { icon: "👍👍", title: "Use Both Thumbs", desc: "Divide the keyboard in half. Left thumb for left keys, right for right." },
              { icon: "〰️", title: "Try Swipe Typing", desc: "Glide your finger across letters. Faster for common words once learned." },
              { icon: "🔤", title: "Enable Predictions", desc: "Let your keyboard suggest words. Tap predictions instead of typing fully." },
              { icon: "📐", title: "Find Your Angle", desc: "Experiment with portrait vs landscape. Most type faster in portrait." },
              { icon: "🎯", title: "Learn Shortcuts", desc: "Double-space for period. Hold keys for symbols. Learn your keyboard." },
              { icon: "📱", title: "Practice Regularly", desc: "Just 5-10 minutes daily on mobile will significantly improve speed." },
            ].map((tip, index) => (
              <Card key={index} className="bg-card/50">
                <CardContent className="p-3 sm:p-4 flex gap-3 sm:gap-4">
                  <span className="text-xl sm:text-2xl flex-shrink-0">{tip.icon}</span>
                  <div className="min-w-0">
                    <h3 className="font-semibold mb-1 text-sm sm:text-base">{tip.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{tip.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Mobile Benchmarks */}
        <section className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 px-2">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Mobile Typing Speed Benchmarks
          </h2>
          <Card className="bg-card/50">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                {[
                  { range: "0-20 WPM", label: "Beginner", desc: "Still getting used to touchscreen" },
                  { range: "20-35 WPM", label: "Below Average", desc: "Hunt-and-peck typing" },
                  { range: "35-45 WPM", label: "Average", desc: "Typical smartphone user" },
                  { range: "45-60 WPM", label: "Above Average", desc: "Comfortable with mobile keyboard" },
                  { range: "60-70 WPM", label: "Fast", desc: "Skilled thumb typist" },
                  { range: "70+ WPM", label: "Expert", desc: "Top tier mobile typist" },
                ].map((tier, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-3 rounded-lg bg-background/50">
                    <div className="font-mono font-bold text-primary text-xs sm:text-sm w-full sm:w-24">{tier.range}</div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm sm:text-base">{tier.label}</span>
                      <span className="text-muted-foreground ml-2 text-xs sm:text-sm">— {tier.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ Section */}
        <section className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2 px-2">
            <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-2 sm:space-y-3">
            {PAGE_FAQS.map((faq, index) => (
              <div key={index} className="border border-border/50 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-card/30 transition-colors"
                  aria-expanded={openFaq === index}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span className="font-medium pr-2 sm:pr-4 text-sm sm:text-base">{faq.question}</span>
                  <ChevronDown className={cn(
                    "w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0 transition-transform",
                    openFaq === index && "rotate-180"
                  )} />
                </button>
                {openFaq === index && (
                  <div id={`faq-answer-${index}`} className="px-3 sm:px-4 pb-3 sm:pb-4 text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-6 sm:py-8 px-4 sm:px-6 bg-card/30 rounded-2xl border border-border/50 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Test on Desktop Too</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-lg mx-auto">
            Compare your mobile typing speed with your desktop speed. Most people are 20-40% faster on a physical keyboard.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
            <Link href="/">
              <Button size="lg" className="gap-2 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto">
                <Keyboard className="w-4 h-4 sm:w-5 sm:h-5" />
                Desktop Typing Test
              </Button>
            </Link>
            <Link href="/average-typing-speed">
              <Button size="lg" variant="outline" className="gap-2 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto">
                View Speed Benchmarks
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Related Topics */}
        <section className="mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 px-2">Related Topics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Link href="/wpm-test">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-3 sm:p-4">
                  <div className="font-semibold mb-1 text-sm sm:text-base">WPM Test</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Test your speed</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/how-to-type-faster">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-3 sm:p-4">
                  <div className="font-semibold mb-1 text-sm sm:text-base">How to Type Faster</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Speed improvement tips</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/typing-games">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-3 sm:p-4">
                  <div className="font-semibold mb-1 text-sm sm:text-base">Typing Games</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Practice with fun games</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        <AuthorBio />
      </div>
    </div>
  );
}

