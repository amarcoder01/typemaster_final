import { Link } from 'wouter';
import { Briefcase, Users, Keyboard, CheckCircle, ArrowRight, Building2, Stethoscope, Scale, Headphones, FileText, ChevronDown, HelpCircle } from 'lucide-react';
import { useSEO, getBreadcrumbSchema, getFAQSchema } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { AuthPrompt } from "@/components/auth-prompt";
import { useState } from 'react';
import { cn } from '@/lib/utils';

const jobRequirements = [
  { job: 'Data Entry Clerk', wpm: '60-80', accuracy: '98%+', description: 'High-volume numeric and text input' },
  { job: 'Administrative Assistant', wpm: '50-70', accuracy: '95%+', description: 'Correspondence, scheduling, reports' },
  { job: 'Receptionist', wpm: '40-60', accuracy: '95%+', description: 'Messages, scheduling, basic docs' },
  { job: 'Medical Transcriptionist', wpm: '80-100+', accuracy: '99%+', description: 'Medical records, precise terminology' },
  { job: 'Legal Secretary', wpm: '70-90', accuracy: '98%+', description: 'Legal documents, contracts' },
  { job: 'Court Reporter', wpm: '180-225', accuracy: '99.9%+', description: 'Real-time stenography' },
  { job: 'Customer Service Rep', wpm: '40-60', accuracy: '95%+', description: 'Chat support, notes, emails' },
  { job: 'Journalist/Writer', wpm: '60-80', accuracy: '95%+', description: 'Articles, notes, interviews' },
  { job: 'Software Developer', wpm: '40-60', accuracy: '90%+', description: 'Code, documentation, emails' },
  { job: 'Executive Assistant', wpm: '60-80', accuracy: '98%+', description: 'Executive correspondence, minutes' },
];

const PAGE_FAQS = [
  {
    question: "What typing speed is required for most office jobs?",
    answer: "Most office jobs require 40-60 WPM with 95% accuracy. This is sufficient for general correspondence, emails, and basic document creation."
  },
  {
    question: "Do employers actually test typing speed?",
    answer: "Yes, many employers test typing speed during the hiring process, especially for administrative, data entry, and customer service positions. Tests typically measure both WPM and accuracy."
  },
  {
    question: "What is the minimum typing speed for data entry jobs?",
    answer: "Data entry positions typically require 60-80 WPM with 98%+ accuracy. High-volume data entry may require 80+ WPM."
  },
  {
    question: "How can I improve my typing speed for a job?",
    answer: "Practice daily with typing tests, focus on accuracy before speed, learn touch typing, and use TypeMasterAI's AI-powered analytics to identify and fix weaknesses."
  }
];

