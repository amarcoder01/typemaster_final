import { Link } from 'wouter';
import { Keyboard, Globe, Zap, BarChart2, ArrowRight, HelpCircle, ChevronDown, CheckCircle, X } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { AuthorBio } from '@/components/author-bio';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PAGE_FAQS = [
  {
    question: "Is QWERTY the best keyboard layout?",
    answer: "QWERTY is the most popular but not necessarily the 'best' for speed. It was designed in the 1870s to prevent typewriter jams. Dvorak and Colemak are ergonomically optimized but require relearning."
  },
  {
    question: "Can I switch from QWERTY to Dvorak?",
    answer: "Yes, but expect 2-4 weeks of reduced productivity while relearning. Most people regain their original speed in 1-2 months and may eventually surpass it. Your computer can switch layouts instantly in settings."
  },
  {
    question: "Which layout is fastest for typing?",
    answer: "All major layouts have produced 100+ WPM typists. Dvorak and Colemak reduce finger movement by 30-50%, which may help speed, but the world record (212 WPM) was set on QWERTY."
  },
  {
    question: "Is Colemak better than Dvorak?",
    answer: "Colemak is easier to learn from QWERTY (only 17 keys change) and keeps common shortcuts like Ctrl+C/V in place. Dvorak moves more keys but is better optimized for alternating hands."
  },
  {
    question: "Do programmers benefit from alternative layouts?",
    answer: "It depends. QWERTY keeps symbols in familiar places. Programmer Dvorak moves numbers to shift positions for easier symbol access. Most programmers stick with QWERTY due to switching costs."
  },
  {
    question: "How do I change my keyboard layout?",
    answer: "Windows: Settings > Time & Language > Language > Keyboard. Mac: System Preferences > Keyboard > Input Sources. You don't need a new keyboard—the layout is software-based."
  }
];

const LAYOUTS = [
  {
    name: "QWERTY",
    year: "1873",
    creator: "Christopher Latham Sholes",
    description: "The standard layout used worldwide. Originally designed to prevent typewriter key jams by separating common letter pairs.",
    topRow: "QWERTYUIOP",
    homeRow: "ASDFGHJKL;",
    bottomRow: "ZXCVBNM,./",
    pros: [
      "Universal standard—works everywhere",
      "No learning curve if you already know it",
      "All keyboards, phones, and devices use it",
      "Shortcuts (Ctrl+C, Ctrl+V) in convenient positions"
    ],
    cons: [
      "Not optimized for finger movement",
      "Common letters on weak fingers",
      "Designed for typewriters, not computers",
      "More finger travel than alternatives"
    ],
    color: "blue"
  },
  {
    name: "Dvorak",
    year: "1936",
    creator: "Dr. August Dvorak",
    description: "Designed for speed and efficiency. Places all vowels on the left home row and common consonants on the right.",
    topRow: "',.PYFGCRL",
    homeRow: "AOEUIDHTNS",
    bottomRow: ";QJKXBMWVZ",
    pros: [
      "70% of typing on home row (vs 32% QWERTY)",
      "Alternates hands more frequently",
      "Less finger movement overall",
      "Potentially higher top speeds"
    ],
    cons: [
      "Steep learning curve (2-4 weeks)",
      "Keyboard shortcuts in awkward positions",
      "Hard to use others' computers",
      "Not universally supported on all devices"
    ],
    color: "green"
  },
  {
    name: "Colemak",
    year: "2006",
    creator: "Shai Coleman",
    description: "A modern alternative that's easier to learn from QWERTY. Only changes 17 keys while achieving similar efficiency to Dvorak.",
    topRow: "QWFPGJLUY;",
    homeRow: "ARSTDHNEIO",
    bottomRow: "ZXCVBKM,./",
    pros: [
      "Easier transition from QWERTY (17 keys)",
      "Keeps Ctrl+Z/X/C/V in QWERTY positions",
      "Similar efficiency to Dvorak",
      "Good balance of ease and optimization"
    ],
    cons: [
      "Less common than QWERTY or Dvorak",
      "Still requires relearning",
      "May not be built into all operating systems",
      "Smaller community than Dvorak"
    ],
    color: "purple"
  }
];

