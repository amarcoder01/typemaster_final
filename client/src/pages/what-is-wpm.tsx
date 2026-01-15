import { Link } from 'wouter';
import { Gauge, Calculator, Clock, Target, Zap, ArrowRight, HelpCircle, ChevronDown } from 'lucide-react';
import { useSEO, SEO_CONFIGS, getBreadcrumbSchema, getFAQSchema } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { AuthorBio } from '@/components/author-bio';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const PAGE_FAQS = [
  {
    question: "What does WPM stand for?",
    answer: "WPM stands for Words Per Minute. It's the standard metric used to measure typing speed worldwide. One 'word' is standardized as 5 characters, including spaces and punctuation."
  },
  {
    question: "How is WPM calculated?",
    answer: "WPM is calculated using the formula: (Total Characters Typed ÷ 5) ÷ Time in Minutes. For example, if you type 250 characters in 1 minute, your WPM is 250 ÷ 5 = 50 WPM."
  },
  {
    question: "What is the difference between gross and net WPM?",
    answer: "Gross WPM counts all characters typed regardless of errors. Net WPM (also called Adjusted WPM) subtracts errors from the total, giving a more accurate measure of effective typing speed."
  },
  {
    question: "What is CPM and how does it relate to WPM?",
    answer: "CPM stands for Characters Per Minute. To convert CPM to WPM, divide by 5. For example, 300 CPM = 60 WPM. Some typing tests display both metrics."
  },
  {
    question: "Is 40 WPM a good typing speed?",
    answer: "40 WPM is the average typing speed for adults. It's sufficient for most everyday tasks, but professionals who type frequently should aim for 60-80 WPM for better productivity."
  },
  {
    question: "How can I improve my WPM?",
    answer: "Practice touch typing daily, focus on accuracy before speed, use proper finger placement on the home row, and take regular typing tests to track progress. Even 15 minutes daily can significantly improve your WPM."
  }
];

