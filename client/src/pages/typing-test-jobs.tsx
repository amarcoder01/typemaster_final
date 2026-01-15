import { Link } from 'wouter';
import { Briefcase, DollarSign, TrendingUp, CheckCircle, Keyboard, Building2, GraduationCap } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { AuthorBio } from '@/components/author-bio';
import { AuthPrompt } from "@/components/auth-prompt";

export default function TypingTestJobsPage() {
    useSEO({
        title: 'Typing Speed Requirements for Jobs | WPM Careers 2026 - TypeMasterAI',
        description: 'Which jobs require fast typing? Discover the WPM requirements for data entry, transcription, administrative roles, and more. Practice for your employment typing test.',
        keywords: 'typing jobs, data entry wpm requirements, transcription typing speed, administrative assistant typing test, typing speed for jobs, employment typing test',
        canonical: 'https://typemasterai.com/typing-test-jobs',
        ogUrl: 'https://typemasterai.com/typing-test-jobs',
        structuredData: {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: 'Typing Speed Requirements for Top Careers',
            description: 'Comprehensive guide to WPM requirements for various professions including data entry, medical transcription, and legal support.',
            image: 'https://typemasterai.com/opengraph.jpg',
            author: {
                '@type': 'Organization',
                name: 'TypeMasterAI'
            }
        }
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="container mx-auto px-4 pt-20 pb-16">
                <Breadcrumbs items={[{ label: 'Typing Jobs', href: '/typing-test-jobs' }]} />

                {/* Hero Section */}
                <section className="max-w-4xl mx-auto text-center pt-8 pb-16">
                    <div className="inline-flex items-center justify-center p-2 bg-slate-800/50 rounded-full mb-6 border border-slate-700">
                        <Briefcase className="w-4 h-4 text-cyan-400 mr-2" />
                        <span className="text-sm text-slate-300">Career Guide 2026</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                        Typing Speed Requirements <span className="text-cyan-400">by Career</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
                        Is your typing speed holding your career back? See the WPM benchmarks for top paying jobs and how to reach them.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                        <Link href="/5-minute-typing-test">
                            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-lg px-8 py-6 shadow-lg shadow-cyan-500/20" data-testid="button-job-test-hero">
                                Take Deployment Test
                            </Button>
                        </Link>
                    </div>
                    <AuthPrompt message="save your career test results and build your professional profile!" />
                </section>

                {/* AI Answer Section */}
                <section className="max-w-4xl mx-auto mb-16">
                    <div className="bg-slate-800/50 border border-cyan-500/30 rounded-xl p-6 shadow-lg shadow-cyan-900/10">
                        <div className="flex items-center gap-2 mb-4">
                            <Briefcase className="w-6 h-6 text-cyan-400" />
                            <h2 className="text-xl font-bold text-white m-0">Quick Answer: Job WPM Requirements</h2>
                        </div>
                        <p className="text-slate-300 text-lg leading-relaxed mb-4">
                            Most administrative jobs require <strong>40-50 WPM</strong>. Data entry roles usually demand <strong>60+ WPM</strong>, while transcription and legal jobs often require <strong>80-90+ WPM</strong> with high accuracy.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-slate-700 rounded-full text-sm text-white">Data Entry: 60+ WPM</span>
                            <span className="px-3 py-1 bg-slate-700 rounded-full text-sm text-white">Receptionist: 45+ WPM</span>
                            <span className="px-3 py-1 bg-slate-700 rounded-full text-sm text-white">Legal Secretary: 70+ WPM</span>
                            <span className="px-3 py-1 bg-slate-700 rounded-full text-sm text-white">Medical Scribe: 80+ WPM</span>
                        </div>
                    </div>
                </section>

                {/* Job Table Section */}
                <section className="max-w-6xl mx-auto py-8">
                    <h2 className="text-3xl font-bold text-white mb-8 text-center">Detailed Career Benchmarks</h2>
                    <div className="grid lg:grid-cols-3 gap-8">

                        {/* Table Column */}
                        <div className="lg:col-span-2">
                            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-800 hover:bg-slate-800">
                                            <TableHead className="text-slate-300 font-semibold">Job Title</TableHead>
                                            <TableHead className="text-slate-300 font-semibold">Min WPM</TableHead>
                                            <TableHead className="text-slate-300 font-semibold">Accuracy</TableHead>
                                            <TableHead className="text-slate-300 font-semibold">Salary Impact</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {[
                                            { role: 'Court Reporter / Stenographer', wpm: '225+', acc: '99.9%', impact: 'High' },
                                            { role: 'Real-Time Captioner', wpm: '180+', acc: '98%', impact: 'High' },
                                            { role: 'Medical Transcriptionist', wpm: '70-90', acc: '98%', impact: 'Med-High' },
                                            { role: 'Legal Secretary', wpm: '60-80', acc: '95%', impact: 'Med' },
                                            { role: 'Data Entry Clerk', wpm: '60-80', acc: '98%', impact: 'Med' },
                                            { role: 'Executive Assistant', wpm: '60+', acc: '95%', impact: 'Med' },
                                            { role: 'Software Developer', wpm: '50-60', acc: '90%', impact: 'Low' },
                                            { role: 'Customer Support Agent', wpm: '40-60', acc: '90%', impact: 'Med' },
                                            { role: 'Receptionist', wpm: '40+', acc: '90%', impact: 'Low' },
                                        ].map((job) => (
                                            <TableRow key={job.role} className="hover:bg-slate-800/30 border-slate-800">
                                                <TableCell className="font-medium text-white">{job.role}</TableCell>
                                                <TableCell className="text-cyan-400 font-bold">{job.wpm}</TableCell>
                                                <TableCell className="text-slate-300">{job.acc}</TableCell>
                                                <TableCell className="text-slate-300">{job.impact}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* Sidebar Stats */}
                        <div className="space-y-6">
                            <Card className="bg-slate-800/50 border-slate-700">
                                <CardHeader>
                                    <DollarSign className="w-8 h-8 text-green-400 mb-2" />
                                    <CardTitle className="text-white">Productivity Value</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-400 text-sm">
                                        Improving from 40 to 80 WPM saves <strong>20 days</strong> of work time per year for an average office worker.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-800/50 border-slate-700">
                                <CardHeader>
                                    <TrendingUp className="w-8 h-8 text-purple-400 mb-2" />
                                    <CardTitle className="text-white">Hiring Trends</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-400 text-sm">
                                        Remote work has increased the demand for fast written communication skills by <strong>35%</strong> since 2020.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                    </div>
                    <AuthorBio />
                </section>

                {/* Categories */}
                <section className="max-w-6xl mx-auto py-16">
                    <h2 className="text-3xl font-bold text-white mb-12 text-center">Career Categories</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <Building2 className="w-10 h-10 text-cyan-400 mb-4" />
                                <CardTitle className="text-white">Corporate & Admin</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-400 mb-4">
                                    Email, reports, and meeting notes dominate these roles. Fast typing equals leaving work on time.
                                </p>
                                <ul className="text-sm text-slate-500 space-y-2">
                                    <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-cyan-500" /> Assistants</li>
                                    <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-cyan-500" /> HR Specialists</li>
                                    <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-cyan-500" /> Office Managers</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <Keyboard className="w-10 h-10 text-cyan-400 mb-4" />
                                <CardTitle className="text-white">Transcription & Data</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-400 mb-4">
                                    Typing <em>is</em> the job. High speed translates directly to higher hourly pay in freelance markets.
                                </p>
                                <ul className="text-sm text-slate-500 space-y-2">
                                    <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-cyan-500" /> Transcribers</li>
                                    <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-cyan-500" /> Data Clerks</li>
                                    <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-cyan-500" /> Captioners</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <GraduationCap className="w-10 h-10 text-cyan-400 mb-4" />
                                <CardTitle className="text-white">Creative & Tech</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-400 mb-4">
                                    Keep up with your flow of thought. Don't let slow fingers interrupt your creative process.
                                </p>
                                <ul className="text-sm text-slate-500 space-y-2">
                                    <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-cyan-500" /> Writers / Bloggers</li>
                                    <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-cyan-500" /> Programmers</li>
                                    <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-cyan-500" /> Journalists</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* CTA */}
                <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8 md:p-12 text-center max-w-4xl mx-auto my-8">
                    <h2 className="text-3xl font-bold text-white mb-6">Pass Your Employment Typing Test</h2>
                    <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
                        Most employers test candidates with a 5-minute typing assessment. Practice exactly what you'll face in the interview.
                    </p>
                    <Link href="/5-minute-typing-test">
                        <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-12 py-6 rounded-full font-bold">
                            Start Practice Test
                        </Button>
                    </Link>
                </section>

            </div>
        </div>
    );
}
