import { Link } from 'wouter';
import { Code, Zap, ArrowRight, HelpCircle, ChevronDown, Keyboard, FileCode } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { AuthorBio } from '@/components/author-bio';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const PAGE_FAQS = [
  {
    question: "What is a JavaScript typing test?",
    answer: "A JavaScript typing test measures your ability to type JavaScript code quickly and accurately. It includes common syntax like functions, arrows, brackets, and semicolons that programmers use daily."
  },
  {
    question: "What's a good WPM for JavaScript coding?",
    answer: "Most JavaScript developers type 40-60 WPM when coding. Unlike prose, code typing is slower due to special characters. 50+ WPM with high accuracy is considered good for JavaScript."
  },
  {
    question: "Why practice typing JavaScript specifically?",
    answer: "JavaScript uses unique syntax (arrow functions, template literals, destructuring) that requires practice. Muscle memory for => {} [] makes you faster at writing real code."
  },
  {
    question: "Does fast typing make you a better programmer?",
    answer: "Fast typing removes a bottleneck but doesn't replace coding knowledge. It helps when writing documentation, refactoring, and pair programming. Focus on accuracy with special characters."
  },
  {
    question: "What JavaScript syntax should I practice?",
    answer: "Practice arrow functions (=>), template literals (``), destructuring ({a, b}), array methods (.map, .filter), async/await, and common patterns like ternary operators."
  }
];

export default function JavaScriptTypingTestPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useSEO({
    title: 'JavaScript Typing Test: Practice Coding Speed | TypeMasterAI',
    description: 'Practice typing JavaScript code with syntax highlighting. Improve your coding speed with arrow functions, async/await, and modern JS syntax exercises.',
    keywords: 'javascript typing test, js typing practice, code typing test, programming typing test, javascript coding speed, developer typing test, js typing speed',
    canonical: 'https://typemasterai.com/javascript-typing-test',
    ogUrl: 'https://typemasterai.com/javascript-typing-test',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'JavaScript Typing Test',
          description: 'Practice typing JavaScript code with syntax highlighting and WPM tracking',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Web Browser',
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
          { label: 'Code Mode', href: '/code-mode' },
          { label: 'JavaScript Test', href: '/javascript-typing-test' }
        ]} />

        {/* Hero Section */}
        <header className="text-center pt-8 pb-12">
          <div className="inline-flex items-center justify-center p-2 bg-yellow-500/10 rounded-full mb-6 border border-yellow-500/20">
            <FileCode className="w-4 h-4 text-yellow-500 mr-2" />
            <span className="text-sm text-muted-foreground">Code Typing</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-yellow-500">JavaScript</span> Typing Test
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Practice typing modern JavaScript code. Master arrow functions, async/await, and ES6+ syntax with syntax highlighting.
          </p>
        </header>

        {/* AI Answer Box */}
        <section className="mb-12">
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-bold">Quick Answer</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                JavaScript developers typically code at <strong>40-60 WPM</strong> due to special characters like 
                <code className="mx-1 px-1 bg-yellow-500/10 rounded">{'=>'}</code>, 
                <code className="mx-1 px-1 bg-yellow-500/10 rounded">{'{}'}</code>, and 
                <code className="mx-1 px-1 bg-yellow-500/10 rounded">[]</code>. 
                Practice these patterns to speed up your daily coding.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* CTA to Code Mode */}
        <section className="mb-12">
          <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
            <CardContent className="p-8 text-center">
              <Code className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Start JavaScript Typing Test</h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Jump into Code Mode and select JavaScript from the language picker. Practice with real code snippets including functions, classes, and async patterns.
              </p>
              <Link href="/code-mode">
                <Button size="lg" className="gap-2 bg-yellow-500 hover:bg-yellow-600">
                  <Code className="w-5 h-5" />
                  Open Code Mode
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* What You'll Practice */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">What You'll Practice</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { syntax: 'const fn = () => {}', name: 'Arrow Functions', desc: 'Modern function syntax' },
              { syntax: 'async/await', name: 'Async Patterns', desc: 'Promises and async code' },
              { syntax: '{ a, b } = obj', name: 'Destructuring', desc: 'Object and array patterns' },
              { syntax: '`${var}`', name: 'Template Literals', desc: 'String interpolation' },
              { syntax: '.map() .filter()', name: 'Array Methods', desc: 'Functional programming' },
              { syntax: 'class X extends Y', name: 'Classes', desc: 'OOP in JavaScript' },
            ].map((item, index) => (
              <Card key={index} className="bg-card/50">
                <CardContent className="p-4">
                  <code className="text-yellow-500 font-mono text-sm block mb-2">{item.syntax}</code>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-muted-foreground">{item.desc}</div>
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

        {/* Related Topics */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Related Topics</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/code-mode">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="font-semibold mb-1">Code Mode</div>
                  <p className="text-sm text-muted-foreground">20+ programming languages</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/python-typing-test">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="font-semibold mb-1">Python Typing Test</div>
                  <p className="text-sm text-muted-foreground">Practice Python syntax</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/code-leaderboard">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="font-semibold mb-1">Code Leaderboard</div>
                  <p className="text-sm text-muted-foreground">Top developer typists</p>
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

