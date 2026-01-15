import { Link } from 'wouter';
import { Keyboard, Zap, Clock, Target, Award, Users, BarChart, CheckCircle, ArrowRight, Globe } from 'lucide-react';
import { useSEO, getBreadcrumbSchema, getFAQSchema, TYPING_KEYWORDS } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { RelatedFeatures, QuickLinksFooter } from '@/components/related-features';
import { AuthPrompt } from '@/components/auth-prompt';
import TypingTest from '@/components/typing-test';

export default function FreeOnlineTypingTestPage() {
  useSEO({
    title: 'Free Online Typing Test | Check Your WPM Speed - TypeMasterAI',
    description: 'Take a free online typing test and measure your typing speed in WPM. No signup required. Get instant results with accuracy tracking, AI analytics, and personalized improvement tips.',
    keywords: TYPING_KEYWORDS.core.primary.join(', ') + ', ' + TYPING_KEYWORDS.core.longTail.slice(0, 5).join(', '),
    canonical: 'https://typemasterai.com/free-online-typing-test',
    ogUrl: 'https://typemasterai.com/free-online-typing-test',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          '@id': 'https://typemasterai.com/free-online-typing-test#app',
          'name': 'TypeMasterAI Free Online Typing Test',
          'description': 'Free online typing speed test with real-time WPM calculation, accuracy tracking, and AI-powered analytics.',
          'applicationCategory': 'EducationalApplication',
          'operatingSystem': 'Any',
          'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'USD',
            'availability': 'https://schema.org/InStock'
          },
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': '4.9',
            'ratingCount': '3247'
          },
          'featureList': [
            'Real-time WPM calculation',
            'Accuracy percentage tracking',
            'Multiple test durations (15s, 30s, 1min, 3min, 5min)',
            'No signup required',
            '23+ language support',
            'AI-powered analytics'
          ]
        },
        getBreadcrumbSchema([
          { name: 'Home', url: 'https://typemasterai.com' },
          { name: 'Free Online Typing Test', url: 'https://typemasterai.com/free-online-typing-test' }
        ]),
        getFAQSchema([
          { question: 'Is this typing test completely free?', answer: 'Yes, TypeMasterAI is 100% free with no hidden costs, no premium tiers, and no signup required. Take unlimited typing tests forever.' },
          { question: 'How accurate is the WPM calculation?', answer: 'We use the industry-standard formula: (characters typed / 5) / minutes. This ensures accurate, comparable results across all typing tests.' },
          { question: 'Do I need to create an account?', answer: 'No account is required to take typing tests. However, creating a free account lets you save your results and track progress over time.' },
          { question: 'What typing test duration should I choose?', answer: '1 minute is the most popular for quick assessments. 3-5 minutes gives more accurate results. Choose based on your time and accuracy needs.' }
        ])
      ]
    }
  });

  const features = [
    { icon: Clock, title: 'Multiple Durations', desc: '15s, 30s, 1min, 3min, or 5min tests' },
    { icon: Target, title: 'Accuracy Tracking', desc: 'Real-time error detection and feedback' },
    { icon: Zap, title: 'Instant Results', desc: 'See your WPM immediately after test' },
    { icon: Globe, title: '23+ Languages', desc: 'Practice in your preferred language' },
    { icon: BarChart, title: 'AI Analytics', desc: 'Personalized improvement insights' },
    { icon: Users, title: 'No Signup Needed', desc: 'Start typing immediately' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 pt-20 pb-16">
        <Breadcrumbs items={[{ label: 'Free Online Typing Test', href: '/free-online-typing-test' }]} />

        {/* Hero Section */}
        <section className="max-w-4xl mx-auto text-center pt-8 sm:pt-12 md:pt-16 pb-6 sm:pb-8">
          <div className="inline-flex items-center justify-center p-2 bg-green-500/10 rounded-full mb-4 sm:mb-6 border border-green-500/30">
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 mr-1.5 sm:mr-2" />
            <span className="text-xs sm:text-sm text-green-300">100% Free Forever</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 px-2">
            Master the Flow
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-3 sm:mb-4 max-w-3xl mx-auto px-2">
            Test your typing speed, track your progress, and compete with others in a distraction-free environment.
          </p>
          <p className="text-sm sm:text-base md:text-lg text-slate-400 mb-6 sm:mb-8 font-medium px-2">
            Join millions of users who have tested their WPM with TypeMasterAI
          </p>
        </section>

        {/* Typing Test Area */}
        <div className="max-w-6xl mx-auto mb-8 sm:mb-12 px-2 sm:px-4">
          <TypingTest />
          <div className="max-w-4xl mx-auto px-2 sm:px-4 mt-6 sm:mt-8">
            <AuthPrompt />
          </div>
        </div>

        {/* Features Grid */}
        <section className="hidden max-w-5xl mx-auto py-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Choose Our Free Typing Test?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <feature.icon className="w-10 h-10 text-cyan-400 mb-2" />
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* What You Get Section */}
        <section className="hidden max-w-4xl mx-auto py-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            What You Get With Every Free Test
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold">Accurate WPM Measurement</h3>
                  <p className="text-slate-400 text-sm">Industry-standard calculation for reliable results</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold">Real-time Error Tracking</h3>
                  <p className="text-slate-400 text-sm">See mistakes as you type with instant feedback</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold">Detailed Analytics</h3>
                  <p className="text-slate-400 text-sm">Keystroke heatmaps and finger usage stats</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold">AI-Powered Insights</h3>
                  <p className="text-slate-400 text-sm">Personalized recommendations to improve faster</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold">Shareable Results</h3>
                  <p className="text-slate-400 text-sm">Share your scores on social media</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold">Typing Certificate</h3>
                  <p className="text-slate-400 text-sm">Get a verified certificate for your resume</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Features */}
        <div className="hidden max-w-5xl mx-auto">
          <RelatedFeatures title="More Typing Tests" features="typingTests" columns={4} />
          <RelatedFeatures title="Learn & Improve" features="learning" columns={4} />
        </div>

        {/* CTA Section */}
        <section className="hidden max-w-3xl mx-auto text-center py-16">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Test Your Typing Speed?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            It only takes 60 seconds to discover your WPM
          </p>
          <Link href="/">
            <Button size="lg" className="text-lg px-12 py-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
              <Keyboard className="mr-2 h-5 w-5" />
              Take Free Typing Test
            </Button>
          </Link>
        </section>

        {/* Quick Links */}
        <div className="hidden max-w-4xl mx-auto border-t border-slate-700 mt-8">
          <QuickLinksFooter exclude={['/free-online-typing-test']} />
        </div>
      </div>
    </div>
  );
}

