import { Link } from 'wouter';
import { Code, Zap, ArrowRight, HelpCircle, ChevronDown, FileCode } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { AuthorBio } from '@/components/author-bio';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const PAGE_FAQS = [
  {
    question: "What is a Python typing test?",
    answer: "A Python typing test measures your ability to type Python code quickly and accurately. It includes syntax like indentation, colons, def/class keywords, and list comprehensions."
  },
  {
    question: "What's a good WPM for Python coding?",
    answer: "Python developers typically type 35-55 WPM when coding. Python is often faster to type than other languages due to cleaner syntax, but indentation and special characters still slow things down."
  },
  {
    question: "Why is Python easier to type than other languages?",
    answer: "Python has minimal brackets (no {} for blocks), no semicolons, and readable keywords. However, proper indentation is critical, so accuracy matters more than in some other languages."
  },
  {
    question: "What Python syntax should I practice?",
    answer: "Practice function definitions (def), class structures, list comprehensions, f-strings, decorators (@), and common patterns like for/in loops and with statements."
  },
  {
    question: "How do I handle Python indentation in typing tests?",
    answer: "TypeMasterAI's code mode uses spaces for indentation. Press Tab or 4 spaces consistently. Practice maintaining proper indentation levels as you type nested code."
  }
];

export default function PythonTypingTestPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useSEO({
    title: 'Python Typing Test: Practice Coding Speed | TypeMasterAI',
    description: 'Practice typing Python code with syntax highlighting. Improve your coding speed with functions, classes, list comprehensions, and Pythonic syntax.',
    keywords: 'python typing test, python coding practice, code typing test, programming typing test, python coding speed, developer typing test, python typing speed',
    canonical: 'https://typemasterai.com/python-typing-test',
    ogUrl: 'https://typemasterai.com/python-typing-test',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'Python Typing Test',
          description: 'Practice typing Python code with syntax highlighting and WPM tracking',
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
          { label: 'Python Test', href: '/python-typing-test' }
        ]} />

        {/* Hero Section */}
        <header className="text-center pt-8 pb-12">
          <div className="inline-flex items-center justify-center p-2 bg-blue-500/10 rounded-full mb-6 border border-blue-500/20">
            <FileCode className="w-4 h-4 text-blue-500 mr-2" />
            <span className="text-sm text-muted-foreground">Code Typing</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-blue-500">Python</span> Typing Test
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Practice typing Pythonic code. Master functions, classes, list comprehensions, and clean Python syntax.
          </p>
        </header>

        {/* AI Answer Box */}
        <section className="mb-12">
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold">Quick Answer</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Python developers typically code at <strong>35-55 WPM</strong>. Python's clean syntax 
                (<code className="mx-1 px-1 bg-blue-500/10 rounded">def</code>, 
                <code className="mx-1 px-1 bg-blue-500/10 rounded">class</code>, 
                <code className="mx-1 px-1 bg-blue-500/10 rounded">:</code>) 
                makes it faster to type than curly-brace languages, but proper indentation is critical.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* CTA to Code Mode */}
        <section className="mb-12">
          <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30">
            <CardContent className="p-8 text-center">
              <Code className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Start Python Typing Test</h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Jump into Code Mode and select Python from the language picker. Practice with real code snippets including functions, classes, and data structures.
              </p>
              <Link href="/code-mode">
                <Button size="lg" className="gap-2 bg-blue-500 hover:bg-blue-600">
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
              { syntax: 'def function():', name: 'Function Definitions', desc: 'Basic Python functions' },
              { syntax: 'class MyClass:', name: 'Class Structures', desc: 'Object-oriented Python' },
              { syntax: '[x for x in list]', name: 'List Comprehensions', desc: 'Pythonic data processing' },
              { syntax: 'f"{variable}"', name: 'F-Strings', desc: 'Modern string formatting' },
              { syntax: '@decorator', name: 'Decorators', desc: 'Function modification' },
              { syntax: 'with open() as f:', name: 'Context Managers', desc: 'Resource handling' },
            ].map((item, index) => (
              <Card key={index} className="bg-card/50">
                <CardContent className="p-4">
                  <code className="text-blue-500 font-mono text-sm block mb-2">{item.syntax}</code>
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
            <Link href="/javascript-typing-test">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="font-semibold mb-1">JavaScript Typing Test</div>
                  <p className="text-sm text-muted-foreground">Practice JS syntax</p>
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

