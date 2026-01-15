import { Link } from 'wouter';
import { GraduationCap, Keyboard, BookOpen, Trophy, Clock, Target, CheckCircle, ArrowRight, Star, Users } from 'lucide-react';
import { useSEO, getBreadcrumbSchema, getFAQSchema } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';

export default function StudentTypingTestPage() {
  useSEO({
    title: 'Student Typing Test | Free for Schools & Students - TypeMasterAI',
    description: 'Free typing test designed for students and schools. Age-appropriate content, progress tracking, and certificates. Perfect for elementary, middle, and high school typing practice.',
    keywords: 'student typing test, typing test for students, school typing test, typing practice for students, educational typing test, classroom typing, student wpm test, typing for schools, typing test for kids, middle school typing',
    canonical: 'https://typemasterai.com/student-typing-test',
    ogUrl: 'https://typemasterai.com/student-typing-test',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          'name': 'TypeMasterAI Student Typing Test',
          'description': 'Educational typing test platform for students and schools with age-appropriate content.',
          'applicationCategory': 'EducationalApplication',
          'audience': {
            '@type': 'EducationalAudience',
            'educationalRole': 'student'
          },
          'operatingSystem': 'Web Browser',
          'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' }
        },
        getBreadcrumbSchema([
          { name: 'Home', url: 'https://typemasterai.com' },
          { name: 'Student Typing Test', url: 'https://typemasterai.com/student-typing-test' }
        ]),
        getFAQSchema([
          { question: 'Is this typing test suitable for all students?', answer: 'Yes, TypeMasterAI is designed for students of all ages, from elementary to college. Content is age-appropriate and educational.' },
          { question: 'Can teachers track student progress?', answer: 'Students can create free accounts to track their own progress. Contact us for classroom solutions with teacher dashboards.' },
          { question: 'What typing speed should students aim for?', answer: 'Elementary (Grades 3-5): 15-25 WPM, Middle School (Grades 6-8): 25-40 WPM, High School (Grades 9-12): 40-60 WPM.' },
          { question: 'Is this compliant with school internet policies?', answer: 'TypeMasterAI is ad-free, requires no downloads, and uses HTTPS encryption. It\'s safe for school networks.' }
        ])
      ]
    }
  });

  const gradeStandards = [
    { grade: 'Grades 3-5', wpm: '15-25', accuracy: '90%+', desc: 'Learning fundamentals' },
    { grade: 'Grades 6-8', wpm: '25-40', accuracy: '93%+', desc: 'Building proficiency' },
    { grade: 'Grades 9-12', wpm: '40-60', accuracy: '95%+', desc: 'Professional preparation' },
    { grade: 'College', wpm: '50-70', accuracy: '97%+', desc: 'Career-ready skills' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 pt-20 pb-16">
        <Breadcrumbs items={[{ label: 'Student Typing Test', href: '/student-typing-test' }]} />

        {/* Hero Section */}
        <section className="max-w-4xl mx-auto text-center pt-8 sm:pt-12 md:pt-16 pb-8 sm:pb-12 md:pb-16">
          <div className="inline-flex items-center justify-center p-2 bg-blue-500/10 rounded-full mb-4 sm:mb-6 border border-blue-500/30">
            <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 mr-2" />
            <span className="text-xs sm:text-sm text-blue-300">100% Free for Students</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 px-2">
            Student <span className="text-blue-400">Typing Test</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-3 sm:mb-4 max-w-3xl mx-auto px-2">
            The perfect typing practice platform for students and classrooms
          </p>
          <p className="text-sm sm:text-base md:text-lg text-slate-400 mb-6 sm:mb-8 px-2">
            Age-appropriate content • Progress tracking • Free certificates
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
            <Link href="/">
              <Button size="lg" className="text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                <Keyboard className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Start Typing Test
              </Button>
            </Link>
            <Link href="/learn">
              <Button size="lg" variant="outline" className="text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 w-full sm:w-auto">
                Learn Touch Typing
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Grade Level Standards */}
        <section className="max-w-4xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center mb-6 sm:mb-8 px-2">
            Typing Standards by Grade Level
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {gradeStandards.map((item, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700 text-center">
                <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                  <p className="text-sm sm:text-base md:text-lg font-bold text-blue-400">{item.grade}</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white mt-1 sm:mt-2">{item.wpm}</p>
                  <p className="text-xs sm:text-sm text-slate-400">WPM</p>
                  <p className="text-green-400 mt-1 sm:mt-2 text-xs sm:text-sm">{item.accuracy}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Features for Students */}
        <section className="max-w-5xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center mb-8 sm:mb-12 px-2">
            Why Students Love TypeMasterAI
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: BookOpen, title: 'Age-Appropriate Content', desc: 'Educational paragraphs suitable for all ages' },
              { icon: Trophy, title: 'Achievements & Badges', desc: 'Earn rewards for reaching milestones' },
              { icon: Target, title: 'Progress Tracking', desc: 'Watch your WPM improve over time' },
              { icon: Users, title: 'Compete with Friends', desc: 'Multiplayer races and leaderboards' },
              { icon: Star, title: 'Fun Practice', desc: 'Engaging exercises that don\'t feel like homework' },
              { icon: Clock, title: 'Quick Sessions', desc: '15-second to 5-minute test options' },
            ].map((feature, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700">
                <CardHeader className="p-4 sm:p-6">
                  <feature.icon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400 mb-2" />
                  <CardTitle className="text-white text-base sm:text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <p className="text-slate-400 text-sm sm:text-base">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* For Teachers Section */}
        <section className="max-w-4xl mx-auto py-8 sm:py-12 md:py-16">
          <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500/30">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
                <div className="flex-1 w-full md:w-auto">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                    For Teachers & Schools
                  </h2>
                  <ul className="space-y-2 sm:space-y-3">
                    {[
                      'No ads or distractions',
                      'Safe for school networks',
                      'Works on Chromebooks and tablets',
                      'Students can track their own progress',
                      'Print certificates for classroom display',
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-300 text-sm sm:text-base">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-center w-full md:w-auto">
                  <p className="text-3xl sm:text-4xl font-bold text-white mb-2">100%</p>
                  <p className="text-blue-400 text-sm sm:text-base">Free Forever</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Skills Students Learn */}
        <section className="max-w-4xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center mb-6 sm:mb-8 px-2">
            Skills Students Develop
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {[
              { title: 'Touch Typing', desc: 'Type without looking at the keyboard' },
              { title: 'Finger Placement', desc: 'Proper home row technique' },
              { title: 'Speed & Accuracy', desc: 'Balance between fast and correct typing' },
              { title: 'Focus & Concentration', desc: 'Improved attention span through practice' },
              { title: 'Digital Literacy', desc: 'Essential computer skills for the future' },
              { title: 'Confidence', desc: 'Pride in measurable improvement' },
            ].map((skill, i) => (
              <div key={i} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 flex-shrink-0 mt-0.5 sm:mt-1" />
                <div>
                  <h3 className="text-white font-semibold text-sm sm:text-base">{skill.title}</h3>
                  <p className="text-slate-400 text-xs sm:text-sm">{skill.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto text-center py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4 px-2">
            Start Building Typing Skills Today
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-6 sm:mb-8 px-2">
            Join thousands of students improving their typing every day
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
            <Link href="/">
              <Button size="lg" className="text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 w-full sm:w-auto">
                <Keyboard className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Start Free Typing Test
              </Button>
            </Link>
            <Link href="/typing-test-for-kids">
              <Button size="lg" variant="outline" className="text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 w-full sm:w-auto">
                Kids Typing Test
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

