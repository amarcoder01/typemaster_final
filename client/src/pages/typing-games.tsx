import { Link } from 'wouter';
import { Gamepad2, Users, Trophy, Zap, ArrowRight, Swords, Target, Timer, Star, Flame } from 'lucide-react';
import { useSEO, SEO_CONFIGS, getSoftwareAppSchema } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { AuthPrompt } from "@/components/auth-prompt";

export default function TypingGamesPage() {
  useSEO({
    ...SEO_CONFIGS.typingGames,
    structuredData: getSoftwareAppSchema(
      'TypeMasterAI Typing Games',
      'Free online typing games to improve your speed while having fun',
      ['Multiplayer Racing', 'Stress Test Challenge', 'Daily Challenges', 'Leaderboards', 'Achievements']
    ),
  });

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pt-20 pb-16">
        <Breadcrumbs items={[{ label: 'Typing Games', href: '/typing-games' }]} />

        {/* Hero Section */}
        <section className="max-w-4xl mx-auto text-center pt-8 sm:pt-12 md:pt-16 pb-8 sm:pb-12 md:pb-16">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 mb-4 sm:mb-6">
            Free Typing Games Online
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-3 sm:mb-4 px-2">
            Improve your typing speed while having fun
          </p>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground/80 mb-6 sm:mb-8 px-2">
            Race against others, complete challenges, and climb the leaderboard
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-4 sm:mb-6">
            <Link href="/multiplayer">
              <Button size="lg" className="text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 w-full sm:w-auto">
                <Gamepad2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Play Multiplayer Race
              </Button>
            </Link>
            <Link href="/stress-test">
              <Button size="lg" variant="outline" className="text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 w-full sm:w-auto">
                Stress Test Challenge
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>
          <AuthPrompt message="save your game scores and climb the global ranks!" />
        </section>

        {/* Game Modes */}
        <section className="max-w-6xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12">
            Choose Your Game Mode
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Link href="/multiplayer">
              <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader className="p-4 sm:p-6">
                  <Swords className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-primary mb-2" />
                  <CardTitle className="text-base sm:text-lg">Multiplayer Race</CardTitle>
                  <CardDescription className="text-sm sm:text-base">Real-time competition</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                  <p className="mb-3 sm:mb-4">Race against other players in real-time. See live WPM updates for all participants.</p>
                  <ul className="space-y-1 text-xs sm:text-sm">
                    <li>• Up to 10 players per race</li>
                    <li>• ELO rating system</li>
                    <li>• Private rooms available</li>
                    <li>• Anti-cheat protection</li>
                  </ul>
                </CardContent>
              </Card>
            </Link>

            <Link href="/stress-test">
              <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader className="p-4 sm:p-6">
                  <Flame className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-orange-500 mb-2" />
                  <CardTitle className="text-base sm:text-lg">Stress Test</CardTitle>
                  <CardDescription className="text-sm sm:text-base">Type under pressure</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                  <p className="mb-3 sm:mb-4">Test your focus with visual distractions, screen shake, and other challenges.</p>
                  <ul className="space-y-1 text-xs sm:text-sm">
                    <li>• Multiple difficulty levels</li>
                    <li>• Visual effects challenge</li>
                    <li>• Separate leaderboard</li>
                    <li>• Unlockable modes</li>
                  </ul>
                </CardContent>
              </Card>
            </Link>

            <Link href="/">
              <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader className="p-4 sm:p-6">
                  <Timer className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-primary mb-2" />
                  <CardTitle className="text-base sm:text-lg">Speed Challenge</CardTitle>
                  <CardDescription className="text-sm sm:text-base">Beat your personal best</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                  <p className="mb-3 sm:mb-4">Race against the clock in timed challenges. Try to beat your high score!</p>
                  <ul className="space-y-1 text-xs sm:text-sm">
                    <li>• Multiple time options</li>
                    <li>• Personal records tracked</li>
                    <li>• Achievement badges</li>
                    <li>• Progress charts</li>
                  </ul>
                </CardContent>
              </Card>
            </Link>

            <Link href="/code-mode">
              <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader className="p-4 sm:p-6">
                  <Zap className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-green-500 mb-2" />
                  <CardTitle className="text-base sm:text-lg">Code Typing</CardTitle>
                  <CardDescription className="text-sm sm:text-base">For developers</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                  <p className="mb-3 sm:mb-4">Type real code snippets in 20+ programming languages with syntax highlighting.</p>
                  <ul className="space-y-1 text-xs sm:text-sm">
                    <li>• JavaScript, Python, Java</li>
                    <li>• Special character practice</li>
                    <li>• Developer leaderboard</li>
                    <li>• Code-specific stats</li>
                  </ul>
                </CardContent>
              </Card>
            </Link>

            <Link href="/leaderboard">
              <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader className="p-4 sm:p-6">
                  <Trophy className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-yellow-500 mb-2" />
                  <CardTitle className="text-base sm:text-lg">Leaderboards</CardTitle>
                  <CardDescription className="text-sm sm:text-base">Compete globally</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                  <p className="mb-3 sm:mb-4">See how you rank against typists worldwide. Filter by mode and language.</p>
                  <ul className="space-y-1 text-xs sm:text-sm">
                    <li>• Global rankings</li>
                    <li>• Daily/weekly/all-time</li>
                    <li>• Multiple categories</li>
                    <li>• Country rankings</li>
                  </ul>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dictation-mode">
              <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader className="p-4 sm:p-6">
                  <Target className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-purple-500 mb-2" />
                  <CardTitle className="text-base sm:text-lg">Dictation Mode</CardTitle>
                  <CardDescription className="text-sm sm:text-base">Listen and type</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                  <p className="mb-3 sm:mb-4">Hear sentences spoken aloud and type what you hear. Improves listening skills too!</p>
                  <ul className="space-y-1 text-xs sm:text-sm">
                    <li>• Audio playback</li>
                    <li>• Multiple voices</li>
                    <li>• Adjustable speed</li>
                    <li>• Transcription practice</li>
                  </ul>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>

        {/* Why Games? */}
        <section className="max-w-4xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 sm:mb-12">
            Why Learn Typing Through Games?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <Star className="h-7 w-7 sm:h-8 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Fun & Engaging</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                Games make practice enjoyable. You'll want to come back and play more, leading to faster improvement.
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <Users className="h-7 w-7 sm:h-8 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Social Competition</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                Competing against real people adds excitement. See live results and climb the ranks together.
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <Trophy className="h-7 w-7 sm:h-8 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Rewards & Motivation</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                Earn achievements, badges, and certificates. Daily challenges keep you coming back for more.
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <Zap className="h-7 w-7 sm:h-8 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Faster Results</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                Studies show gamified learning improves retention and skill development compared to boring drills.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SEO Content */}
        <section className="max-w-4xl mx-auto py-8 sm:py-12 md:py-16">
          <article className="prose prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none">
            {/* AI Answer / TL;DR Section */}
            <div className="bg-card/50 border border-primary/20 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg shadow-primary/5">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground m-0 !mt-0">Quick Answer: Online Typing Games</h2>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed mb-3 sm:mb-4">
                <strong>Typing games</strong> turn boring practice into engaging gameplay, improving WPM retention by up to <strong>40%</strong> compared to standard drills.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 not-prose">
                <div>
                  <h3 className="font-semibold text-primary mb-1 text-sm sm:text-base">Best For</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Kids, students, and anyone struggling with motivation in standard tests.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-primary mb-1 text-sm sm:text-base">Key Features</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Multiplayer racing, stress tests, and gamified challenges.</p>
                </div>
              </div>
            </div>

            <h2>Free Typing Games for All Ages</h2>
            <p>
              Whether you're a beginner learning to type or an expert looking for a challenge, our <strong>free typing games</strong> offer something for everyone. No downloads, no signup required - just pure typing fun.
            </p>

            <h3>Typing Games for Kids</h3>
            <p>
              Learning to type can be dry for younger audiences, but gamification changes everything. TypeMasterAI’s games are specifically designed to keep <strong>kids and students</strong> engaged through interactive and safe environments:
            </p>
            <ul>
              <li><strong>Visual Rewards:</strong> Unlock colorful badges, confetti effects, and level-up animations that provide instant positive reinforcement.</li>
              <li><strong>Family-Friendly Content:</strong> Our dictionaries are curated to ensure 100% safe, appropriate words for all ages in both single-player and multiplayer modes.</li>
              <li><strong>Confidence Building:</strong> Visual progress graphs help kids see their improvement day by day, making the learning process rewarding rather than frustrating.</li>
            </ul>

            <h3>Typing Games for Adults</h3>
            <p>
              Professionals can use our games to maintain and improve their typing skills. The multiplayer racing feature is especially popular for office competitions.
            </p>

            <h3>Benefits of Typing Games</h3>
            <ul>
              <li>Learn without feeling like you're practicing</li>
              <li>Build muscle memory through repetition</li>
              <li>Get instant feedback on your performance</li>
              <li>Track improvement over time</li>
              <li>Compete with friends and family</li>
            </ul>
          </article>
        </section>

        {/* CTA */}
        <section className="max-w-2xl mx-auto text-center py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Ready to Play?</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 px-2">
            Jump into a multiplayer race right now - no signup needed!
          </p>
          <Link href="/multiplayer">
            <Button size="lg" className="text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-6 w-full sm:w-auto">
              <Gamepad2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              Start Playing Now
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}

