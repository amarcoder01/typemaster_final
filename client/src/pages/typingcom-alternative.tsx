import { Link } from 'wouter';
import { Check, X, Zap, GraduationCap, Users, TrendingUp, Brain, Trophy, BookOpen, Target } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';

export default function TypingComAlternativePage() {
  useSEO({
    title: 'Typing.com Alternative | TypeMasterAI - Free Typing Test for Students & Teachers',
    description: 'Looking for a Typing.com alternative? TypeMasterAI offers free typing tests with AI-powered analytics, multiplayer racing, code typing mode, and comprehensive progress tracking. Perfect for students, teachers, and self-learners!',
    keywords: 'typing.com alternative, free typing lessons, typing test for students, typing tutor alternative, typing practice online, learn to type free, typing course alternative, student typing test',
    canonical: 'https://typemasterai.com/typingcom-alternative',
    ogUrl: 'https://typemasterai.com/typingcom-alternative',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-3 sm:px-4 pt-16 sm:pt-20 pb-12 sm:pb-16">
        <Breadcrumbs items={[{ label: 'Typing.com Alternative', href: '/typingcom-alternative' }]} />
        
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto text-center pt-8 sm:pt-12 md:pt-16 pb-8 sm:pb-12 md:pb-16">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-cyan-400 mb-4 sm:mb-6 px-2">
            The Best Free Typing.com Alternative
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-300 mb-3 sm:mb-4 px-2">
            Everything you need to master typing, without the subscription fees
          </p>
          <p className="text-sm sm:text-base md:text-lg text-slate-400 mb-6 sm:mb-8 px-2">
            Free typing tests, AI-powered analytics, and engaging features for students and self-learners
          </p>
          <Link href="/" className="inline-flex items-center gap-2 w-full sm:w-auto box-border py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#20d7c9] to-[#2682ff] text-white font-semibold leading-tight border border-white/15 whitespace-normal break-words [text-wrap:balance] overflow-visible text-[clamp(14px,2.8vw,18px)] shadow-[0_6px_18px_rgba(0,0,0,0.25)] hover:brightness-105 active:translate-y-[1px] active:brightness-98 transition-all no-underline" data-testid="button-try-typemaster">
            <Zap className="flex-none w-[18px] h-[18px] text-white" />
            <span className="flex-1 text-center">Start Free Typing Test – No Signup Required</span>
          </Link>
        </section>

        {/* Comparison Table */}
        <section className="max-w-6xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center text-white mb-8 sm:mb-12 px-2">
            TypeMasterAI vs Typing.com - Feature Comparison
          </h2>
          
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden -mx-3 sm:-mx-4 md:mx-0">
            <div className="overflow-x-auto px-3 sm:px-4 md:px-0">
              <table className="w-full min-w-[600px]">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="text-left p-2.5 sm:p-3 md:p-4 lg:p-6 text-white font-semibold text-xs sm:text-sm md:text-base">Feature</th>
                    <th className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6 text-cyan-400 font-semibold text-xs sm:text-sm md:text-base">TypeMasterAI</th>
                    <th className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6 text-slate-400 font-semibold text-xs sm:text-sm md:text-base">Typing.com</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  <tr className="bg-cyan-900/20 border-l-2 sm:border-l-4 border-cyan-500">
                    <td className="p-2.5 sm:p-3 md:p-4 lg:p-6 text-white font-semibold text-xs sm:text-sm md:text-base break-words">100% Free Forever</td>
                    <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-cyan-400 mx-auto" /></td>
                    <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6 text-slate-400 text-xs sm:text-sm md:text-base break-words">Premium Required</td>
                  </tr>
                <tr className="bg-cyan-900/20 border-l-2 sm:border-l-4 border-cyan-500">
                    <td className="p-2.5 sm:p-3 md:p-4 lg:p-6 text-white font-semibold text-xs sm:text-sm md:text-base break-words">No Subscription Fees</td>
                    <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-cyan-400 mx-auto" /></td>
                    <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><X className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-2.5 sm:p-3 md:p-4 lg:p-6 text-white text-xs sm:text-sm md:text-base break-words">No Signup Required</td>
                  <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-500 mx-auto" /></td>
                  <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><X className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-500 mx-auto" /></td>
                </tr>
                <tr className="bg-slate-800/30">
                  <td className="p-2.5 sm:p-3 md:p-4 lg:p-6 text-white text-xs sm:text-sm md:text-base break-words">Real-time WPM & Accuracy</td>
                  <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-500 mx-auto" /></td>
                  <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-2.5 sm:p-3 md:p-4 lg:p-6 text-white text-xs sm:text-sm md:text-base break-words">Multiple Test Durations</td>
                  <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-500 mx-auto" /></td>
                  <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="bg-slate-800/30">
                  <td className="p-2.5 sm:p-3 md:p-4 lg:p-6 text-white text-xs sm:text-sm md:text-base break-words">Progress Tracking</td>
                  <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-500 mx-auto" /></td>
                  <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-500 mx-auto" /></td>
                </tr>
                <tr className="bg-cyan-900/20 border-l-2 sm:border-l-4 border-cyan-500">
                    <td className="p-2.5 sm:p-3 md:p-4 lg:p-6 text-white font-semibold text-xs sm:text-sm md:text-base break-words">AI-Powered Analytics</td>
                    <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-cyan-400 mx-auto" /></td>
                    <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><X className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-500 mx-auto" /></td>
                </tr>
                <tr className="bg-cyan-900/20 border-l-2 sm:border-l-4 border-cyan-500">
                    <td className="p-2.5 sm:p-3 md:p-4 lg:p-6 text-white font-semibold text-xs sm:text-sm md:text-base break-words">Keystroke Heatmap</td>
                    <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-cyan-400 mx-auto" /></td>
                    <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><X className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-500 mx-auto" /></td>
                </tr>
                <tr className="bg-cyan-900/20 border-l-2 sm:border-l-4 border-cyan-500">
                    <td className="p-2.5 sm:p-3 md:p-4 lg:p-6 text-white font-semibold text-xs sm:text-sm md:text-base break-words">Finger Usage Analytics</td>
                    <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-cyan-400 mx-auto" /></td>
                    <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><X className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-500 mx-auto" /></td>
                </tr>
                <tr className="bg-cyan-900/20 border-l-2 sm:border-l-4 border-cyan-500">
                    <td className="p-2.5 sm:p-3 md:p-4 lg:p-6 text-white font-semibold text-xs sm:text-sm md:text-base break-words">AI Practice Recommendations</td>
                    <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-cyan-400 mx-auto" /></td>
                    <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><X className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-500 mx-auto" /></td>
                </tr>
                <tr className="bg-cyan-900/20 border-l-2 sm:border-l-4 border-cyan-500">
                    <td className="p-2.5 sm:p-3 md:p-4 lg:p-6 text-white font-semibold text-xs sm:text-sm md:text-base break-words">Code Typing Mode (10+ Languages)</td>
                    <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-cyan-400 mx-auto" /></td>
                    <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><X className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-500 mx-auto" /></td>
                </tr>
                <tr className="bg-cyan-900/20 border-l-2 sm:border-l-4 border-cyan-500">
                    <td className="p-2.5 sm:p-3 md:p-4 lg:p-6 text-white font-semibold text-xs sm:text-sm md:text-base break-words">Multiplayer Racing</td>
                    <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-cyan-400 mx-auto" /></td>
                    <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><X className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-500 mx-auto" /></td>
                </tr>
                <tr className="bg-cyan-900/20 border-l-2 sm:border-l-4 border-cyan-500">
                    <td className="p-2.5 sm:p-3 md:p-4 lg:p-6 text-white font-semibold text-xs sm:text-sm md:text-base break-words">Daily Challenges & Achievements</td>
                    <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-cyan-400 mx-auto" /></td>
                    <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><X className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-500 mx-auto" /></td>
                </tr>
                <tr className="bg-cyan-900/20 border-l-2 sm:border-l-4 border-cyan-500">
                    <td className="p-2.5 sm:p-3 md:p-4 lg:p-6 text-white font-semibold text-xs sm:text-sm md:text-base break-words">Push Notifications</td>
                    <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-cyan-400 mx-auto" /></td>
                    <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><X className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-500 mx-auto" /></td>
                </tr>
                <tr className="bg-slate-800/30">
                  <td className="p-2.5 sm:p-3 md:p-4 lg:p-6 text-white text-xs sm:text-sm md:text-base break-words">23+ Languages Supported</td>
                  <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-500 mx-auto" /></td>
                  <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-2.5 sm:p-3 md:p-4 lg:p-6 text-white text-xs sm:text-sm md:text-base break-words">Lessons & Curriculum</td>
                  <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6 text-slate-400 text-xs sm:text-sm md:text-base break-words">Practice-Based</td>
                  <td className="text-center p-2.5 sm:p-3 md:p-4 lg:p-6"><Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
          </div>
        </section>

        {/* Why Choose TypeMasterAI */}
        <section className="max-w-6xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center text-white mb-8 sm:mb-12 px-2">
            Why Students & Self-Learners Choose TypeMasterAI Over Typing.com
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <Card className="bg-slate-800/50 border-slate-700" data-testid="card-free-forever">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-cyan-400 text-base sm:text-lg">
                  <Zap className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                  100% Free Forever
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 p-4 sm:p-6 pt-0">
                <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                  While Typing.com requires a premium subscription for advanced features, TypeMasterAI provides everything completely free. No hidden fees, no premium tiers—just unlimited access to all features for everyone.
                </p>
                <p className="text-sm sm:text-base">
                  Perfect for students, teachers, and anyone who wants to improve their typing without spending money on subscriptions.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700" data-testid="card-ai-powered">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-cyan-400 text-base sm:text-lg">
                  <Brain className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                  AI-Powered Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 p-4 sm:p-6 pt-0">
                <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                  Our advanced AI analyzes your typing patterns in real-time, identifying specific weaknesses like slow key combinations, finger misuse, and hand balance issues.
                </p>
                <p className="text-sm sm:text-base">
                  Get personalized practice recommendations that target your exact problem areas—something Typing.com doesn't offer at any price.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700" data-testid="card-code-typing">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-cyan-400 text-base sm:text-lg">
                  <GraduationCap className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                  Code Typing for Future Developers
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 p-4 sm:p-6 pt-0">
                <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                  If you're learning programming, our code typing mode helps you practice typing real code snippets in Python, JavaScript, Java, C++, and 10+ other languages.
                </p>
                <p className="text-sm sm:text-base">
                  Develop muscle memory for brackets, semicolons, and special characters that regular typing tests don't emphasize—crucial skills for aspiring developers.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700" data-testid="card-multiplayer">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-cyan-400 text-base sm:text-lg">
                  <Users className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                  Competitive Multiplayer Racing
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 p-4 sm:p-6 pt-0">
                <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                  Learning is more fun when it's social! Race against friends or random opponents in real-time multiplayer typing races.
                </p>
                <p className="text-sm sm:text-base">
                  Instant matchmaking, private rooms for classroom competitions, and live leaderboards make practice feel like a game—keeping students engaged and motivated.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700" data-testid="card-analytics">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-cyan-400 text-base sm:text-lg">
                  <TrendingUp className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                  Industry-Leading Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 p-4 sm:p-6 pt-0">
                <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                  Visualize your progress with detailed charts, keyboard heatmaps showing which keys slow you down, finger usage breakdowns, and hand balance metrics.
                </p>
                <p className="text-sm sm:text-base">
                  Track WPM consistency throughout tests, identify your slowest words, and see fastest vs slowest key combinations—analytics that go far beyond basic WPM tracking.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700" data-testid="card-gamification">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-cyan-400 text-base sm:text-lg">
                  <Trophy className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                  Achievements & Daily Challenges
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 p-4 sm:p-6 pt-0">
                <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                  Unlock 25+ achievements across 5 tiers (bronze to diamond) as you hit speed milestones, maintain accuracy, and build practice streaks.
                </p>
                <p className="text-sm sm:text-base">
                  Daily and weekly challenges with point rewards keep practice fresh and exciting—perfect for maintaining long-term motivation and consistency.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* For Students Section */}
        <section className="max-w-6xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center text-white mb-8 sm:mb-12 px-2">
            Perfect for Students at Every Level
          </h2>
          
          <article className="bg-slate-800/30 rounded-lg border border-slate-700 p-3 sm:p-4 md:p-6 lg:p-8 mb-4 sm:mb-6 md:mb-8">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-cyan-400 mb-3 sm:mb-4 md:mb-6">Elementary & Middle School Students</h3>
            <div className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-300 space-y-2.5 sm:space-y-3 md:space-y-4 leading-relaxed">
              <p>
                TypeMasterAI is ideal for young learners who are just starting their typing journey. Unlike Typing.com's structured curriculum approach, we focus on practice-based learning that lets students progress at their own pace.
              </p>
              <p>
                Our gamification features—achievements, challenges, and multiplayer races—keep younger students engaged without the pressure of grades or formal assessments. The visual feedback system with color-coded letters helps reinforce proper technique naturally.
              </p>
              <p>
                Parents and teachers love that it's completely free with no ads, subscriptions, or paywalls blocking features. Students can practice unlimited tests anytime, anywhere, on any device.
              </p>
            </div>
          </article>

          <article className="bg-slate-800/30 rounded-lg border border-slate-700 p-3 sm:p-4 md:p-6 lg:p-8 mb-4 sm:mb-6 md:mb-8">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-cyan-400 mb-3 sm:mb-4 md:mb-6">High School & College Students</h3>
            <div className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-300 space-y-2.5 sm:space-y-3 md:space-y-4 leading-relaxed">
              <p>
                For older students preparing for college or careers, TypeMasterAI offers advanced features that Typing.com Premium charges for. Our AI-powered analytics identify exactly which keys and combinations slow you down, with personalized practice plans to target those weaknesses.
              </p>
              <p>
                The code typing mode is perfect for students in computer science classes or learning programming on their own. Practice typing real Python, JavaScript, Java, C++, and other language syntax—building muscle memory for brackets, semicolons, and special characters that regular typing tests ignore.
              </p>
              <p>
                Competitive students can track their progress on global leaderboards, earn achievements for speed milestones, and challenge classmates in multiplayer races. These social features make practice feel less like homework and more like a competition.
              </p>
            </div>
          </article>

          <article className="bg-slate-800/30 rounded-lg border border-slate-700 p-3 sm:p-4 md:p-6 lg:p-8">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-cyan-400 mb-3 sm:mb-4 md:mb-6">Self-Learners & Adult Students</h3>
            <div className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-300 space-y-2.5 sm:space-y-3 md:space-y-4 leading-relaxed">
              <p>
                Adults improving their typing skills for work or personal development appreciate TypeMasterAI's no-nonsense approach. No childish graphics or mandatory lessons—just powerful tools to measure and improve your speed.
              </p>
              <p>
                The comprehensive analytics dashboard shows WPM trends over time, accuracy improvements, consistency scores, and detailed breakdowns of which fingers and hands need more practice. This data-driven approach helps adults optimize their learning efficiently.
              </p>
              <p>
                Professional features like code typing mode and stress tests cater to developers and knowledge workers who need typing proficiency for their careers—all without the monthly subscription fees that Typing.com charges.
              </p>
            </div>
          </article>
        </section>

        {/* How TypeMasterAI Works */}
        <section className="max-w-6xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center text-white mb-8 sm:mb-12 px-2">
            How TypeMasterAI Helps You Improve
          </h2>
          
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            <Card className="bg-slate-800/50 border-slate-700" data-testid="card-step-1">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-white text-base sm:text-lg">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cyan-500 text-white font-bold mr-3 sm:mr-4 text-sm sm:text-base">1</div>
                  Take Your First Typing Test
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 p-4 sm:p-6 pt-0">
                <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                  Start with a simple 1-minute, 3-minute, or 5-minute typing test. No account required—just click start and begin typing. Our system captures every keystroke, measuring your speed (WPM), accuracy, and consistency in real-time.
                </p>
                <p className="text-sm sm:text-base">
                  Choose from 23+ languages and multiple difficulty levels. Test yourself on standard paragraphs or code snippets depending on your goals.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700" data-testid="card-step-2">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-white text-base sm:text-lg">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cyan-500 text-white font-bold mr-3 sm:mr-4 text-sm sm:text-base">2</div>
                  Review Your Detailed Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 p-4 sm:p-6 pt-0">
                <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                  After each test, view comprehensive analytics that go far beyond simple WPM scores. See your keyboard heatmap showing which keys you press most (and slowest), finger usage distribution, hand balance metrics, and WPM consistency throughout the test.
                </p>
                <p className="text-sm sm:text-base">
                  Identify your slowest words, fastest and slowest key combinations (digraphs), and common error patterns. This level of detail helps you understand exactly where to focus your improvement efforts.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700" data-testid="card-step-3">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-white text-base sm:text-lg">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cyan-500 text-white font-bold mr-3 sm:mr-4 text-sm sm:text-base">3</div>
                  Get AI-Powered Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 p-4 sm:p-6 pt-0">
                <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                  Our AI analyzes your keystroke data and generates personalized practice recommendations. It identifies specific weaknesses like slow digraphs, underused fingers, or accuracy issues on certain keys.
                </p>
                <p className="text-sm sm:text-base">
                  Each recommendation includes actionable steps, target keys or combinations to practice, and estimated practice duration. Follow these custom plans to improve faster than generic typing lessons ever could.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700" data-testid="card-step-4">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-white text-base sm:text-lg">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cyan-500 text-white font-bold mr-3 sm:mr-4 text-sm sm:text-base">4</div>
                  Practice Consistently & Track Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 p-4 sm:p-6 pt-0">
                <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                  Build a daily practice habit with our achievement system and daily challenges. Earn points, unlock badges from bronze to diamond tiers, and maintain practice streaks.
                </p>
                <p className="text-sm sm:text-base">
                  Track your improvement over days, weeks, and months with trend charts showing WPM growth, accuracy improvements, and consistency gains. See tangible proof that your practice is paying off.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700" data-testid="card-step-5">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center text-white text-base sm:text-lg">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cyan-500 text-white font-bold mr-3 sm:mr-4 text-sm sm:text-base">5</div>
                  Challenge Yourself & Compete
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 p-4 sm:p-6 pt-0">
                <p className="mb-3 sm:mb-4 text-sm sm:text-base">
                  Once you've built a solid foundation, test your skills in multiplayer races against other typists worldwide. Compete on global leaderboards, join daily and weekly challenges, and push yourself to new speed milestones.
                </p>
                <p className="text-sm sm:text-base">
                  Try specialized modes like code typing (for developers) or stress tests (for endurance) to challenge yourself in new ways and keep practice interesting.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Typing.com Premium vs TypeMasterAI Free */}
        <section className="max-w-6xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center text-white mb-8 sm:mb-12 px-2">
            Typing.com Premium vs TypeMasterAI Free
          </h2>
          
          <article className="bg-slate-800/30 rounded-lg border border-slate-700 p-3 sm:p-4 md:p-6 lg:p-8">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-cyan-400 mb-3 sm:mb-4 md:mb-6">The Cost Comparison</h3>
            <div className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-300 space-y-2.5 sm:space-y-3 md:space-y-4 mb-4 sm:mb-6 md:mb-8 leading-relaxed">
              <p>
                Typing.com charges a monthly or annual subscription fee to access premium features like detailed analytics, custom practice plans, and advanced progress tracking. Over a year, these subscription costs can add up to hundreds of dollars per student.
              </p>
              <p>
                TypeMasterAI provides all features completely free—forever. No trials, no premium tiers, no feature limitations. What would cost you $100+ per year on Typing.com is available instantly at zero cost on TypeMasterAI.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
              <div className="bg-slate-700/30 rounded-lg p-3 sm:p-4 md:p-6 border border-slate-600">
                <h4 className="text-base sm:text-lg md:text-xl font-semibold text-slate-300 mb-2 sm:mb-3 md:mb-4">Typing.com Premium</h4>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-red-400 mb-2 sm:mb-3 md:mb-4">$99/year</p>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-400">
                  <li className="flex items-start">
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-500 mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                    <span className="break-words">Structured lessons & curriculum</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-500 mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                    <span className="break-words">Basic progress tracking</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-500 mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                    <span className="break-words">Teacher dashboard (separate fee)</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-red-500 mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                    <span className="break-words">No AI-powered analytics</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-red-500 mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                    <span className="break-words">No multiplayer racing</span>
                  </li>
                  <li className="flex items-start">
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-red-500 mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                    <span className="break-words">No code typing mode</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded-lg p-3 sm:p-4 md:p-6 border-2 border-cyan-500">
                <h4 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-2 sm:mb-3 md:mb-4">TypeMasterAI Free</h4>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-cyan-400 mb-2 sm:mb-3 md:mb-4">$0/forever</p>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-300">
                  <li className="flex items-start">
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-cyan-400 mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                    <span className="break-words">Practice-based learning</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-cyan-400 mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                    <span className="break-words">Advanced AI analytics</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-cyan-400 mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                    <span className="break-words">Multiplayer racing</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-cyan-400 mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                    <span className="break-words">Code typing mode</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-cyan-400 mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                    <span className="break-words">Achievements & challenges</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-cyan-400 mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" />
                    <span className="break-words">All features unlocked</span>
                  </li>
                </ul>
              </div>
            </div>

            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-300 leading-relaxed">
              <strong className="text-cyan-400">Bottom line:</strong> Save $99/year per student by choosing TypeMasterAI. For a classroom of 30 students, that's nearly $3,000 in annual savings—without sacrificing quality or features. In fact, you get advanced AI capabilities that Typing.com doesn't offer at any price.
            </p>
          </article>
        </section>

        {/* FAQ Section */}
        <section className="max-w-4xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center text-white mb-8 sm:mb-12 px-2">
            Frequently Asked Questions
          </h2>
          
          <article className="space-y-3 sm:space-y-4 md:space-y-6 text-slate-300 px-2">
            <h4 className="text-base sm:text-lg md:text-xl font-semibold text-cyan-400 mt-3 sm:mt-4 md:mt-6">Is TypeMasterAI really 100% free?</h4>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-300 leading-relaxed">
              Yes! TypeMasterAI is completely free with no subscriptions, trials, or premium tiers. All features—AI analytics, multiplayer racing, code typing mode, achievements, and more—are available to everyone at zero cost. We believe typing education should be accessible to all students regardless of their financial situation.
            </p>

            <h4 className="text-base sm:text-lg md:text-xl font-semibold text-cyan-400 mt-3 sm:mt-4 md:mt-6">Do I need to create an account to practice?</h4>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-300 leading-relaxed">
              No signup required! You can start taking typing tests immediately without creating an account. However, creating a free account lets you save your progress, track improvement over time, earn achievements, and compete on leaderboards. Accounts are optional but recommended for long-term learners.
            </p>

            <h4 className="text-base sm:text-lg md:text-xl font-semibold text-cyan-400 mt-3 sm:mt-4 md:mt-6">Does TypeMasterAI have structured lessons like Typing.com?</h4>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-300 leading-relaxed">
              TypeMasterAI takes a different approach than Typing.com's curriculum-based lessons. Instead of forcing you through pre-set lesson plans, we use AI to analyze your actual typing patterns and create personalized practice recommendations based on your specific weaknesses. This adaptive approach often leads to faster improvement than one-size-fits-all lessons.
            </p>

            <h4 className="text-base sm:text-lg md:text-xl font-semibold text-cyan-400 mt-3 sm:mt-4 md:mt-6">Can teachers use TypeMasterAI in the classroom?</h4>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-300 leading-relaxed">
              Absolutely! Teachers love TypeMasterAI because it's free for all students with no licensing fees. Students can practice at school and at home using the same account. Teachers can organize classroom competitions using multiplayer races or create private race rooms for student assessments. While we don't currently have a dedicated teacher dashboard like Typing.com, the free access for unlimited students makes it ideal for schools and educational programs.
            </p>

            <h4 className="text-base sm:text-lg md:text-xl font-semibold text-cyan-400 mt-3 sm:mt-4 md:mt-6">What makes TypeMasterAI better than Typing.com?</h4>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-300 leading-relaxed">
              While Typing.com excels at structured curriculum and teacher management tools, TypeMasterAI offers superior analytics, AI-powered personalization, engaging multiplayer features, and specialized modes like code typing—all completely free. If you're a self-motivated learner or want advanced features without subscription costs, TypeMasterAI is the better choice. If you prefer formal lessons with teacher oversight and don't mind paying, Typing.com might suit you. Try both and see which approach works better for your learning style.
            </p>

            <h4 className="text-base sm:text-lg md:text-xl font-semibold text-cyan-400 mt-3 sm:mt-4 md:mt-6">How long does it take to improve my typing speed?</h4>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-300 leading-relaxed">
              Most students see noticeable improvement within 2-4 weeks of consistent daily practice (15-30 minutes per day). Our AI analytics help you focus on your weakest areas, accelerating improvement compared to generic practice. Beginners typically start around 30-40 WPM and can reach 50-60 WPM within a month. More advanced typists working on speed can often add 10-20 WPM within 2-3 months of targeted practice.
            </p>

            <h4 className="text-base sm:text-lg md:text-xl font-semibold text-cyan-400 mt-3 sm:mt-4 md:mt-6">Is TypeMasterAI suitable for young children?</h4>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-300 leading-relaxed">
              Yes! Our visual feedback system with color-coded letters helps young learners understand typing in real-time. The gamification features—achievements, challenges, and multiplayer races—keep children engaged without the pressure of grades. Parents appreciate that it's completely free with no ads or inappropriate content. For very young children (under 8), we recommend starting with 1-minute tests and focusing on accuracy over speed.
            </p>

            <h4 className="text-base sm:text-lg md:text-xl font-semibold text-cyan-400 mt-3 sm:mt-4 md:mt-6">What languages does TypeMasterAI support?</h4>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-300 leading-relaxed">
              We support 23+ languages including English, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Hindi, and many more. You can switch languages anytime to practice typing in your native language or learn typing in a foreign language you're studying.
            </p>

            <div className="text-center mt-8 sm:mt-12">
              <Link href="/" className="inline-flex items-center gap-2 w-full sm:w-auto box-border py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#20d7c9] to-[#2682ff] text-white font-semibold leading-tight border border-white/15 whitespace-normal break-words [text-wrap:balance] overflow-visible text-[clamp(14px,2.8vw,18px)] shadow-[0_6px_18px_rgba(0,0,0,0.25)] hover:brightness-105 active:translate-y-[1px] active:brightness-98 transition-all no-underline" data-testid="button-start-test-bottom">
                <Zap className="flex-none w-[18px] h-[18px] text-white" />
                <span className="flex-1 text-center">Try TypeMasterAI Free - Better Than Typing.com</span>
              </Link>
            </div>
          </article>
        </section>

        {/* Related Pages */}
        <section className="max-w-6xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-white mb-8 sm:mb-12 px-2">Compare More Typing Test Platforms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Link href="/monkeytype-alternative">
              <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer" data-testid="card-monkeytype">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-white text-base sm:text-lg">Monkeytype Alternative</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <p className="text-slate-400 text-sm sm:text-base">
                    See how TypeMasterAI compares to Monkeytype's minimalist approach
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/typeracer-alternative">
              <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer" data-testid="card-typeracer">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-white text-base sm:text-lg">Typeracer Alternative</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <p className="text-slate-400 text-sm sm:text-base">
                    Discover multiplayer racing with instant matchmaking
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/10fastfingers-alternative">
              <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500 transition-colors cursor-pointer" data-testid="card-10fastfingers">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-white text-base sm:text-lg">10FastFingers Alternative</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <p className="text-slate-400 text-sm sm:text-base">
                    Compare our features to 10FastFingers' word-based tests
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
