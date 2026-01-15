import { Link } from 'wouter';
import { Keyboard, Target, TrendingUp, Zap, Clock, Award, ArrowRight, CheckCircle, Brain, BarChart3 } from 'lucide-react';
import { useSEO, SEO_CONFIGS, getSoftwareAppSchema } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { AuthPrompt } from "@/components/auth-prompt";

export default function TypingPracticePage() {
  useSEO({
    ...SEO_CONFIGS.typingPractice,
    structuredData: getSoftwareAppSchema(
      'TypeMasterAI Typing Practice',
      'Free online typing practice with AI-powered exercises to improve your speed and accuracy',
      ['Unlimited practice sessions', 'AI-generated content', 'Real-time feedback', 'Progress tracking', '23+ languages']
    ),
  });

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pt-20 pb-16">
        <Breadcrumbs items={[{ label: 'Typing Practice', href: '/typing-practice' }]} />

        {/* Hero Section */}
        <section className="max-w-4xl mx-auto text-center pt-8 sm:pt-12 md:pt-16 pb-8 sm:pb-12 md:pb-16">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 mb-4 sm:mb-6">
            Free Typing Practice Online
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-3 sm:mb-4 px-2">
            Build muscle memory and improve your typing speed with daily practice
          </p>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground/80 mb-6 sm:mb-8 px-2">
            AI-powered exercises, real-time feedback, and progress tracking - all completely free
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-4 sm:mb-6">
            <Link href="/">
              <Button size="lg" className="text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 w-full sm:w-auto">
                <Keyboard className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Start Practice Now
              </Button>
            </Link>
            <Link href="/learn">
              <Button size="lg" variant="outline" className="text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 w-full sm:w-auto">
                Learn Touch Typing
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>
          <AuthPrompt message="save your practice sessions and track your improvement!" />
        </section>

        {/* Practice Benefits */}
        <section className="max-w-6xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12">
            Why Practice Typing Every Day?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <Brain className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Build Muscle Memory</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                Daily practice trains your fingers to find keys automatically without looking, making typing effortless.
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <TrendingUp className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Increase Speed Gradually</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                Consistent practice leads to measurable improvements. Most users see 20-30% speed gains in just 2 weeks.
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <Target className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Improve Accuracy</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                Focus on typing correctly first. Speed naturally follows when your fingers know exactly where to go.
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <Clock className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Save Time Long-Term</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                Investing 15 minutes daily in practice can save hours of work time when your typing speed doubles.
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <BarChart3 className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Track Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                See your WPM and accuracy improve over time with detailed charts and historical data.
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <Award className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Earn Achievements</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                Stay motivated with badges, certificates, and daily challenges that reward your dedication.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Practice Modes */}
        <section className="max-w-4xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 sm:mb-12">
            Choose Your Practice Mode
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Link href="/">
              <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Keyboard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Standard Practice
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">Type paragraphs in English or 23+ other languages</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" /> Multiple time durations</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" /> AI-generated content</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" /> Real-time WPM tracking</li>
                  </ul>
                </CardContent>
              </Card>
            </Link>

            <Link href="/code-mode">
              <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Code Practice
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">Practice typing code in 20+ programming languages</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" /> JavaScript, Python, Java, C++</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" /> Syntax highlighting</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" /> Special character practice</li>
                  </ul>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* SEO Content */}
        <section className="max-w-4xl mx-auto py-8 sm:py-12 md:py-16">
          <article className="prose prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none">
            <h2>How to Practice Typing Effectively</h2>
            <p>
              Effective typing practice requires consistency and proper technique. Here are the key principles for improving your typing speed:
            </p>

            <h3>1. Start with Accuracy, Not Speed</h3>
            <p>
              When practicing typing, always prioritize accuracy over speed. It's much easier to speed up accurate typing than to correct sloppy habits. Aim for 95%+ accuracy before pushing for higher WPM.
            </p>

            <h3>2. Use Proper Finger Placement</h3>
            <p>
              Your fingers should rest on the home row (ASDF for left hand, JKL; for right hand). Each finger is responsible for specific keys. Touch typing means never looking at the keyboard.
            </p>

            <h3>3. Practice Daily, Even If Just 15 Minutes</h3>
            <p>
              Short, consistent practice sessions are more effective than occasional long sessions. 15 minutes daily builds muscle memory faster than 2 hours once a week.
            </p>

            <h3>4. Track Your Progress</h3>
            <p>
              Use TypeMasterAI's analytics to monitor your WPM and accuracy over time. Seeing improvement is motivating and helps identify areas that need more practice.
            </p>

            <h3>5. Challenge Yourself</h3>
            <p>
              Once you've mastered basic typing, try our code typing mode, multiplayer races, or stress tests to push your skills further.
            </p>
          </article>
        </section>

        {/* CTA */}
        <section className="max-w-2xl mx-auto text-center py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Ready to Improve Your Typing?</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 px-2">
            Start practicing now - no signup required. Track your progress and watch your speed improve.
          </p>
          <Link href="/">
            <Button size="lg" className="text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-6 w-full sm:w-auto">
              <Keyboard className="mr-2 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              Start Typing Practice
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}

