import { Link } from 'wouter';
import { Zap, Hand, Eye, Brain, Target, Clock, CheckCircle, ArrowRight, HelpCircle, ChevronDown, Keyboard } from 'lucide-react';
import { useSEO, SEO_CONFIGS, getBreadcrumbSchema, getFAQSchema } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { AuthorBio } from '@/components/author-bio';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const PAGE_FAQS = [
  {
    question: "How long does it take to double my typing speed?",
    answer: "With consistent daily practice of 15-30 minutes, most people can increase their WPM by 50-100% within 2-4 weeks. The key is focusing on accuracy first, then gradually increasing speed."
  },
  {
    question: "Should I look at the keyboard while typing?",
    answer: "No. Looking at the keyboard slows you down and prevents muscle memory development. Use the bumps on F and J keys to position your fingers without looking. Trust your muscle memory."
  },
  {
    question: "Is 60 WPM fast enough for a job?",
    answer: "60 WPM is above average and sufficient for most office jobs. Data entry positions may require 70-80 WPM, while transcriptionists often need 80-100+ WPM."
  },
  {
    question: "Does typing speed matter for programmers?",
    answer: "While coding speed isn't only about WPM, faster typing helps when writing documentation, emails, and comments. Most developers type 40-60 WPM but focus more on accuracy with special characters."
  },
  {
    question: "Can I practice typing too much?",
    answer: "Yes. Overtraining can lead to fatigue and repetitive strain injuries. Limit sessions to 30-45 minutes with breaks every 20 minutes. Quality practice beats quantity."
  },
  {
    question: "What's the fastest way to improve typing speed?",
    answer: "Focus on accuracy first (aim for 95%+), use proper finger placement, practice problem keys specifically, and take regular typing tests to track progress. Consistency beats intensity."
  }
];

const TIPS = [
  {
    icon: Hand,
    title: "Master the Home Row",
    description: "Keep your fingers on ASDF and JKL; at all times. This is the foundation of touch typing. Feel the bumps on F and J to orient without looking.",
    color: "text-blue-400"
  },
  {
    icon: Eye,
    title: "Never Look Down",
    description: "Train yourself to look only at the screen. Use a keyboard cover if needed. Looking at keys breaks your rhythm and prevents muscle memory.",
    color: "text-green-400"
  },
  {
    icon: Target,
    title: "Accuracy Before Speed",
    description: "Slow down and focus on hitting the right keys. Speed comes naturally once accuracy is consistent. Aim for 95%+ accuracy before pushing for higher WPM.",
    color: "text-yellow-400"
  },
  {
    icon: Brain,
    title: "Practice Problem Keys",
    description: "Use analytics to identify your slowest keys and most common errors. Create targeted practice sessions for these specific weaknesses.",
    color: "text-purple-400"
  },
  {
    icon: Clock,
    title: "Practice Daily (Short Sessions)",
    description: "15-20 minutes daily is more effective than 2 hours weekly. Consistency builds muscle memory faster than marathon sessions.",
    color: "text-cyan-400"
  },
  {
    icon: Zap,
    title: "Maintain a Steady Rhythm",
    description: "Type at a consistent pace rather than in bursts. Think of typing like music—maintain tempo. This reduces errors and fatigue.",
    color: "text-orange-400"
  }
];