export default function WhatIsWpmPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useSEO({
    title: 'What is WPM? Words Per Minute Explained | TypeMasterAI',
    description: 'Learn what WPM (Words Per Minute) means, how it\'s calculated, and what constitutes a good typing speed. Understand the difference between gross WPM, net WPM, and CPM.',
    keywords: 'what is wpm, words per minute, wpm meaning, wpm definition, how to calculate wpm, typing speed, wpm vs cpm, gross wpm, net wpm',
    canonical: 'https://typemasterai.com/what-is-wpm',
    ogUrl: 'https://typemasterai.com/what-is-wpm',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          headline: 'What is WPM? Complete Guide to Words Per Minute',
          description: 'Comprehensive guide explaining WPM (Words Per Minute), how it\'s calculated, and what constitutes good typing speed.',
          image: 'https://typemasterai.com/opengraph.jpg',
          author: {
            '@type': 'Organization',
            name: 'TypeMasterAI'
          },
          publisher: {
            '@type': 'Organization',
            name: 'TypeMasterAI',
            logo: {
              '@type': 'ImageObject',
              url: 'https://typemasterai.com/icon-512x512.png'
            }
          },
          datePublished: '2024-01-01',
          dateModified: new Date().toISOString().split('T')[0]
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
          { label: 'What is WPM?', href: '/what-is-wpm' }
        ]} />

        {/* Hero Section */}
        <header className="text-center pt-8 pb-12">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-6 border border-primary/20">
            <Gauge className="w-4 h-4 text-primary mr-2" />
            <span className="text-sm text-muted-foreground">Typing Fundamentals</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            What is <span className="text-primary">WPM</span>?
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Words Per Minute (WPM) is the universal standard for measuring typing speed. Learn how it works and what your score means.
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
                <strong>WPM (Words Per Minute)</strong> measures how many words you can type in one minute. 
                The standard calculation uses 5 characters as one "word." Average typing speed is <strong>40 WPM</strong>, 
                while professional typists often reach <strong>80-100+ WPM</strong>.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Main Content */}
        <article className="prose prose-invert max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Calculator className="w-6 h-6 text-primary" />
              How is WPM Calculated?
            </h2>
            <p className="text-muted-foreground mb-6">
              The WPM formula is standardized across the industry to ensure consistent and comparable results:
            </p>
            
            <Card className="mb-6 bg-card/50">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-primary mb-2">
                    WPM = (Characters Typed ÷ 5) ÷ Minutes
                  </div>
                  <p className="text-sm text-muted-foreground">
                    5 characters = 1 standard word (including spaces)
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Example Calculation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>You type 300 characters in 60 seconds</li>
                    <li>300 ÷ 5 = 60 words</li>
                    <li>60 words ÷ 1 minute = <strong className="text-primary">60 WPM</strong></li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Why 5 Characters?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    The average English word is 4.5 characters. Using 5 (including a space after each word) creates a fair, standardized measure across all languages and text types.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              Gross WPM vs Net WPM
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-blue-500/20">
                <CardHeader>
                  <CardTitle className="text-blue-400">Gross WPM</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Measures raw typing speed without considering errors. Simply counts all keystrokes.
                  </p>
                  <div className="bg-blue-500/10 p-3 rounded-lg">
                    <code className="text-sm">Gross WPM = Total Characters ÷ 5 ÷ Minutes</code>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 border-green-500/20">
                <CardHeader>
                  <CardTitle className="text-green-400">Net WPM (Adjusted)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Subtracts errors from gross WPM. This is the more accurate measure of effective typing speed.
                  </p>
                  <div className="bg-green-500/10 p-3 rounded-lg">
                    <code className="text-sm">Net WPM = Gross WPM - (Errors ÷ Minutes)</code>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              WPM vs CPM: What's the Difference?
            </h2>
            
            <Card className="bg-card/50 mb-6">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-lg mb-2">WPM (Words Per Minute)</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Most common in English-speaking countries</li>
                      <li>• Easier to understand and compare</li>
                      <li>• Standard for job applications</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">CPM (Characters Per Minute)</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Common in Europe and Asia</li>
                      <li>• More precise measurement</li>
                      <li>• Better for non-English languages</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-primary/10 rounded-lg text-center">
                  <p className="font-mono text-lg">
                    <strong>Conversion:</strong> CPM ÷ 5 = WPM
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Example: 300 CPM = 60 WPM
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Typing Speed Benchmarks</h2>
            <Card className="bg-card/50">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[
                    { range: '0-30 WPM', label: 'Beginner', desc: 'Still learning keyboard layout', color: 'text-red-400' },
                    { range: '31-40 WPM', label: 'Average', desc: 'Typical untrained adult speed', color: 'text-yellow-400' },
                    { range: '41-60 WPM', label: 'Good', desc: 'Sufficient for most office jobs', color: 'text-green-400' },
                    { range: '61-80 WPM', label: 'Very Good', desc: 'Professional level typing', color: 'text-blue-400' },
                    { range: '81-100 WPM', label: 'Excellent', desc: 'Fast typist, data entry level', color: 'text-purple-400' },
                    { range: '100+ WPM', label: 'Expert', desc: 'Stenographer / Professional', color: 'text-cyan-400' },
                  ].map((tier) => (
                    <div key={tier.range} className="flex items-center gap-4 p-3 rounded-lg bg-background/50">
                      <div className={`font-mono font-bold w-24 ${tier.color}`}>{tier.range}</div>
                      <div className="flex-1">
                        <span className="font-semibold">{tier.label}</span>
                        <span className="text-muted-foreground ml-2">— {tier.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </article>

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
          <h2 className="text-2xl font-bold mb-4">Test Your WPM Now</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Find out your typing speed with our free online WPM test. Get instant results with detailed analytics.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/">
              <Button size="lg" className="gap-2">
                <Gauge className="w-5 h-5" />
                Take Free WPM Test
              </Button>
            </Link>
            <Link href="/average-typing-speed">
              <Button size="lg" variant="outline" className="gap-2">
                View Speed Benchmarks
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Related Topics */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Related Topics</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/average-typing-speed">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="font-semibold mb-1">Average Typing Speed</div>
                  <p className="text-sm text-muted-foreground">See how you compare to others</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/how-to-type-faster">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="font-semibold mb-1">How to Type Faster</div>
                  <p className="text-sm text-muted-foreground">Proven tips to increase WPM</p>
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
          </div>
        </section>

        <AuthorBio />
      </div>
    </div>
  );
}

