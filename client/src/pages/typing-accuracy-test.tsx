import { Link } from 'wouter';
import { Target, Keyboard, CheckCircle, XCircle, ArrowRight, Zap, BarChart, AlertTriangle } from 'lucide-react';
import { useSEO, getBreadcrumbSchema, getFAQSchema } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { AuthPrompt } from "@/components/auth-prompt";

const PAGE_FAQS = [
  {
    question: "What is typing accuracy?",
    answer: "Typing accuracy is the percentage of characters typed correctly without errors. It's calculated as (correct characters / total characters) × 100. A 95% accuracy means 5 errors per 100 characters."
  },
  {
    question: "What is a good typing accuracy?",
    answer: "95% accuracy is considered good for general use. Professional typists aim for 98%+. Data entry and medical transcription often require 99%+ accuracy."
  },
  {
    question: "Is accuracy or speed more important?",
    answer: "Accuracy is more important than speed. Errors require time to correct, and in many jobs, errors can have serious consequences. Focus on accuracy first, then gradually increase speed."
  },
  {
    question: "How can I improve my typing accuracy?",
    answer: "Slow down and focus on hitting the right keys. Practice problematic keys specifically. Use proper finger placement. Take regular breaks to avoid fatigue-related errors."
  },
  {
    question: "Why does my accuracy drop when I type faster?",
    answer: "Speed and accuracy have an inverse relationship initially. As you push beyond your comfort zone, errors increase. The solution is to practice at a speed where you maintain 95%+ accuracy, then gradually increase."
  }
];

export default function TypingAccuracyTestPage() {
  useSEO({
    title: 'Typing Accuracy Test | Check Your Error Rate - TypeMasterAI',
    description: 'Take a typing accuracy test to measure your error rate and precision. Get detailed error analysis, problem key identification, and tips to improve your accuracy to 99%+.',
    keywords: 'typing accuracy test, typing accuracy, typing errors, typing precision test, accuracy vs speed, typing error rate, improve typing accuracy, typing mistakes test, accurate typing test',
    canonical: 'https://typemasterai.com/typing-accuracy-test',
    ogUrl: 'https://typemasterai.com/typing-accuracy-test',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          'name': 'TypeMasterAI Typing Accuracy Test',
          'description': 'Precision-focused typing test with detailed error analysis and accuracy improvement recommendations.',
          'applicationCategory': 'EducationalApplication',
          'operatingSystem': 'Web Browser',
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
        },
        getBreadcrumbSchema([
          { name: 'Home', url: 'https://typemasterai.com' },
          { name: 'Typing Accuracy Test', url: 'https://typemasterai.com/typing-accuracy-test' }
        ]),
        getFAQSchema(PAGE_FAQS)
      ]
    }
  });

  const accuracyLevels = [
    { level: 'Needs Work', range: '< 90%', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
    { level: 'Average', range: '90-94%', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    { level: 'Good', range: '95-97%', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
    { level: 'Excellent', range: '98-99%', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
    { level: 'Professional', range: '99%+', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 pt-16 md:pt-20 pb-12 md:pb-16">
        <Breadcrumbs items={[{ label: 'Typing Accuracy Test', href: '/typing-accuracy-test' }]} />

        {/* Hero Section */}
        <section className="max-w-4xl mx-auto text-center pt-8 pb-12 md:pb-16">
          <div className="inline-flex items-center justify-center p-2 bg-green-500/10 rounded-full mb-6 border border-green-500/30">
            <Target className="w-4 h-4 text-green-400 mr-2" />
            <span className="text-sm text-green-300">Precision Focus</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Typing <span className="text-green-400">Accuracy</span> Test
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-4 max-w-3xl mx-auto">
            Accuracy matters more than speed. Measure your precision and eliminate errors.
          </p>
          <p className="text-base md:text-lg text-slate-400 mb-8">
            Get detailed error analysis and personalized improvement tips
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link href="/">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-green-600 hover:bg-green-700">
                <Target className="mr-2 h-5 w-5" />
                Start Accuracy Test
              </Button>
            </Link>
            <Link href="/analytics">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6">
                View Analytics
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <AuthPrompt message="save your accuracy results and track your precision over time!" />
        </section>

        {/* Accuracy Levels */}
        <section className="max-w-4xl mx-auto py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
            Accuracy Level Benchmarks
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {accuracyLevels.map((item, i) => (
              <Card key={i} className={`${item.bg} border text-center`}>
                <CardContent className="pt-6">
                  <p className={`text-lg font-bold ${item.color}`}>{item.level}</p>
                  <p className="text-2xl font-bold text-white mt-2">{item.range}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Why Accuracy Matters */}
        <section className="max-w-4xl mx-auto py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
            Why Accuracy Matters More Than Speed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <XCircle className="w-10 h-10 text-red-400 mb-2" />
                <CardTitle className="text-white">The Cost of Errors</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-2 text-sm md:text-base">
                <p>• Each error takes 2-3 seconds to correct</p>
                <p>• 90% accuracy at 60 WPM = ~36 errors/minute</p>
                <p>• That's 1-2 minutes lost per minute of typing!</p>
                <p>• Professional documents require near-perfect accuracy</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CheckCircle className="w-10 h-10 text-green-400 mb-2" />
                <CardTitle className="text-white">Benefits of High Accuracy</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-300 space-y-2 text-sm md:text-base">
                <p>• No time lost to corrections</p>
                <p>• Professional-quality output</p>
                <p>• Less mental fatigue</p>
                <p>• Speed naturally improves with practice</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Common Error Types */}
        <section className="max-w-4xl mx-auto py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
            Common Typing Error Types
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Adjacent Key Errors', desc: 'Hitting the key next to the intended one (e.g., "r" instead of "t")', tip: 'Practice specific finger exercises' },
              { title: 'Transposition Errors', desc: 'Typing letters in wrong order (e.g., "teh" instead of "the")', tip: 'Slow down on common word patterns' },
              { title: 'Omission Errors', desc: 'Missing letters entirely, especially in longer words', tip: 'Focus on complete keystrokes' },
            ].map((item, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <AlertTriangle className="w-8 h-8 text-yellow-400 mb-2" />
                  <CardTitle className="text-white text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 text-sm mb-3">{item.desc}</p>
                  <p className="text-green-400 text-sm"><strong>Tip:</strong> {item.tip}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Improvement Tips */}
        <section className="max-w-4xl mx-auto py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
            How to Improve Your Accuracy
          </h2>
          <div className="space-y-4">
            {[
              { icon: Zap, text: 'Slow down until you can type at 95%+ accuracy consistently' },
              { icon: Target, text: 'Focus on your weakest keys using TypeMasterAI heatmaps' },
              { icon: Keyboard, text: 'Use proper finger placement - each finger has its zone' },
              { icon: BarChart, text: 'Track accuracy trends over time, not just WPM' },
              { icon: CheckCircle, text: 'Gradually increase speed while maintaining accuracy' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <item.icon className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span className="text-slate-300 text-sm md:text-base">{item.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto text-center py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Test Your Typing Accuracy
          </h2>
          <p className="text-lg md:text-xl text-slate-300 mb-8">
            Discover your error patterns and get personalized improvement tips
          </p>
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto text-lg px-12 py-6 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
              <Target className="mr-2 h-5 w-5" />
              Start Accuracy Test
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}

