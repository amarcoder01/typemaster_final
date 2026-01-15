import { Link } from 'wouter';
import { Briefcase, Keyboard, Award, Clock, Target, CheckCircle, ArrowRight, FileText, Shield, BarChart } from 'lucide-react';
import { useSEO, getBreadcrumbSchema, getFAQSchema } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';

export default function ProfessionalTypingTestPage() {
  useSEO({
    title: 'Professional Typing Test | Employment-Ready Assessment - TypeMasterAI',
    description: 'Take a professional typing test designed for job applications. Get a verified typing certificate with WPM and accuracy scores. Accepted by employers worldwide.',
    keywords: 'professional typing test, employment typing test, job typing test, business typing test, typing test for work, professional wpm test, typing assessment, typing certification, workplace typing test',
    canonical: 'https://typemasterai.com/professional-typing-test',
    ogUrl: 'https://typemasterai.com/professional-typing-test',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          'name': 'TypeMasterAI Professional Typing Test',
          'description': 'Professional-grade typing assessment with verified certificates for employment applications.',
          'applicationCategory': 'BusinessApplication',
          'operatingSystem': 'Web Browser',
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
        },
        getBreadcrumbSchema([
          { name: 'Home', url: 'https://typemasterai.com' },
          { name: 'Professional Typing Test', url: 'https://typemasterai.com/professional-typing-test' }
        ]),
        getFAQSchema([
          { question: 'Is this typing test accepted by employers?', answer: 'Yes, TypeMasterAI certificates include verification codes that employers can use to confirm your results. Many companies accept our certificates for job applications.' },
          { question: 'How long is the professional typing test?', answer: 'The standard professional assessment is 5 minutes, which provides the most accurate measure of sustained typing ability. You can also take 3-minute tests.' },
          { question: 'What typing speed do I need for a professional job?', answer: 'Most office jobs require 50-70 WPM. Data entry positions often require 60-80 WPM. Administrative roles typically need 50-65 WPM with 95%+ accuracy.' },
          { question: 'Can I retake the test if I\'m not satisfied?', answer: 'Yes, you can take unlimited tests. Only share the certificate from your best attempt with employers.' }
        ])
      ]
    }
  });

  const features = [
    { icon: Clock, title: '5-Minute Assessment', desc: 'Industry-standard duration for accurate results' },
    { icon: Target, title: '98%+ Accuracy Standard', desc: 'Professional-grade precision requirements' },
    { icon: Award, title: 'Verified Certificate', desc: 'Shareable proof for job applications' },
    { icon: Shield, title: 'Anti-Cheat Protection', desc: 'Verified results employers can trust' },
    { icon: FileText, title: 'Business Content', desc: 'Professional vocabulary and formatting' },
    { icon: BarChart, title: 'Detailed Report', desc: 'Comprehensive performance breakdown' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 pt-16 md:pt-20 pb-12 md:pb-16">
        <Breadcrumbs items={[{ label: 'Professional Typing Test', href: '/professional-typing-test' }]} />

        {/* Hero Section */}
        <section className="max-w-4xl mx-auto text-center pt-8 pb-12 md:pb-16">
          <div className="inline-flex items-center justify-center p-2 bg-amber-500/10 rounded-full mb-6 border border-amber-500/30">
            <Briefcase className="w-4 h-4 text-amber-400 mr-2" />
            <span className="text-sm text-amber-300">Employment Ready</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Professional <span className="text-amber-400">Typing Test</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-4 max-w-3xl mx-auto">
            Employment-grade typing assessment with verified certification
          </p>
          <p className="text-base md:text-lg text-slate-400 mb-8">
            Prove your typing skills to employers with a trusted certificate
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-amber-600 hover:bg-amber-700">
                <Keyboard className="mr-2 h-5 w-5" />
                Start Professional Test
              </Button>
            </Link>
            <Link href="/typing-certificate">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6">
                Get Certificate
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-5xl mx-auto py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12">
            Professional Assessment Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <feature.icon className="w-10 h-10 text-amber-400 mb-2" />
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Why Professional Test */}
        <section className="max-w-4xl mx-auto py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
            Why Take a Professional Typing Test?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">For Job Seekers</h3>
              {[
                'Stand out with verified typing credentials',
                'Prove your skills before the interview',
                'Meet job requirements with confidence',
                'Add to your resume and LinkedIn',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-slate-300">{item}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">For Employers</h3>
              {[
                'Verify candidate skills before hiring',
                'Ensure job requirement compliance',
                'Reduce training time and costs',
                'Trust verified, anti-cheat results',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span className="text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Test Standards */}
        <section className="max-w-4xl mx-auto py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
            Professional Test Standards
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="bg-amber-900/20 border-amber-500/30 text-center">
              <CardContent className="pt-6">
                <p className="text-4xl font-bold text-amber-400">5 min</p>
                <p className="text-slate-300 mt-2">Test Duration</p>
                <p className="text-slate-500 text-sm mt-1">Standard assessment length</p>
              </CardContent>
            </Card>
            <Card className="bg-green-900/20 border-green-500/30 text-center">
              <CardContent className="pt-6">
                <p className="text-4xl font-bold text-green-400">95%+</p>
                <p className="text-slate-300 mt-2">Accuracy Required</p>
                <p className="text-slate-500 text-sm mt-1">Professional standard</p>
              </CardContent>
            </Card>
            <Card className="bg-cyan-900/20 border-cyan-500/30 text-center">
              <CardContent className="pt-6">
                <p className="text-4xl font-bold text-cyan-400">50+</p>
                <p className="text-slate-300 mt-2">Minimum WPM</p>
                <p className="text-slate-500 text-sm mt-1">For certification</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto text-center py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready for Your Professional Assessment?
          </h2>
          <p className="text-lg md:text-xl text-slate-300 mb-8">
            Take the test and get your verified certificate today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
                <Keyboard className="mr-2 h-5 w-5" />
                Start Professional Test
              </Button>
            </Link>
            <Link href="/typing-speed-requirements">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6">
                View Job Requirements
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