export default function TypingSpeedRequirementsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useSEO({
    title: 'Typing Speed Requirements by Job | WPM Standards 2025 - TypeMasterAI',
    description: 'Discover typing speed requirements for different jobs and professions. Learn the WPM and accuracy standards for data entry, administrative, medical, legal, and other positions.',
    keywords: 'typing speed requirements, typing speed for jobs, wpm requirements, data entry typing speed, typing test for employment, job typing requirements, professional typing speed, typing speed by profession',
    canonical: 'https://typemasterai.com/typing-speed-requirements',
    ogUrl: 'https://typemasterai.com/typing-speed-requirements',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          'headline': 'Typing Speed Requirements by Job and Profession',
          'description': 'Comprehensive guide to typing speed and accuracy requirements across different professions and industries.',
          'author': { '@type': 'Organization', 'name': 'TypeMasterAI' },
          'publisher': {
            '@type': 'Organization',
            'name': 'TypeMasterAI',
            'logo': { '@type': 'ImageObject', 'url': 'https://typemasterai.com/icon-512x512.png' }
          },
          'datePublished': '2024-06-15',
          'dateModified': '2025-01-06'
        },
        getBreadcrumbSchema([
          { name: 'Home', url: 'https://typemasterai.com' },
          { name: 'Typing Speed Requirements', url: 'https://typemasterai.com/typing-speed-requirements' }
        ]),
        getFAQSchema(PAGE_FAQS)
      ]
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 pt-20 pb-16">
        <Breadcrumbs items={[{ label: 'Typing Speed Requirements', href: '/typing-speed-requirements' }]} />

        {/* Hero Section */}
        <section className="max-w-4xl mx-auto text-center pt-8 sm:pt-12 md:pt-16 pb-8 sm:pb-12 md:pb-16">
          <div className="inline-flex items-center justify-center p-2 bg-blue-500/10 rounded-full mb-4 sm:mb-6 border border-blue-500/30">
            <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 mr-2" />
            <span className="text-xs sm:text-sm text-blue-300">Career Guide</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 px-2">
            Typing Speed <span className="text-blue-400">Requirements</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-3 sm:mb-4 max-w-3xl mx-auto px-2">
            What typing speed do you need for your dream job?
          </p>
          <p className="text-sm sm:text-base md:text-lg text-slate-400 mb-6 sm:mb-8 px-2">
            Discover the WPM and accuracy standards required across different professions
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-4 sm:mb-6 px-2">
            <Link href="/">
              <Button size="lg" className="text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                <Keyboard className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Test Your Speed
              </Button>
            </Link>
            <Link href="/typing-test-jobs">
              <Button size="lg" variant="outline" className="text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 w-full sm:w-auto">
                Job Typing Test
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>
          <AuthPrompt message="save your test results and see where you rank for your career!" />
        </section>

        {/* Requirements Table */}
        <section className="max-w-5xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center mb-6 sm:mb-8 px-2">
            Typing Requirements by Profession
          </h2>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300 text-xs sm:text-sm md:text-base p-3 sm:p-4">Job Title</TableHead>
                  <TableHead className="text-slate-300 text-xs sm:text-sm md:text-base p-3 sm:p-4">Required WPM</TableHead>
                  <TableHead className="text-slate-300 text-xs sm:text-sm md:text-base p-3 sm:p-4">Accuracy</TableHead>
                  <TableHead className="text-slate-300 text-xs sm:text-sm md:text-base p-3 sm:p-4">Typical Tasks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobRequirements.map((job, i) => (
                  <TableRow key={i} className="border-slate-700">
                    <TableCell className="text-white font-medium text-xs sm:text-sm md:text-base p-3 sm:p-4">{job.job}</TableCell>
                    <TableCell className="text-cyan-400 font-bold text-xs sm:text-sm md:text-base p-3 sm:p-4">{job.wpm}</TableCell>
                    <TableCell className="text-green-400 text-xs sm:text-sm md:text-base p-3 sm:p-4">{job.accuracy}</TableCell>
                    <TableCell className="text-slate-400 text-xs sm:text-sm md:text-base p-3 sm:p-4">{job.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Industry Breakdown */}
        <section className="max-w-5xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center mb-6 sm:mb-8 px-2">
            Requirements by Industry
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: Building2, title: 'Corporate/Office', range: '50-70 WPM', desc: 'General business communications' },
              { icon: Stethoscope, title: 'Healthcare', range: '70-100 WPM', desc: 'Medical records, transcription' },
              { icon: Scale, title: 'Legal', range: '70-90 WPM', desc: 'Legal documents, contracts' },
              { icon: Headphones, title: 'Customer Service', range: '40-60 WPM', desc: 'Live chat, ticket handling' },
              { icon: FileText, title: 'Journalism', range: '60-80 WPM', desc: 'Articles, interviews, notes' },
              { icon: Users, title: 'Government', range: '45-65 WPM', desc: 'Administrative paperwork' },
            ].map((item, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700">
                <CardHeader className="p-4 sm:p-6">
                  <item.icon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mb-2" />
                  <CardTitle className="text-white text-base sm:text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <p className="text-xl sm:text-2xl font-bold text-cyan-400 mb-2">{item.range}</p>
                  <p className="text-slate-400 text-xs sm:text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Tips Section */}
        <section className="max-w-4xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center mb-6 sm:mb-8 px-2">
            Meeting Job Typing Requirements
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {[
              'Practice with TypeMasterAI daily for 15-30 minutes',
              'Focus on accuracy first - speed follows naturally',
              'Learn touch typing to eliminate looking at the keyboard',
              'Use the code mode to practice special characters if needed',
              'Get a typing certificate to prove your skills to employers',
              'Track your progress over time with our analytics',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-3 sm:p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300 text-sm sm:text-base">{tip}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="max-w-3xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center mb-6 sm:mb-8 px-2 flex items-center justify-center gap-2">
            <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-3 sm:space-y-4">
            {PAGE_FAQS.map((faq, i) => (
              <div key={i} className="border border-slate-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-3 sm:p-4 text-left flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 transition-colors"
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span className="text-white font-medium text-sm sm:text-base pr-2">{faq.question}</span>
                  <ChevronDown className={cn('w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-transform flex-shrink-0', openFaq === i && 'rotate-180')} />
                </button>
                {openFaq === i && (
                  <div id={`faq-answer-${i}`} className="p-3 sm:p-4 bg-slate-900/50 text-slate-300 text-sm sm:text-base">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto text-center py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4 px-2">
            Are You Job-Ready?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-6 sm:mb-8 px-2">
            Test your typing speed and see if you meet the requirements
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
            <Link href="/">
              <Button size="lg" className="text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 w-full sm:w-auto">
                <Keyboard className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Take Free Typing Test
              </Button>
            </Link>
            <Link href="/typing-certificate">
              <Button size="lg" variant="outline" className="text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 w-full sm:w-auto">
                Get Typing Certificate
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

