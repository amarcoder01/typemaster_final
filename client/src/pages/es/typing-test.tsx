import { Link } from 'wouter';
import { Keyboard, Zap, Users, Code, Trophy, Globe, CheckCircle } from 'lucide-react';
import TypingTest from "@/components/typing-test";
import { useSEO } from '@/lib/seo';
import { AuthorBio } from "@/components/author-bio";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function SpanishTypingTestPage() {
    useSEO({
        title: 'Prueba de Mecanografía Gratis | Test de Velocidad - TypeMasterAI',
        description: 'Comprueba tu velocidad de escritura en español con nuestra prueba de mecanografía gratuita de 1 minuto. Calcula tu WPM (palabras por minuto) y mejora tu precisión.',
        keywords: 'prueba de mecanografía, test de velocidad, test de escritura, mecanografia online gratis, typing test español, wpm español',
        canonical: 'https://typemasterai.com/es/typing-test',
        ogUrl: 'https://typemasterai.com/es/typing-test',
        structuredData: {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'TypeMasterAI Español',
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
                        <span className="text-sm text-slate-300">Español</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                        Prueba de Mecanografía
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl">
                        Mejora tu velocidad de escritura y precisión con nuestro test gratuito. ¿Cuántas palabras por minuto puedes escribir?
                    </p>
                </header>

                {/* Typing Test with Spanish Default */}
                <TypingTest initialLanguage="es" initialMode={60} />

                {/* SEO Content in Spanish */}
                <section className="max-w-4xl mx-auto py-16 space-y-16">
                    <article className="prose prose-invert prose-lg max-w-none">
                        <h2>¿Qué es un test de WPM?</h2>
                        <p>
                            WPM significa "Words Per Minute" (Palabras Por Minuto). Es la medida estándar para calcular la velocidad de mecanografía. En nuestra prueba, cada "palabra" se estandariza a 5 caracteres para asegurar una medición justa y precisa.
                        </p>

                        <h3>Beneficios de practicar mecanografía</h3>
                        <ul>
                            <li><strong>Aumenta tu productividad:</strong> Escribir más rápido te permite terminar tareas antes.</li>
                            <li><strong>Mejora la precisión:</strong> Reduce errores y el tiempo dedicado a corregirlos.</li>
                            <li><strong>Salud ergonómica:</strong> Aprender "touch typing" reduce la fatiga visual y de cuello al no mirar el teclado.</li>
                        </ul>

                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 not-prose mt-8">
                            <h3 className="text-xl font-bold text-white mb-4">Puntajes Promedio (WPM)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-slate-900 rounded-lg">
                                    <div className="text-2xl font-bold text-slate-400">20-30</div>
                                    <div className="text-xs text-slate-500">Principiante</div>
                                </div>
                                <div className="text-center p-4 bg-slate-900 rounded-lg">
                                    <div className="text-2xl font-bold text-yellow-500">40-50</div>
                                    <div className="text-xs text-slate-500">Promedio</div>
                                </div>
                                <div className="text-center p-4 bg-slate-900 rounded-lg">
                                    <div className="text-2xl font-bold text-green-500">60-80</div>
                                    <div className="text-xs text-slate-500">Profesional</div>
                                </div>
                                <div className="text-center p-4 bg-slate-900 rounded-lg">
                                    <div className="text-2xl font-bold text-cyan-500">100+</div>
                                    <div className="text-xs text-slate-500">Experto</div>
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