export default function HowToTypeFasterPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useSEO({
    title: 'How to Type Faster: 10 Proven Tips to Increase WPM | TypeMasterAI',
    description: 'Learn how to type faster with these proven techniques. From touch typing basics to advanced speed tips, increase your WPM from 40 to 80+ with daily practice.',
    keywords: 'how to type faster, increase typing speed, typing tips, improve wpm, type faster, fast typing, typing techniques, speed typing tips',
    canonical: 'https://typemasterai.com/how-to-type-faster',
    ogUrl: 'https://typemasterai.com/how-to-type-faster',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'HowTo',
          name: 'How to Type Faster',
          description: 'Step-by-step guide to increasing your typing speed from beginner to professional level.',
          totalTime: 'P4W',
          estimatedCost: {
            '@type': 'MonetaryAmount',
            currency: 'USD',
            value: '0'
          },
          step: [
            { '@type': 'HowToStep', position: 1, name: 'Learn Home Row Position', text: 'Place fingers on ASDF JKL; and memorize this position.' },
            { '@type': 'HowToStep', position: 2, name: 'Stop Looking at Keyboard', text: 'Train yourself to keep eyes on screen only.' },
            { '@type': 'HowToStep', position: 3, name: 'Focus on Accuracy', text: 'Aim for 95%+ accuracy before increasing speed.' },
            { '@type': 'HowToStep', position: 4, name: 'Practice Daily', text: 'Complete 15-20 minute practice sessions consistently.' },
            { '@type': 'HowToStep', position: 5, name: 'Track Progress', text: 'Use analytics to identify weak keys and measure improvement.' }
          ]
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
          { label: 'How to Type Faster', href: '/how-to-type-faster' }
        ]} />

        {/* Hero Section */}
        <header className="text-center pt-8 pb-12">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-6 border border-primary/20">
            <Zap className="w-4 h-4 text-primary mr-2" />
            <span className="text-sm text-muted-foreground">Speed Improvement</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            How to <span className="text-primary">Type Faster</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Proven techniques to increase your typing speed from 40 WPM to 80+ WPM. Master these fundamentals and watch your productivity soar.
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
                To type faster: <strong>1)</strong> Learn proper home row finger placement, 
                <strong> 2)</strong> Never look at the keyboard, 
                <strong> 3)</strong> Focus on accuracy before speed, 
                <strong> 4)</strong> Practice 15-20 minutes daily. 
                Most people can double their WPM in 2-4 weeks with consistent practice.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Main Tips */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">6 Essential Tips to Type Faster</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {TIPS.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <Card key={index} className="bg-card/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-background ${tip.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span>{tip.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {tip.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Step by Step Guide */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Step-by-Step Improvement Plan</h2>
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="space-y-6">
                {[
                  {
                    week: "Week 1-2",
                    title: "Foundation",
                    tasks: [
                      "Memorize home row position (ASDF JKL;)",
                      "Take baseline typing test to measure starting WPM",
                      "Practice 15 minutes daily focusing on accuracy",
                      "Never look at the keyboard during practice"
                    ]
                  },
                  {
                    week: "Week 3-4",
                    title: "Building Speed",
                    tasks: [
                      "Increase practice to 20-25 minutes daily",
                      "Review analytics to identify problem keys",
                      "Practice specific difficult key combinations",
                      "Aim for 95%+ accuracy consistently"
                    ]
                  },
                  {
                    week: "Week 5-8",
                    title: "Advanced Training",
                    tasks: [
                      "Add variety with code typing or dictation modes",
                      "Compete in multiplayer races for pressure training",
                      "Focus on rhythm and consistency over bursts",
                      "Take weekly tests to measure progress"
                    ]
                  }
                ].map((phase, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-primary font-mono text-sm">{phase.week}</span>
                        <span className="font-bold text-lg">{phase.title}</span>
                      </div>
                      <ul className="space-y-2">
                        {phase.tasks.map((task, i) => (
                          <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Common Mistakes */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Common Mistakes to Avoid</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { mistake: "Looking at the keyboard", fix: "Trust your muscle memory and keep eyes on screen" },
              { mistake: "Practicing for hours at once", fix: "Short, consistent sessions are more effective" },
              { mistake: "Prioritizing speed over accuracy", fix: "Accuracy builds the foundation for speed" },
              { mistake: "Using only 2-4 fingers", fix: "Learn to use all 10 fingers properly" },
              { mistake: "Ignoring posture and ergonomics", fix: "Sit properly to prevent fatigue and injury" },
              { mistake: "Not tracking progress", fix: "Use analytics to measure improvement" }
            ].map((item, index) => (
              <Card key={index} className="bg-card/50">
                <CardContent className="p-4">
                  <div className="text-red-400 font-medium mb-1">❌ {item.mistake}</div>
                  <div className="text-green-400 text-sm">✓ {item.fix}</div>
                </CardContent>
              </Card>
            ))}
          </div>
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
          <h2 className="text-2xl font-bold mb-4">Start Practicing Now</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Put these tips into action with our free typing test. Track your progress and see your WPM increase.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/">
              <Button size="lg" className="gap-2">
                <Keyboard className="w-5 h-5" />
                Start Typing Test
              </Button>
            </Link>
            <Link href="/analytics">
              <Button size="lg" variant="outline" className="gap-2">
                View Analytics
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Related Topics */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Related Topics</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/what-is-wpm">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="font-semibold mb-1">What is WPM?</div>
                  <p className="text-sm text-muted-foreground">Understand the WPM metric</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/touch-typing">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="font-semibold mb-1">Touch Typing Guide</div>
                  <p className="text-sm text-muted-foreground">Master proper technique</p>
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

