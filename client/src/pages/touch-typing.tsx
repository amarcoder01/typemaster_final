import { Link } from 'wouter';
import { Keyboard, Hand, Zap, Eye, Brain, CheckCircle, ArrowRight } from 'lucide-react';
import { useSEO, SEO_CONFIGS, getBreadcrumbSchema, getFAQSchema } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { AuthorBio } from '@/components/author-bio';

export default function TouchTypingPage() {
    useSEO({
        ...SEO_CONFIGS.touchTyping,
        structuredData: {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'HowTo',
                    'name': 'How to Learn Touch Typing',
                    'description': 'Step-by-step guide to mastering touch typing for faster, more accurate typing without looking at the keyboard.',
                    'totalTime': 'P4W',
                    'tool': [
                        { '@type': 'HowToTool', 'name': 'Keyboard' },
                        { '@type': 'HowToTool', 'name': 'TypeMasterAI Typing Test' }
                    ],
                    'step': [
                        { '@type': 'HowToStep', 'position': 1, 'name': 'Learn Home Row Position', 'text': 'Place fingers on ASDF and JKL; keys. Feel the bumps on F and J.' },
                        { '@type': 'HowToStep', 'position': 2, 'name': 'Practice Without Looking', 'text': 'Cover your hands and focus on the screen, not the keyboard.' },
                        { '@type': 'HowToStep', 'position': 3, 'name': 'Master Each Finger Zone', 'text': 'Each finger is responsible for specific keys. Practice finger-specific exercises.' },
                        { '@type': 'HowToStep', 'position': 4, 'name': 'Build Muscle Memory', 'text': 'Practice 15-30 minutes daily to develop automatic key recognition.' },
                        { '@type': 'HowToStep', 'position': 5, 'name': 'Increase Speed Gradually', 'text': 'Focus on accuracy first, speed will naturally follow with practice.' }
                    ]
                },
                getBreadcrumbSchema([
                    { name: 'Home', url: 'https://typemasterai.com' },
                    { name: 'Touch Typing Guide', url: 'https://typemasterai.com/touch-typing' }
                ]),
                getFAQSchema([
                    { question: 'What is touch typing?', answer: 'Touch typing is a method of typing using all ten fingers without looking at the keyboard, relying on muscle memory to find keys.' },
                    { question: 'How long does it take to learn touch typing?', answer: 'Most people can learn basic touch typing in 2-4 weeks with daily practice of 15-30 minutes. Mastery takes 2-3 months.' },
                    { question: 'Is touch typing faster than hunt-and-peck?', answer: 'Yes, touch typists average 60-80 WPM compared to 30-40 WPM for hunt-and-peck typists. Touch typing is 2-3x faster.' }
                ])
            ]
        }
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="container mx-auto px-4 pt-20 pb-16">
                <Breadcrumbs items={[{ label: 'Touch Typing Guide', href: '/touch-typing' }]} />

                {/* Hero Section */}
                <section className="max-w-4xl mx-auto text-center pt-8 pb-16">
                    <div className="inline-flex items-center justify-center p-2 bg-slate-800/50 rounded-full mb-6 border border-slate-700">
                        <Keyboard className="w-4 h-4 text-cyan-400 mr-2" />
                        <span className="text-sm text-slate-300">Skill Mastery</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                        Master the Art of <span className="text-cyan-400">Touch Typing</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
                        Stop hunting and pecking. Learn to type at the speed of thought without ever looking at your keyboard.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/learn">
                            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-lg px-8 py-6 shadow-lg shadow-cyan-500/20" data-testid="button-start-learning">
                                Start Learning Free
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* AI Answer Section */}
                <section className="max-w-4xl mx-auto mb-16">
                    <div className="bg-slate-800/50 border border-green-500/30 rounded-xl p-6 shadow-lg shadow-green-900/10">
                        <div className="flex items-center gap-2 mb-4">
                            <Brain className="w-6 h-6 text-green-400" />
                            <h2 className="text-xl font-bold text-white m-0">Quick Answer: What is Touch Typing?</h2>
                        </div>
                        <p className="text-slate-300 text-lg leading-relaxed mb-4">
                            <strong>Touch typing</strong> is a method of typing without looking at the keyboard, relying entirely on muscle memory. Typists place their fingers on the <strong>Home Row</strong> (ASDF JKL;) and reach for keys using specific fingers.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <h3 className="font-semibold text-green-400 mb-1">Max Speed</h3>
                                <p className="text-sm text-slate-400">Allows speeds over <strong>100 WPM</strong>, compared to ~35 WPM for visual typing.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-green-400 mb-1">Mental Load</h3>
                                <p className="text-sm text-slate-400">Frees your brain to focus on <strong>what</strong> you are writing, not <strong>how</strong> to write it.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Principles */}
                <section className="max-w-6xl mx-auto py-12">
                    <h2 className="text-3xl font-bold text-white mb-12 text-center">The 4 Pillars of Touch Typing</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <Keyboard className="w-10 h-10 text-cyan-400 mb-4" />
                                <CardTitle className="text-white">Home Row</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-400 text-sm">
                                    Your fingers always return to the center (ASDF JKL;). This minimizes movement distance.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <Hand className="w-10 h-10 text-cyan-400 mb-4" />
                                <CardTitle className="text-white">10 Fingers</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-400 text-sm">
                                    Every key has a designated finger. Using all 10 fingers distributes the workload evenly.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <Eye className="w-10 h-10 text-cyan-400 mb-4" />
                                <CardTitle className="text-white">Blind Typing</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-400 text-sm">
                                    Eyes stay on the screen. Looking at keys breaks your focus and slows you down.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <Zap className="w-10 h-10 text-cyan-400 mb-4" />
                                <CardTitle className="text-white">Rhythm</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-400 text-sm">
                                    Maintain a steady, metronome-like pace. Consistency builds speed faster than bursts.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* Benefits List */}
                <section className="max-w-4xl mx-auto py-16">
                    <h2 className="text-3xl font-bold text-white mb-8">Why Learn Touch Typing?</h2>
                    <div className="space-y-6">
                        {[
                            { title: 'Double Your Productivity', desc: 'Go from 30 WPM to 60+ WPM. That means writing emails, reports, and code twice as fast.' },
                            { title: 'Reduce Physical Fatigue', desc: 'Less finger movement means less strain. Good technique prevents RSI and Carpal Tunnel.' },
                            { title: 'Improve Focus & Quality', desc: 'When typing is automatic, your brain is 100% focused on ideas, resulting in higher quality writing.' },
                            { title: 'Better Posture', desc: 'Not looking down at the keyboard saves your neck and shoulders from constant strain.' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start">
                                <div className="flex-shrink-0 mt-1">
                                    <CheckCircle className="w-6 h-6 text-green-400" />
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-xl font-semibold text-white mb-1">{item.title}</h3>
                                    <p className="text-slate-400">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Learning Steps */}
                <section className="bg-slate-900/50 py-16">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <h2 className="text-3xl font-bold text-white mb-10 text-center">How to Learn (Step-by-Step)</h2>
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <div className="w-12 h-12 bg-cyan-500 text-white rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">1</div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Memorize the Home Row</h3>
                                    <p className="text-slate-300">Place your left hand on A-S-D-F and right hand on J-K-L-;. Feel the bumps on F and J – they guide you without looking.</p>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <div className="w-12 h-12 bg-cyan-500 text-white rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">2</div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Practice Top & Bottom Rows</h3>
                                    <p className="text-slate-300">Learn to reach up to QWERTY and down to ZXCVB without moving your palms. Return to home row instantly.</p>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <div className="w-12 h-12 bg-cyan-500 text-white rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">3</div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Build Muscle Memory</h3>
                                    <p className="text-slate-300">Use our practice mode daily. 15 minutes a day is better than 2 hours once a week.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="max-w-2xl mx-auto text-center py-16">
                    <h2 className="text-3xl font-bold text-white mb-6">Start Your Journey Today</h2>
                    <p className="text-slate-400 mb-8">
                        Don't waste another year hunting for keys. TypeMasterAI's interactive lessons guide you from 0 to Pro.
                    </p>
                    <Link href="/learn">
                        <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-12 py-6 rounded-full">
                            Start Free Lessons
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </section>

            </div>
        </div>
    );
}
