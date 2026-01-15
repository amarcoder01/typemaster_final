import { Link } from 'wouter';
import { BookOpen, Hand, Target, Zap, ArrowRight, HelpCircle, ChevronDown, Keyboard, CheckCircle, Star } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { AuthorBio } from '@/components/author-bio';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const PAGE_FAQS = [
  {
    question: "How long does it take to learn to type?",
    answer: "Most beginners can learn the basics in 1-2 weeks with daily practice. Reaching 40 WPM typically takes 4-6 weeks, and 60+ WPM takes 2-3 months of consistent practice."
  },
  {
    question: "Should I take a typing course or just practice?",
    answer: "Both work, but structured practice is best. Free resources like TypeMasterAI combine lessons with practice. The key is focusing on proper technique from the start to avoid bad habits."
  },
  {
    question: "What is the home row and why is it important?",
    answer: "The home row is ASDF JKL; where your fingers rest. It's the foundation of touch typing—all other keys are reached from this position. F and J have bumps so you can find them without looking."
  },
  {
    question: "Can I learn to type at any age?",
    answer: "Yes! While children often learn faster, adults of any age can learn touch typing. The key is patience and consistent practice. Many people learn in their 40s, 50s, or beyond."
  },
  {
    question: "How many hours a day should I practice?",
    answer: "15-30 minutes daily is ideal for beginners. Short, consistent sessions build muscle memory better than long, occasional ones. Avoid practicing when tired to prevent developing bad habits."
  },
  {
    question: "Is it okay to look at the keyboard while learning?",
    answer: "Initially, yes—but transition away quickly. Use the first few days to memorize key positions, then practice without looking. Covering the keyboard can help break the habit."
  }
];

const LEARNING_STEPS = [
  {
    step: 1,
    title: "Learn the Home Row",
    description: "Place your left fingers on A, S, D, F and right fingers on J, K, L, ;. Your thumbs rest on the spacebar. Feel the bumps on F and J—these help you position without looking.",
    tips: ["Keep wrists slightly elevated", "Fingers should be curved, not flat", "Return to home row after every keystroke"]
  },
  {
    step: 2,
    title: "Memorize Key Positions",
    description: "Each finger is responsible for specific keys. Learn which finger types which letter. For example, your left index finger types F, R, V, G, T, and B.",
    tips: ["Practice one row at a time", "Start with home row letters", "Use typing games to make it fun"]
  },
  {
    step: 3,
    title: "Practice Without Looking",
    description: "This is the hardest but most important step. Trust your muscle memory. Cover your keyboard if needed. Slow down—accuracy matters more than speed.",
    tips: ["Accept that you'll be slower at first", "Focus on correct finger movement", "Resist the urge to peek"]
  },
  {
    step: 4,
    title: "Build Speed Gradually",
    description: "Once you can type without looking at 90%+ accuracy, start pushing speed. Use timed tests to measure progress. Aim to add 5-10 WPM per week.",
    tips: ["Maintain 95%+ accuracy always", "Take regular typing tests", "Practice problem keys specifically"]
  }
];

