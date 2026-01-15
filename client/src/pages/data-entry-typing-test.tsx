import { Link } from 'wouter';
import { Briefcase, Clock, Target, Zap, ArrowRight, HelpCircle, ChevronDown, Keyboard, CheckCircle, Award, FileText } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { AuthorBio } from '@/components/author-bio';
import TypingTest from '@/components/typing-test';
import { AuthPrompt } from "@/components/auth-prompt";
import { useState } from 'react';
import { cn } from '@/lib/utils';

const PAGE_FAQS = [
  {
    question: "What typing speed is required for data entry jobs?",
    answer: "Most data entry positions require 40-60 WPM with 95%+ accuracy. Senior roles and specialized positions may require 70-80+ WPM. Government data entry jobs often require 35-45 WPM as a minimum."
  },
  {
    question: "How is typing speed tested for employment?",
    answer: "Employers typically use 5-minute timed tests with mixed content. They measure net WPM (accounting for errors) and accuracy. Some tests include numbers and special characters."
  },
  {
    question: "Is accuracy or speed more important for data entry?",
    answer: "Accuracy is critical. A 60 WPM typist with 99% accuracy is more valuable than an 80 WPM typist with 90% accuracy. Errors in data entry can cause significant problems."
  },
  {
    question: "What should I practice for a data entry typing test?",
    answer: "Practice typing with numbers, addresses, names, and mixed alphanumeric content. Use 5-minute tests to build stamina. Focus on maintaining accuracy under time pressure."
  },
  {
    question: "Can I use a typing certificate for job applications?",
    answer: "Yes! Many employers accept typing certificates. TypeMasterAI provides verified certificates with unique verification codes that employers can validate online."
  },
  {
    question: "How long should I practice before a typing test?",
    answer: "Practice for at least 2-3 weeks before a job typing test. Take multiple 5-minute tests daily to build stamina. Rest your hands the day before the actual test."
  }
];

const JOB_REQUIREMENTS = [
  { job: "Data Entry Clerk", wpm: "40-55 WPM", accuracy: "95%+", notes: "Entry-level, standard requirement" },
  { job: "Administrative Assistant", wpm: "50-65 WPM", accuracy: "95%+", notes: "Often includes formatting tasks" },
  { job: "Medical Transcriptionist", wpm: "65-80 WPM", accuracy: "98%+", notes: "Technical vocabulary required" },
  { job: "Court Reporter/Stenographer", wpm: "180-225 WPM", accuracy: "99%+", notes: "Specialized equipment" },
  { job: "Government Data Entry", wpm: "35-45 WPM", accuracy: "95%+", notes: "Varies by agency" },
  { job: "Legal Secretary", wpm: "60-75 WPM", accuracy: "97%+", notes: "Legal terminology knowledge" },
];

export default function DataEntryTypingTestPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useSEO({
    title: 'Data Entry Typing Test: Practice for Job Applications | TypeMasterAI',
    description: 'Prepare for data entry job typing tests. Practice with realistic 5-minute tests, learn WPM requirements for different jobs, and get certified results for applications.',
    keywords: 'data entry typing test, typing test for jobs, employment typing test, data entry wpm, typing speed for jobs, job typing test, data entry practice, alphanumeric typing test',
    canonical: 'https://typemasterai.com/data-entry-typing-test',
    ogUrl: 'https://typemasterai.com/data-entry-typing-test',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: 'Data Entry Typing Test',
          description: 'Professional typing test for data entry job preparation',
          applicationCategory: 'EducationalApplication',
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
          { label: 'Typing Tests', href: '/' },
          { label: 'Data Entry Test', href: '/data-entry-typing-test' }
        ]} />

        {/* Hero Section */}
        <header className="text-center pt-8 pb-12">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-6 border border-primary/20">
            <Briefcase className="w-4 h-4 text-primary mr-2" />
            <span className="text-sm text-muted-foreground">Professional Test</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-primary">Data Entry</span> Typing Test
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Prepare for employment typing tests with our job-focused practice. Get certified results that employers can verify.
          </p>
          <AuthPrompt message="save your data entry results and track your speed for job applications!" />
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
                Most data entry jobs require <strong>40-60 WPM</strong> with <strong>95%+ accuracy</strong>.
                Practice with 5-minute tests to build stamina. Focus on accuracy over speed—employers value
                reliable data entry. Get a <strong>typing certificate</strong> for your job applications.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Typing Test Component */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Keyboard className="w-6 h-6 text-primary" />
            Practice Test
          </h2>
          <Card className="bg-card/50 p-4">
            <TypingTest />
          </Card>
          <p className="text-sm text-muted-foreground text-center mt-4">
            Tip: Select 5-minute duration for realistic job test practice
          </p>
        </section>

        {/* Job Requirements Table */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Typing Speed Requirements by Job
          </h2>
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2">Position</th>
                      <th className="text-center py-3 px-2">WPM Required</th>
                      <th className="text-center py-3 px-2">Accuracy</th>
                      <th className="text-left py-3 px-2 hidden md:table-cell">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {JOB_REQUIREMENTS.map((job, index) => (
                      <tr key={index} className="border-b border-border/50">
                        <td className="py-3 px-2 font-medium text-foreground">{job.job}</td>
                        <td className="text-center py-3 px-2 font-mono text-primary">{job.wpm}</td>
                        <td className="text-center py-3 px-2">{job.accuracy}</td>
                        <td className="py-3 px-2 hidden md:table-cell">{job.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Tips for Job Tests */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Tips for Employment Typing Tests
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: Clock, title: "Practice with 5-minute tests", desc: "Most employment tests are 5 minutes. Build stamina." },
              { icon: Target, title: "Prioritize accuracy", desc: "Errors count against you. Slow down if needed." },
              { icon: Keyboard, title: "Practice numbers and symbols", desc: "Data entry often includes alphanumeric content." },
              { icon: CheckCircle, title: "Get certified results", desc: "Download a certificate to include with applications." },
            ].map((tip, index) => {
              const Icon = tip.icon;
              return (
                <Card key={index} className="bg-card/50">
                  <CardContent className="p-4 flex gap-4">
                    <Icon className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">{tip.title}</h3>
                      <p className="text-sm text-muted-foreground">{tip.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Certificate CTA */}
        <section className="mb-12">
          <Card className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Award className="w-16 h-16 text-primary flex-shrink-0" />
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold mb-2">Get a Typing Certificate</h3>
                  <p className="text-muted-foreground mb-4">
                    Complete a typing test and download a verified certificate. Each certificate includes a
                    unique verification code that employers can validate online.
                  </p>
                  <Link href="/typing-certificate">
                    <Button className="gap-2">
                      <Award className="w-4 h-4" />
                      Get Your Certificate
                    </Button>
                  </Link>
                </div>
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

        {/* Related Topics */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Related Topics</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link href="/typing-test-jobs">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="font-semibold mb-1">Typing for Careers</div>
                  <p className="text-sm text-muted-foreground">Job requirements guide</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/5-minute-typing-test">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="font-semibold mb-1">5-Minute Test</div>
                  <p className="text-sm text-muted-foreground">Standard employment test</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/typing-certificate">
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="font-semibold mb-1">Typing Certificate</div>
                  <p className="text-sm text-muted-foreground">Get certified results</p>
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

