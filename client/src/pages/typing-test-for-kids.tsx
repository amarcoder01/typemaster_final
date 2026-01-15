import { Link } from 'wouter';
import { Gamepad2, Star, Trophy, Zap, ArrowRight, HelpCircle, ChevronDown, Keyboard, Sparkles } from 'lucide-react';
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
    question: "What age should kids start learning to type?",
    answer: "Children can start learning typing basics at age 6-7 when their hands are large enough to reach the keys. Serious touch typing instruction is most effective starting around ages 8-10."
  },
  {
    question: "How fast should a child be able to type?",
    answer: "Average typing speeds by age: 8-10 years: 15-25 WPM, 11-13 years: 25-40 WPM, 14-16 years: 40-55 WPM. These are averages—many kids exceed these with practice."
  },
  {
    question: "How long should kids practice typing each day?",
    answer: "10-15 minutes daily is ideal for children. Short, regular practice builds skills better than long, infrequent sessions. Make it fun by incorporating typing games."
  },
  {
    question: "Is typing important for kids today?",
    answer: "Yes! Typing is essential for school assignments, standardized tests, and future careers. Kids who type well can focus on content rather than struggling with the keyboard."
  },
  {
    question: "How can I make typing practice fun for kids?",
    answer: "Use typing games and competitions, set achievable goals with rewards, track progress with badges, and let kids type stories or chat with family. Make it feel like play, not work."
  },
  {
    question: "Should kids use a regular keyboard or a kid-sized one?",
    answer: "Regular keyboards work fine for most kids age 8+. Ensure proper posture with an adjustable chair. Some younger children (6-7) may benefit from smaller keyboards initially."
  }
];

const AGE_BENCHMARKS = [
  { age: "6-7 years", wpm: "5-10 WPM", focus: "Letter recognition, finding keys" },
  { age: "8-9 years", wpm: "10-20 WPM", focus: "Home row basics, simple words" },
  { age: "10-11 years", wpm: "20-30 WPM", focus: "Touch typing fundamentals" },
  { age: "12-13 years", wpm: "30-45 WPM", focus: "Speed building, accuracy" },
  { age: "14-16 years", wpm: "40-60 WPM", focus: "Advanced practice, fluency" },
];

