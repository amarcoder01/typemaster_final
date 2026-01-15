import { Globe } from 'lucide-react';
import TypingTest from "@/components/typing-test";
import { useSEO } from '@/lib/seo';
import { AuthorBio } from "@/components/author-bio";

export default function GermanTypingTestPage() {
    useSEO({
        title: 'Kostenloser Schreibtest | Tippgeschwindigkeit - TypeMasterAI',
        description: 'Überprüfen Sie Ihre Tippgeschwindigkeit auf Deutsch mit unserem kostenlosen 1-Minuten-Schreibtest. Berechnen Sie Ihre WpM (Wörter pro Minute) und verbessern Sie Ihre Genauigkeit.',
        keywords: 'schreibtest, tippgeschwindigkeit test, schreibgeschwindigkeit, kostenloser schreibtest online, typing test deutsch, wpm deutsch',
        canonical: 'https://typemasterai.com/de/typing-test',
        ogUrl: 'https://typemasterai.com/de/typing-test',
        structuredData: {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'TypeMasterAI Deutsch',
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Any',
            offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
            },
        },
    });

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 pt-20 pb-16">

                {/* Hero Section */}
                <header className="flex flex-col items-center gap-4 mb-12 text-center">
                    <div className="inline-flex items-center justify-center p-2 bg-slate-800/50 rounded-full mb-2 border border-slate-700">
                        <Globe className="w-4 h-4 text-cyan-400 mr-2" />
                        <span className="text-sm text-slate-300">Deutsch</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                        Schreibtest
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl">
                        Verbessern Sie Ihre Tippgeschwindigkeit und Genauigkeit mit unserem kostenlosen Test. Wie viele Wörter pro Minute können Sie schreiben?
                    </p>
                </header>

                {/* Typing Test with German Default */}
                <TypingTest initialLanguage="de" initialMode={60} />

                {/* SEO Content in German */}
                <section className="max-w-4xl mx-auto py-16 space-y-16">
                    <article className="prose prose-invert prose-lg max-w-none">
                        <h2>Was ist ein WpM-Test?</h2>
                        <p>
                            WpM steht für "Wörter Pro Minute". Es ist das Standardmaß zur Berechnung der Tippgeschwindigkeit. In unserem Test wird jedes "Wort" auf 5 Zeichen standardisiert, um eine faire und präzise Messung zu gewährleisten.
                        </p>

                        <h3>Vorteile des Übens der Schreibmaschinenschrift</h3>
                        <ul>
                            <li><strong>Steigern Sie Ihre Produktivität:</strong> Schnelleres Schreiben ermöglicht es Ihnen, Aufgaben früher zu erledigen.</li>
                            <li><strong>Verbessern Sie die Genauigkeit:</strong> Reduziert Fehler und die Zeit für deren Korrektur.</li>
                            <li><strong>Ergonomische Gesundheit:</strong> Das Erlernen des Zehnfingersystems reduziert die Augen- und Nackenbelastung, da man nicht auf la Tastatur schauen muss.</li>
                        </ul>

                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 not-prose mt-8">
                            <h3 className="text-xl font-bold text-white mb-4">Durchschnittliche Punktzahlen (WpM)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-slate-900 rounded-lg">
                                    <div className="text-2xl font-bold text-slate-400">20-30</div>
                                    <div className="text-xs text-slate-500">Anfänger</div>
                                </div>
                                <div className="text-center p-4 bg-slate-900 rounded-lg">
                                    <div className="text-2xl font-bold text-yellow-500">40-50</div>
                                    <div className="text-xs text-slate-500">Durchschnitt</div>
                                </div>
                                <div className="text-center p-4 bg-slate-900 rounded-lg">
                                    <div className="text-2xl font-bold text-green-500">60-80</div>
                                    <div className="text-xs text-slate-500">Professionell</div>
                                </div>
                                <div className="text-center p-4 bg-slate-900 rounded-lg">
                                    <div className="text-2xl font-bold text-cyan-500">100+</div>
                                    <div className="text-xs text-slate-500">Experte</div>
                                </div>
                            </div>
                        </div>

                        <AuthorBio />
                    </article>
                </section>

            </div>
        </div>
    );
}