export default function KeyboardLayoutsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useSEO({
    title: 'Keyboard Layouts Compared: QWERTY vs Dvorak vs Colemak | TypeMasterAI',
    description: 'Compare QWERTY, Dvorak, and Colemak keyboard layouts. Learn the pros, cons, and speed differences of each layout to choose the best one for you.',
    keywords: 'keyboard layouts, qwerty vs dvorak, colemak, dvorak keyboard, keyboard layout comparison, best keyboard layout, typing layout, alternative keyboard layouts',
    canonical: 'https://typemasterai.com/keyboard-layouts',
    ogUrl: 'https://typemasterai.com/keyboard-layouts',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          headline: 'Keyboard Layouts Compared: QWERTY vs Dvorak vs Colemak',
          description: 'Comprehensive comparison of the three most popular keyboard layouts.',
          image: 'https://typemasterai.com/opengraph.jpg',
          author: {
            '@type': 'Organization',
            name: 'TypeMasterAI'
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
          { label: 'Learn', href: '/learn' },
          { label: 'Keyboard Layouts', href: '/keyboard-layouts' }
        ]} />

        {/* Hero Section */}
        <header className="text-center pt-8 pb-12">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-6 border border-primary/20">
            <Keyboard className="w-4 h-4 text-primary mr-2" />
            <span className="text-sm text-muted-foreground">Keyboard Guide</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-primary">Keyboard Layouts</span> Compared
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            QWERTY, Dvorak, or Colemak? Understand the differences between keyboard layouts and find the best one for your typing goals.
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
                <strong>QWERTY</strong> is universal and has no learning curve. 
                <strong> Dvorak</strong> and <strong>Colemak</strong> reduce finger movement by 30-50% and may improve comfort, 
                but require 2-4 weeks to relearn. For most people, <strong>QWERTY is fine</strong>—focus on technique rather than layout.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Layout Comparison Tabs */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Compare Keyboard Layouts</h2>
          <Tabs defaultValue="qwerty">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="qwerty">QWERTY</TabsTrigger>
              <TabsTrigger value="dvorak">Dvorak</TabsTrigger>
              <TabsTrigger value="colemak">Colemak</TabsTrigger>
            </TabsList>

            {LAYOUTS.map((layout) => (
              <TabsContent key={layout.name.toLowerCase()} value={layout.name.toLowerCase()}>
                <Card className={`border-${layout.color}-500/30`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl">{layout.name}</CardTitle>
                      <span className="text-sm text-muted-foreground">Est. {layout.year}</span>
                    </div>
                    <p className="text-muted-foreground">{layout.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Visual Layout */}
                    <div className="bg-background/50 rounded-lg p-4 font-mono text-center">
                      <div className="text-lg tracking-[0.5em] mb-2 text-muted-foreground">{layout.topRow}</div>
                      <div className="text-lg tracking-[0.5em] mb-2 text-primary font-bold">{layout.homeRow}</div>
                      <div className="text-lg tracking-[0.5em] text-muted-foreground">{layout.bottomRow}</div>
                      <p className="text-xs text-muted-foreground mt-2">Home Row highlighted</p>
                    </div>

                    {/* Pros and Cons */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-4 h-4" />
                          Advantages
                        </h4>
                        <ul className="space-y-2">
                          {layout.pros.map((pro, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="w-3 h-3 text-green-400 mt-1 flex-shrink-0" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-400">
                          <X className="w-4 h-4" />
                          Disadvantages
                        </h4>
                        <ul className="space-y-2">
                          {layout.cons.map((con, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <X className="w-3 h-3 text-red-400 mt-1 flex-shrink-0" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </section>

        {/* Statistics Comparison */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-primary" />
            Layout Statistics
          </h2>
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2">Metric</th>
                      <th className="text-center py-3 px-2 text-blue-400">QWERTY</th>
                      <th className="text-center py-3 px-2 text-green-400">Dvorak</th>
                      <th className="text-center py-3 px-2 text-purple-400">Colemak</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-2 font-medium">Home Row Usage</td>
                      <td className="text-center py-3 px-2">32%</td>
                      <td className="text-center py-3 px-2">70%</td>
                      <td className="text-center py-3 px-2">74%</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-2 font-medium">Finger Travel (vs QWERTY)</td>
                      <td className="text-center py-3 px-2">100%</td>
                      <td className="text-center py-3 px-2">63%</td>
                      <td className="text-center py-3 px-2">65%</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-2 font-medium">Same-Hand Sequences</td>
                      <td className="text-center py-3 px-2">56%</td>
                      <td className="text-center py-3 px-2">32%</td>
                      <td className="text-center py-3 px-2">35%</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-2 font-medium">Learning Time</td>
                      <td className="text-center py-3 px-2">—</td>
                      <td className="text-center py-3 px-2">4-8 weeks</td>
                      <td className="text-center py-3 px-2">2-4 weeks</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-2 font-medium">Keys Changed from QWERTY</td>
                      <td className="text-center py-3 px-2">0</td>
                      <td className="text-center py-3 px-2">33</td>
                      <td className="text-center py-3 px-2">17</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Recommendation */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Which Layout Should You Use?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-3 text-blue-400">Stick with QWERTY if...</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• You're happy with your current speed</li>
                  <li>• You use shared computers frequently</li>
                  <li>• You don't want a productivity dip</li>
                  <li>• You type on mobile devices often</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-3 text-green-400">Try Dvorak if...</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• You want maximum optimization</li>
                  <li>• You have RSI or finger fatigue</li>
                  <li>• You can commit to 4-8 weeks learning</li>
                  <li>• You primarily use your own devices</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-purple-500/10 border-purple-500/30">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-3 text-purple-400">Try Colemak if...</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• You want an easier transition</li>
                  <li>• You need to keep shortcuts (Ctrl+Z/C/V)</li>
                  <li>• You want a balance of effort vs benefit</li>
                  <li>• You're curious but cautious</li>
                </ul>
              </CardContent>
            </Card>
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
          <h2 className="text-2xl font-bold mb-4">Test Your Current Layout</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Whatever layout you use, practice makes perfect. Take a typing test and see your WPM.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/">
              <Button size="lg" className="gap-2">
                <Keyboard className="w-5 h-5" />
                Take Typing Test
              </Button>
            </Link>
            <Link href="/touch-typing">
              <Button size="lg" variant="outline" className="gap-2">
                Learn Touch Typing
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
                  <p className="text-sm text-muted-foreground">Master proper technique</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/keyboard-test">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="font-semibold mb-1">Keyboard Tester</div>
                  <p className="text-sm text-muted-foreground">Test your keyboard keys</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/how-to-type-faster">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="font-semibold mb-1">How to Type Faster</div>
                  <p className="text-sm text-muted-foreground">Speed improvement tips</p>
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