export default function TypingTestForKidsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useSEO({
    title: 'Typing Test for Kids: Fun & Free Typing Practice | TypeMasterAI',
    description: 'Free typing test designed for kids and students. Age-appropriate practice, fun achievements, and progress tracking. Perfect for learning touch typing at school or home.',
    keywords: 'typing test for kids, kids typing practice, typing for children, child typing test, student typing test, typing games for kids, learn typing kids, typing tutor for kids',
    canonical: 'https://typemasterai.com/typing-test-for-kids',
    ogUrl: 'https://typemasterai.com/typing-test-for-kids',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'Typing Test for Kids',
          description: 'Kid-friendly typing test with achievements and progress tracking',
          applicationCategory: 'EducationalApplication',
          audience: {
            '@type': 'EducationalAudience',
            educationalRole: 'student',
            suggestedMinAge: '6',
            suggestedMaxAge: '16'
          },
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
          { label: 'Learn', href: '/learn' },
          { label: 'Typing for Kids', href: '/typing-test-for-kids' }
        ]} />

        {/* Hero Section */}
        <header className="text-center pt-8 pb-12">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-6 border border-primary/20">
            <Gamepad2 className="w-4 h-4 text-primary mr-2" />
            <span className="text-sm text-muted-foreground">For Kids & Students</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Typing Test for <span className="text-primary">Kids</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Learn to type with fun! Practice typing, earn achievements, and become a keyboard pro.
          </p>
          <AuthPrompt message="save your scores and trophies to see your progress!" />
        </header>

        {/* Fun Facts Box */}
        <section className="mb-12">
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">Did You Know?</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Learning to type is like learning a superpower! Fast typists can write their homework
                <strong> 2-3 times faster</strong> than slow typists. With just <strong>15 minutes of practice daily</strong>,
                you can become a typing champion in a few weeks!
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Typing Test */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Keyboard className="w-6 h-6 text-primary" />
            Start Typing!
          </h2>
          <Card className="bg-card/50 p-4">
            <TypingTest />
          </Card>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <div className="text-center p-3 bg-card/30 rounded-lg">
              <Star className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
              <span className="text-xs text-muted-foreground">Earn Stars</span>
            </div>
            <div className="text-center p-3 bg-card/30 rounded-lg">
              <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
              <span className="text-xs text-muted-foreground">Get Trophies</span>
            </div>
            <div className="text-center p-3 bg-card/30 rounded-lg">
              <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
              <span className="text-xs text-muted-foreground">Beat Records</span>
            </div>
          </div>
        </section>

        {/* Age Benchmarks */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Typing Speed by Age</h2>
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="space-y-3">
                {AGE_BENCHMARKS.map((benchmark, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-background/50">
                    <div className="font-mono font-bold text-primary w-24">{benchmark.age}</div>
                    <div className="flex-1">
                      <span className="font-semibold">{benchmark.wpm}</span>
                      <span className="text-muted-foreground text-sm ml-2">— {benchmark.focus}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                These are average speeds. With practice, you can go even faster!
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Tips for Kids */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Tips for Young Typists</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { emoji: "🎯", title: "Start Slow", desc: "It's okay to be slow at first. Accuracy is more important than speed!" },
              { emoji: "👀", title: "Look at the Screen", desc: "Try not to look at your fingers. Trust your hands!" },
              { emoji: "🏠", title: "Home Row Position", desc: "Keep your fingers on ASDF and JKL; — that's your home base!" },
              { emoji: "⏰", title: "Practice Daily", desc: "Just 10-15 minutes every day is better than hours once a week." },
              { emoji: "🎮", title: "Make it Fun", desc: "Try typing games and compete with friends or siblings!" },
              { emoji: "🏆", title: "Track Your Progress", desc: "Celebrate when you beat your own record!" },
            ].map((tip, index) => (
              <Card key={index} className="bg-card/50">
                <CardContent className="p-4 flex gap-4">
                  <span className="text-3xl">{tip.emoji}</span>
                  <div>
                    <h3 className="font-semibold mb-1">{tip.title}</h3>
                    <p className="text-sm text-muted-foreground">{tip.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* For Parents Box */}
        <section className="mb-12">
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">For Parents & Teachers</h3>
              <div className="text-muted-foreground space-y-3">
                <p>
                  TypeMasterAI is safe and ad-free, making it perfect for classroom or home use.
                  Create an account to track your child's progress over time.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    No ads or distracting content
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    Progress tracking and analytics
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    Achievement badges for motivation
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400">✓</span>
                    Works on tablets and computers
                  </li>
                </ul>
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
        <section className="text-center py-8 px-6 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-2xl border border-primary/30 mb-8">
          <h2 className="text-2xl font-bold mb-4">Ready to Become a Typing Champion?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Start practicing today and watch your typing speed improve!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/typing-games">
              <Button size="lg" className="gap-2">
                <Gamepad2 className="w-5 h-5" />
                Play Typing Games
              </Button>
            </Link>
            <Link href="/typing-for-beginners">
              <Button size="lg" variant="outline" className="gap-2">
                Learn the Basics
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Related Topics */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Related Topics</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/typing-games">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="font-semibold mb-1">Typing Games</div>
                  <p className="text-sm text-muted-foreground">Fun games to practice</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/typing-for-beginners">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="font-semibold mb-1">Beginner's Guide</div>
                  <p className="text-sm text-muted-foreground">Step-by-step lessons</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/leaderboard">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="font-semibold mb-1">Leaderboard</div>
                  <p className="text-sm text-muted-foreground">Compete for top spot</p>
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

