import { Link } from 'wouter';
import { Award, Shield, Download, CheckCircle, Share2, FileCheck, ArrowRight, Star } from 'lucide-react';
import { useSEO, SEO_CONFIGS, getSoftwareAppSchema } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';

export default function TypingCertificatePage() {
  useSEO({
    ...SEO_CONFIGS.typingCertificate,
    structuredData: getSoftwareAppSchema(
      'TypeMasterAI Typing Certificate',
      'Earn verified typing speed certificates with your WPM and accuracy scores',
      ['Verified certificates', 'QR code verification', 'PDF download', 'Shareable links', 'Professional format']
    ),
  });

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pt-20 pb-16">
        <Breadcrumbs items={[{ label: 'Typing Certificate', href: '/typing-certificate' }]} />
        
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto text-center pt-8 sm:pt-12 md:pt-16 pb-8 sm:pb-12 md:pb-16">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 mb-4 sm:mb-6">
            Typing Speed Certificate
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-3 sm:mb-4 px-2">
            Earn verified certificates for your typing achievements
          </p>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground/80 mb-6 sm:mb-8 px-2">
            Professional certificates with QR verification for jobs, schools, and personal records
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/">
              <Button size="lg" className="text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 w-full sm:w-auto">
                <Award className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Take Test & Earn Certificate
              </Button>
            </Link>
            <Link href="/verify">
              <Button size="lg" variant="outline" className="text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 w-full sm:w-auto">
                Verify a Certificate
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Certificate Features */}
        <section className="max-w-6xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 sm:mb-12">
            Certificate Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <Shield className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Verified & Authentic</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                Each certificate has a unique verification ID and QR code that anyone can use to verify authenticity.
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <Download className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Downloadable PDF</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                Download your certificate as a high-quality PDF. Print it or attach it to job applications.
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <Share2 className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Shareable Link</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                Get a unique verification link to share with employers, teachers, or on social media.
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <FileCheck className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Professional Format</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                Clean, professional design suitable for official use. Includes your name, WPM, accuracy, and date.
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <CheckCircle className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Anti-Cheat Protected</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                Our tests use anti-cheat measures to ensure your certificate reflects genuine typing ability.
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <Star className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Multiple Levels</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 text-sm sm:text-base text-muted-foreground">
                Earn Bronze (40+ WPM), Silver (60+ WPM), Gold (80+ WPM), or Platinum (100+ WPM) certificates.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How to Earn */}
        <section className="max-w-4xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 sm:mb-12">
            How to Earn Your Certificate
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-lg sm:text-xl font-bold mx-auto mb-3 sm:mb-4">
                1
              </div>
              <h3 className="font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base">Take a Typing Test</h3>
              <p className="text-muted-foreground text-xs sm:text-sm px-2">
                Complete a 1-minute or longer typing test to measure your speed and accuracy.
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-lg sm:text-xl font-bold mx-auto mb-3 sm:mb-4">
                2
              </div>
              <h3 className="font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base">Meet Requirements</h3>
              <p className="text-muted-foreground text-xs sm:text-sm px-2">
                Achieve at least 40 WPM with 90%+ accuracy to qualify for a certificate.
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-lg sm:text-xl font-bold mx-auto mb-3 sm:mb-4">
                3
              </div>
              <h3 className="font-semibold mb-1.5 sm:mb-2 text-sm sm:text-base">Download & Share</h3>
              <p className="text-muted-foreground text-xs sm:text-sm px-2">
                Generate your certificate, download the PDF, and share it anywhere.
              </p>
            </div>
          </div>
        </section>

        {/* Certificate Levels */}
        <section className="max-w-4xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8 sm:mb-12">
            Certificate Levels
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="bg-gradient-to-br from-amber-900/30 to-amber-800/10 border-amber-600/50">
              <CardHeader className="text-center pb-2 p-3 sm:p-4">
                <Award className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-amber-600 mx-auto mb-1.5 sm:mb-2" />
                <CardTitle className="text-amber-500 text-sm sm:text-base">Bronze</CardTitle>
                <CardDescription className="text-xs sm:text-sm">40-59 WPM</CardDescription>
              </CardHeader>
              <CardContent className="text-center text-xs sm:text-sm text-muted-foreground p-3 sm:p-4 pt-0">
                Good typing speed
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-400/30 to-gray-300/10 border-gray-400/50">
              <CardHeader className="text-center pb-2 p-3 sm:p-4">
                <Award className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-400 mx-auto mb-1.5 sm:mb-2" />
                <CardTitle className="text-gray-300 text-sm sm:text-base">Silver</CardTitle>
                <CardDescription className="text-xs sm:text-sm">60-79 WPM</CardDescription>
              </CardHeader>
              <CardContent className="text-center text-xs sm:text-sm text-muted-foreground p-3 sm:p-4 pt-0">
                Above average speed
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/30 to-yellow-400/10 border-yellow-500/50">
              <CardHeader className="text-center pb-2 p-3 sm:p-4">
                <Award className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-yellow-500 mx-auto mb-1.5 sm:mb-2" />
                <CardTitle className="text-yellow-400 text-sm sm:text-base">Gold</CardTitle>
                <CardDescription className="text-xs sm:text-sm">80-99 WPM</CardDescription>
              </CardHeader>
              <CardContent className="text-center text-xs sm:text-sm text-muted-foreground p-3 sm:p-4 pt-0">
                Professional level
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-500/30 to-cyan-400/10 border-cyan-500/50">
              <CardHeader className="text-center pb-2 p-3 sm:p-4">
                <Award className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-cyan-400 mx-auto mb-1.5 sm:mb-2" />
                <CardTitle className="text-cyan-300 text-sm sm:text-base">Platinum</CardTitle>
                <CardDescription className="text-xs sm:text-sm">100+ WPM</CardDescription>
              </CardHeader>
              <CardContent className="text-center text-xs sm:text-sm text-muted-foreground p-3 sm:p-4 pt-0">
                Expert typist
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SEO Content */}
        <section className="max-w-4xl mx-auto py-8 sm:py-12 md:py-16">
          <article className="prose prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none">
            <h2>Why Get a Typing Certificate?</h2>
            <p>
              A <strong>typing speed certificate</strong> is valuable proof of your keyboard proficiency. Here's why you might need one:
            </p>

            <h3>For Job Applications</h3>
            <p>
              Many employers require typing speed verification for data entry, administrative, and customer service positions. Our certificates provide verifiable proof of your typing ability.
            </p>

            <h3>For School & Education</h3>
            <p>
              Students often need to demonstrate typing proficiency for computer classes, exams, or scholarship applications.
            </p>

            <h3>For Personal Achievement</h3>
            <p>
              Track your progress and celebrate milestones as you improve from Bronze to Platinum level.
            </p>

            <h3>Certificate Verification</h3>
            <p>
              Anyone can verify your certificate's authenticity using the unique verification ID or QR code. This prevents fraud and ensures your certificate is trusted.
            </p>
          </article>
        </section>

        {/* CTA */}
        <section className="max-w-2xl mx-auto text-center py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Ready to Earn Your Certificate?</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 px-2">
            Take a typing test now and earn your verified certificate in minutes.
          </p>
          <Link href="/">
            <Button size="lg" className="text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-6 w-full sm:w-auto">
              <Award className="mr-2 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              Start Typing Test
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}

