import { Link } from 'wouter';
import { BarChart, Users, TrendingUp, Zap, Target, ArrowRight, Brain, Keyboard } from 'lucide-react';
import { useSEO, SEO_CONFIGS, getBreadcrumbSchema, getFAQSchema, TYPING_KEYWORDS } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AuthorBio } from '@/components/author-bio';

export default function AverageTypingSpeed() {
    useSEO({
        ...SEO_CONFIGS.averageTypingSpeed,
        structuredData: {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'Article',
                    headline: 'Average Typing Speed by Age & Profession | Complete 2025 Statistics',
                    image: 'https://typemasterai.com/opengraph.jpg',
                    author: {
                        '@type': 'Organization',
                        name: 'TypeMasterAI',
                        url: 'https://typemasterai.com'
                    },
                    publisher: {
                        '@type': 'Organization',
                        name: 'TypeMasterAI',
                        logo: {
                            '@type': 'ImageObject',
                            url: 'https://typemasterai.com/icon-512x512.png'
                        }
                    },
                    datePublished: '2024-01-15',
                    dateModified: '2025-01-06',
                    description: 'Comprehensive analysis of average typing speeds by age group, profession, and skill level with WPM benchmarks and percentiles.',
                    mainEntityOfPage: {
                        '@type': 'WebPage',
                        '@id': 'https://typemasterai.com/average-typing-speed'
                    }
                },
                getBreadcrumbSchema([
                    { name: 'Home', url: 'https://typemasterai.com' },
                    { name: 'Average Typing Speed', url: 'https://typemasterai.com/average-typing-speed' }
                ]),
                getFAQSchema([
                    { question: 'What is the average typing speed?', answer: 'The global average typing speed is approximately 40-41 WPM (Words Per Minute) with 92% accuracy. However, this varies significantly by age, profession, and experience level.' },
                    { question: 'What is a good typing speed for a job?', answer: 'Most office jobs require 40-50 WPM minimum. Data entry positions typically require 60-80 WPM, while transcriptionists need 80-100+ WPM. Administrative roles usually expect 50-65 WPM.' },
                    { question: 'What is the average typing speed by age?', answer: 'Children (8-12): 15-25 WPM, Teens (13-17): 30-45 WPM, Young Adults (18-25): 40-60 WPM, Adults (26-45): 45-65 WPM, Seniors (60+): 30-45 WPM.' },
                    { question: 'Is 60 WPM a good typing speed?', answer: 'Yes, 60 WPM is above average and considered good for most jobs. It puts you in the top 40% of typists and exceeds requirements for most office and administrative positions.' },
                ])
            ]
        }
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Hero Section */}
            <section className="container mx-auto px-4 pt-12 sm:pt-16 md:pt-24 pb-8 sm:pb-12 md:pb-16">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center p-2 bg-slate-800/50 rounded-full mb-4 sm:mb-6 border border-slate-700">
                        <BarChart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 mr-1.5 sm:mr-2" />
                        <span className="text-xs sm:text-sm text-slate-300">Global Typing Statistics 2026</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 px-2">
                        What is the Average <span className="text-cyan-400">Typing Speed</span>?
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-300 mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
                        The global average typing speed is <strong className="text-white">41 WPM</strong> (Words Per Minute) with <strong className="text-white">92% accuracy</strong>. How do you stack up against the rest of the world?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12">
                        <Link href="/">
                            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 shadow-lg shadow-cyan-500/20 w-full sm:w-auto" data-testid="button-test-speed-hero">
                                <Zap className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                Test My Speed Now
                            </Button>
                        </Link>
                        <Link href="/leaderboard">
                            <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 w-full sm:w-auto" data-testid="button-view-stats">
                                View Global Stats
                                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Speed Levels Section */}
            <section className="container mx-auto px-4 py-8 sm:py-12">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                        <Card className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors">
                            <CardHeader className="p-4 sm:p-6">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                                </div>
                                <CardTitle className="text-white text-base sm:text-lg">Beginner</CardTitle>
                                <CardDescription className="text-xl sm:text-2xl font-bold text-blue-400">0 - 30 WPM</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 pt-0">
                                <p className="text-sm sm:text-base text-slate-400">
                                    Just starting out with touch typing. At this stage, you're likely "hunting and pecking" for keys. Focus on accuracy over speed.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-colors relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 sm:p-3 bg-cyan-500/10 rounded-bl-xl border-b border-l border-cyan-500/20">
                                <span className="text-[10px] sm:text-xs font-bold text-cyan-400 uppercase">Average</span>
                            </div>
                            <CardHeader className="p-4 sm:p-6">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                                    <Keyboard className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
                                </div>
                                <CardTitle className="text-white text-base sm:text-lg">Intermediate</CardTitle>
                                <CardDescription className="text-xl sm:text-2xl font-bold text-cyan-400">30 - 60 WPM</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 pt-0">
                                <p className="text-sm sm:text-base text-slate-400">
                                    The most common speed range. You can type without looking at the keyboard most of the time, but may slow down for symbols or numbers.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700 hover:border-purple-500/50 transition-colors sm:col-span-2 md:col-span-1">
                            <CardHeader className="p-4 sm:p-6">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                                    <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
                                </div>
                                <CardTitle className="text-white text-base sm:text-lg">Pro / Expert</CardTitle>
                                <CardDescription className="text-xl sm:text-2xl font-bold text-purple-400">60 - 100+ WPM</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6 pt-0">
                                <p className="text-sm sm:text-base text-slate-400">
                                    Professional speed. You utilize all 10 fingers efficiently with high accuracy. Essential for programmers, writers, and transcriptionists.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Main Content & Data */}
            <section className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto">

                    <div className="prose prose-invert prose-lg max-w-none mb-16">
                        <h2 className="text-3xl font-bold text-white mb-6">Detailed WPM Breakdowns</h2>
                        <p className="text-slate-300 leading-relaxed mb-8">
                            Typing speed isn't a one-size-fits-all metric. It varies significantly based on age, profession, and the purpose of typing. Here’s a deeper look into the data.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                        {/* By Age Group Table */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <TrendingUp className="w-5 h-5 text-green-400 mr-2" />
                                Average WPM by Age Group
                            </h3>
                            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-slate-800/50 border-slate-800">
                                            <TableHead className="text-slate-400">Age Range</TableHead>
                                            <TableHead className="text-right text-slate-400">Avg Speed (WPM)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {[
                                            { age: "13-18 (Teens)", wpm: "55 WPM" },
                                            { age: "19-25 (Young Adults)", wpm: "52 WPM" },
                                            { age: "26-35 (Adults)", wpm: "45 WPM" },
                                            { age: "36-45 (Adults)", wpm: "38 WPM" },
                                            { age: "46-55", wpm: "32 WPM" },
                                            { age: "55+", wpm: "26 WPM" },
                                        ].map((row) => (
                                            <TableRow key={row.age} className="hover:bg-slate-800/30 border-slate-800">
                                                <TableCell className="font-medium text-slate-200">{row.age}</TableCell>
                                                <TableCell className="text-right text-cyan-400">{row.wpm}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <p className="text-sm text-slate-500 mt-2 italic">
                                * Based on data from over 10 million typing tests.
                            </p>
                        </div>

                        {/* By Profession Table */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <Target className="w-5 h-5 text-red-400 mr-2" />
                                Benchmarks by Job Role
                            </h3>
                            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-slate-800/50 border-slate-800">
                                            <TableHead className="text-slate-400">Job Role</TableHead>
                                            <TableHead className="text-right text-slate-400">Target WPM</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {[
                                            { role: "Executive Assistant", wpm: "60-70 WPM" },
                                            { role: "Software Developer", wpm: "50-60 WPM" },
                                            { role: "Data Entry Clerk", wpm: "60-80 WPM" },
                                            { role: "Transcriptionist", wpm: "75-100 WPM" },
                                            { role: "Paramedic / 911 Dispatch", wpm: "40-50 WPM" },
                                            { role: "Customer Support", wpm: "40-60 WPM" },
                                        ].map((row) => (
                                            <TableRow key={row.role} className="hover:bg-slate-800/30 border-slate-800">
                                                <TableCell className="font-medium text-slate-200">{row.role}</TableCell>
                                                <TableCell className="text-right text-cyan-400">{row.wpm}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 sm:mt-12 md:mt-16 prose prose-invert prose-sm sm:prose-base md:prose-lg max-w-none">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6">How to Increase Your Average Speed</h2>
                        <div className="bg-slate-800/30 rounded-xl p-4 sm:p-6 md:p-8 border border-slate-700">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                                <div>
                                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-cyan-400 mb-1.5 sm:mb-2">1. Master Touch Typing</h3>
                                    <p className="text-sm sm:text-base text-slate-300">
                                        Stop looking at the keyboard. Train your fingers to know exactly where each key is. This muscle memory is the only way to break past 50 WPM.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-cyan-400 mb-1.5 sm:mb-2">2. Prioritize Accuracy</h3>
                                    <p className="text-sm sm:text-base text-slate-300">
                                        Speed comes from confidence. If you constantly backspace, your WPM plummets. Aim for 98% accuracy, and speed will follow naturally.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-cyan-400 mb-1.5 sm:mb-2">3. Consistency is Key</h3>
                                    <p className="text-sm sm:text-base text-slate-300">
                                        Practice for 10-15 minutes every day. Burst practice is less effective than daily, consistent reinforcement of neural pathways.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-cyan-400 mb-1.5 sm:mb-2">4. Use Proper Posture</h3>
                                    <p className="text-sm sm:text-base text-slate-300">
                                        Sit straight, keep your wrists elevated (not resting heavily), and ensure your elbows are at a 90-degree angle to reduce fatigue.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <AuthorBio />

                </div>
            </section>

            {/* CTA Section */}
            <section className="container mx-auto px-4 py-8 sm:py-12 md:py-16 border-t border-slate-800">
                <div className="max-w-4xl mx-auto text-center">
                    <Brain className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-cyan-400 mx-auto mb-4 sm:mb-6" />
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-2">
                        Ready to Beat the Average?
                    </h2>
                    <p className="text-sm sm:text-base md:text-xl text-slate-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
                        Take our free, advanced typing test now to get your certified WPM score and detailed performance analytics.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                        <Link href="/">
                            <Button size="lg" className="bg-cyan-500 hover:bg-cyan-600 text-white text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-6 rounded-full shadow-lg shadow-cyan-500/20 w-full sm:w-auto" data-testid="button-cta-bottom">
                                Start Typing Test
                            </Button>
                        </Link>
                        <Link href="/learn">
                            <Button size="lg" variant="ghost" className="text-slate-300 hover:text-white text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 w-full sm:w-auto" data-testid="button-learn-more">
                                Learn Touch Typing
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