export default function TypingForBeginnersPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useSEO({
    title: 'Typing for Beginners: Learn to Type from Scratch | TypeMasterAI',
    description: 'Complete beginner\'s guide to typing. Learn touch typing from scratch with step-by-step instructions, home row basics, and free practice exercises.',
    keywords: 'typing for beginners, learn to type, beginner typing, how to type, typing lessons for beginners, learn keyboard typing, start typing, typing basics',
    canonical: 'https://typemasterai.com/typing-for-beginners',
    ogUrl: 'https://typemasterai.com/typing-for-beginners',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Course',
          name: 'Typing for Beginners',
          description: 'Free beginner typing course teaching touch typing fundamentals',
          provider: {
            '@type': 'Organization',
            name: 'TypeMasterAI'
          },
          isAccessibleForFree: true,
          educationalLevel: 'Beginner',
          coursePrerequisites: 'None'
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
          { label: 'Learn', href: '/learn' },
          { label: 'Typing for Beginners', href: '/typing-for-beginners' }
        ]} />

        {/* Hero Section */}
        <header className="text-center pt-8 pb-12">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-6 border border-primary/20">
            <BookOpen className="w-4 h-4 text-primary mr-2" />
            <span className="text-sm text-muted-foreground">Beginner's Guide</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-primary">Typing</span> for Beginners
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Never typed before? No problem. This complete beginner's guide will teach you touch typing from scratch—no prior experience needed.
          </p>
        </header>

        {/* AI Answer Box */}
        <section className="mb-12">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">Quick Answer</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                To learn typing: <strong>1)</strong> Place fingers on the home row (ASDF JKL;), 
                <strong> 2)</strong> Memorize which finger types which keys, 
                <strong> 3)</strong> Practice without looking at the keyboard, 
                <strong> 4)</strong> Focus on accuracy before speed. 
                With 15-30 minutes daily practice, you can reach <strong>40 WPM in 4-6 weeks</strong>.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* What You'll Learn */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">What You'll Learn</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-card/50">
              <CardContent className="p-6 text-center">
                <Hand className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">Proper Technique</h3>
                <p className="text-sm text-muted-foreground">Correct finger placement and posture for efficient typing</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-6 text-center">
                <Keyboard className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">Touch Typing</h3>
                <p className="text-sm text-muted-foreground">Type without looking at the keyboard</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-6 text-center">
                <Target className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">Speed & Accuracy</h3>
                <p className="text-sm text-muted-foreground">Build up to 40-60+ WPM with practice</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Step by Step Guide */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">4 Steps to Learn Typing</h2>
          <div className="space-y-6">
            {LEARNING_STEPS.map((step) => (
              <Card key={step.step} className="bg-card/50">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xl">
                        {step.step}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground mb-4">{step.description}</p>
                      <div className="bg-background/50 rounded-lg p-4">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-400" />
                          Tips
                        </h4>
                        <ul className="space-y-1">
                          {step.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="w-3 h-3 text-green-400 mt-1 flex-shrink-0" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Home Row Visualization */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Hand className="w-6 h-6 text-primary" />
            The Home Row Position
          </h2>
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="font-mono text-2xl tracking-[0.5em] mb-2 text-muted-foreground">Q W E R T Y U I O P</div>
                <div className="font-mono text-2xl tracking-[0.5em] mb-2 text-primary font-bold">A S D F   J K L ;</div>
                <div className="font-mono text-2xl tracking-[0.5em] text-muted-foreground">Z X C V B N M , . /</div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Left Hand</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Pinky → A</li>
                    <li>• Ring finger → S</li>
                    <li>• Middle finger → D</li>
                    <li>• Index finger → F (with bump)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Right Hand</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Index finger → J (with bump)</li>
                    <li>• Middle finger → K</li>
                    <li>• Ring finger → L</li>
                    <li>• Pinky → ;</li>
                  </ul>
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Both thumbs rest on the spacebar
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Practice Schedule */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Recommended Practice Schedule</h2>
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="space-y-4">
                {[
                  { week: "Week 1", focus: "Home row only (ASDF JKL;)", duration: "15 min/day", goal: "Memorize positions" },
                  { week: "Week 2", focus: "Add top row (QWERTY)", duration: "20 min/day", goal: "Type without looking" },
                  { week: "Week 3", focus: "Add bottom row (ZXCV)", duration: "20 min/day", goal: "Complete alphabet" },
                  { week: "Week 4", focus: "Full words and sentences", duration: "25 min/day", goal: "Reach 20-30 WPM" },
                  { week: "Week 5-8", focus: "Speed and accuracy drills", duration: "30 min/day", goal: "Reach 40+ WPM" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-background/50">
                    <div className="font-mono font-bold text-primary w-20">{item.week}</div>
                    <div className="flex-1">
                      <span className="font-semibold">{item.focus}</span>
                      <span className="text-muted-foreground"> • {item.duration}</span>
                    </div>
                    <div className="text-sm text-green-400 hidden sm:block">{item.goal}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-primary" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {PAGE_FAQS.map((faq, index) => (
              <div key={index} className="border border-border/50 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-card/30 transition-colors"
                >
                  <span className="font-medium pr-4">{faq.question}</span>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-muted-foreground shrink-0 transition-transform",
                    openFaq === index && "rotate-180"
                  )} />
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-4 text-muted-foreground text-sm leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8 px-6 bg-card/30 rounded-2xl border border-border/50 mb-8">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Begin your typing journey with our free, beginner-friendly typing test. No signup required.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/">
              <Button size="lg" className="gap-2">
                <Keyboard className="w-5 h-5" />
                Start Typing Test
              </Button>
            </Link>
            <Link href="/learn">
              <Button size="lg" variant="outline" className="gap-2">
                View Full Course
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Related Topics */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Related Topics</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/touch-typing">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="font-semibold mb-1">Touch Typing Guide</div>
                  <p className="text-sm text-muted-foreground">Deep dive into technique</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/what-is-wpm">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="font-semibold mb-1">What is WPM?</div>
                  <p className="text-sm text-muted-foreground">Understand the speed metric</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/typing-practice">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="font-semibold mb-1">Typing Practice</div>
                  <p className="text-sm text-muted-foreground">Free practice exercises</p>
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

