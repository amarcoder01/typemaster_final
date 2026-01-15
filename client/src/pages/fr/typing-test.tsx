import { Globe } from 'lucide-react';
import TypingTest from "@/components/typing-test";
import { useSEO } from '@/lib/seo';
import { AuthorBio } from "@/components/author-bio";

export default function FrenchTypingTestPage() {
    useSEO({
        title: 'Test de Dactylo Gratuit | Test de Vitesse - TypeMasterAI',
        description: 'Vérifiez votre vitesse de frappe en français avec notre test de dactylo gratuit d\'une minute. Calculez vos MPM (mots par minute) et améliorez votre précision.',
        keywords: 'test de dactylo, test de vitesse, test d’écriture, dactylographie en ligne gratuit, typing test français, mpm français',
        canonical: 'https://typemasterai.com/fr/typing-test',
        ogUrl: 'https://typemasterai.com/fr/typing-test',
        structuredData: {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'TypeMasterAI Français',
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
                        <span className="text-sm text-slate-300">Français</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                        Test de Dactylo
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl">
                        Améliorez votre vitesse de frappe et votre précision avec notre test gratuit. Combien de mots par minute pouvez-vous écrire ?
                    </p>
                </header>

                {/* Typing Test with French Default */}
                <TypingTest initialLanguage="fr" initialMode={60} />

                {/* SEO Content in French */}
                <section className="max-w-4xl mx-auto py-16 space-y-16">
                    <article className="prose prose-invert prose-lg max-w-none">
                        <h2>Qu'est-ce qu'un test MPM ?</h2>
                        <p>
                            MPM signifie "Mots Par Minute". C'est la mesure standard pour calculer la vitesse de dactylographie. Dans notre test, chaque "mot" est standardisé à 5 caractères pour assurer une mesure juste et précise.
                        </p>

                        <h3>Avantages de pratiquer la dactylographie</h3>
                        <ul>
                            <li><strong>Augmentez votre productivité :</strong> Écrire plus vite vous permet de terminer vos tâches plus tôt.</li>
                            <li><strong>Améliorez la précision :</strong> Réduit les erreurs et le temps consacré à les corriger.</li>
                            <li><strong>Santé ergonomique :</strong> Apprendre la "dactylographie à l'aveugle" réduit la fatigue visuelle et cervicale en ne regardant pas le clavier.</li>
                        </ul>

                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 not-prose mt-8">
                            <h3 className="text-xl font-bold text-white mb-4">Scores Moyens (MPM)</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-slate-900 rounded-lg">
                                    <div className="text-2xl font-bold text-slate-400">20-30</div>
                                    <div className="text-xs text-slate-500">Débutant</div>
                                </div>
                                <div className="text-center p-4 bg-slate-900 rounded-lg">
                                    <div className="text-2xl font-bold text-yellow-500">40-50</div>
                                    <div className="text-xs text-slate-500">Moyen</div>
                                </div>
                                <div className="text-center p-4 bg-slate-900 rounded-lg">
                                    <div className="text-2xl font-bold text-green-500">60-80</div>
                                    <div className="text-xs text-slate-500">Professionnel</div>
                                </div>
                                <div className="text-center p-4 bg-slate-900 rounded-lg">
                                    <div className="text-2xl font-bold text-cyan-500">100+</div>
                                    <div className="text-xs text-slate-500">Expert</div>
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
