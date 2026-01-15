import { Link } from 'wouter';
import { ArrowRight, Keyboard, Code, Users, BarChart2, Trophy, Zap, Headphones, HelpCircle, BookOpen } from 'lucide-react';

interface RelatedPage {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Define page relationships for internal linking
const PAGE_RELATIONSHIPS: Record<string, RelatedPage[]> = {
  '/': [
    { href: '/code-mode', title: 'Code Typing Test', description: 'Practice typing code in 20+ programming languages', icon: Code },
    { href: '/multiplayer', title: 'Multiplayer Race', description: 'Compete against other typists in real-time', icon: Users },
    { href: '/learn', title: 'Learn Touch Typing', description: 'Master proper finger placement and technique', icon: BookOpen },
  ],
  '/code-mode': [
    { href: '/', title: 'Standard Typing Test', description: 'Test your typing speed with regular text', icon: Keyboard },
    { href: '/code-leaderboard', title: 'Code Leaderboard', description: 'See the fastest code typists', icon: Trophy },
    { href: '/analytics', title: 'Analytics', description: 'View your coding typing statistics', icon: BarChart2 },
  ],
  '/multiplayer': [
    { href: '/', title: 'Solo Practice', description: 'Practice typing on your own', icon: Keyboard },
    { href: '/leaderboard', title: 'Leaderboard', description: 'See global typing rankings', icon: Trophy },
    { href: '/stress-test', title: 'Stress Test', description: 'Test your focus under pressure', icon: Zap },
  ],
  '/stress-test': [
    { href: '/', title: 'Regular Typing Test', description: 'Standard typing practice without distractions', icon: Keyboard },
    { href: '/stress-leaderboard', title: 'Stress Leaderboard', description: 'Top performers under pressure', icon: Trophy },
    { href: '/multiplayer', title: 'Multiplayer Race', description: 'Compete in live typing races', icon: Users },
  ],
  '/dictation-mode': [
    { href: '/', title: 'Standard Typing Test', description: 'Visual typing practice', icon: Keyboard },
    { href: '/learn', title: 'Learn Touch Typing', description: 'Master typing fundamentals', icon: BookOpen },
    { href: '/analytics', title: 'View Analytics', description: 'Track your progress', icon: BarChart2 },
  ],
  '/leaderboard': [
    { href: '/code-leaderboard', title: 'Code Leaderboard', description: 'Rankings for code typing', icon: Code },
    { href: '/stress-leaderboard', title: 'Stress Leaderboard', description: 'Rankings for stress tests', icon: Zap },
    { href: '/profile', title: 'Your Profile', description: 'View your personal stats', icon: BarChart2 },
  ],
  '/analytics': [
    { href: '/profile', title: 'Your Profile', description: 'View achievements and history', icon: Trophy },
    { href: '/leaderboard', title: 'Leaderboard', description: 'Compare with other typists', icon: Trophy },
    { href: '/', title: 'Take a Test', description: 'Improve your statistics', icon: Keyboard },
  ],
  '/learn': [
    { href: '/', title: 'Practice Typing', description: 'Apply what you learned', icon: Keyboard },
    { href: '/faq', title: 'FAQ', description: 'Common questions answered', icon: HelpCircle },
    { href: '/analytics', title: 'Track Progress', description: 'Monitor your improvement', icon: BarChart2 },
  ],
  '/faq': [
    { href: '/', title: 'Start Typing Test', description: 'Test your typing speed now', icon: Keyboard },
    { href: '/learn', title: 'Learn Touch Typing', description: 'Improve your technique', icon: BookOpen },
    { href: '/chat', title: 'AI Assistant', description: 'Get personalized help', icon: HelpCircle },
  ],
  '/about': [
    { href: '/', title: 'Try TypeMasterAI', description: 'Start your first typing test', icon: Keyboard },
    { href: '/faq', title: 'FAQ', description: 'Common questions answered', icon: HelpCircle },
    { href: '/contact', title: 'Contact Us', description: 'Get in touch with our team', icon: Users },
  ],
  // Competitor alternative pages
  '/monkeytype-alternative': [
    { href: '/', title: 'Try TypeMasterAI', description: 'Start your free typing test now', icon: Keyboard },
    { href: '/code-mode', title: 'Code Typing Mode', description: 'Feature not available on Monkeytype', icon: Code },
    { href: '/multiplayer', title: 'Multiplayer Racing', description: 'Compete against live opponents', icon: Users },
  ],
  '/typeracer-alternative': [
    { href: '/multiplayer', title: 'Multiplayer Race', description: 'Join a live typing race', icon: Users },
    { href: '/', title: 'Solo Practice', description: 'Practice at your own pace', icon: Keyboard },
    { href: '/leaderboard', title: 'Leaderboard', description: 'See global rankings', icon: Trophy },
  ],
};

// Default related pages for pages not explicitly defined
const DEFAULT_RELATED: RelatedPage[] = [
  { href: '/', title: 'Typing Test', description: 'Test your typing speed', icon: Keyboard },
  { href: '/learn', title: 'Learn Touch Typing', description: 'Improve your technique', icon: BookOpen },
  { href: '/faq', title: 'FAQ', description: 'Common questions', icon: HelpCircle },
];

interface RelatedPagesProps {
  currentPath: string;
  title?: string;
}

export function RelatedPages({ currentPath, title = "Explore More" }: RelatedPagesProps) {
  const relatedPages = PAGE_RELATIONSHIPS[currentPath] || DEFAULT_RELATED;

  return (
    <section className="mt-16 pt-8 border-t border-border/50">
      <h2 className="text-xl font-semibold mb-6 text-center">{title}</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {relatedPages.map((page) => {
          const Icon = page.icon;
          return (
            <Link key={page.href} href={page.href}>
              <div className="group p-4 bg-card/30 rounded-xl border border-border/50 hover:border-primary/50 transition-all cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-1">
                      {page.title}
                      <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {page.description}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default RelatedPages;

