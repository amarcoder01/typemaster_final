import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import {
  Keyboard, Zap, Code, Users, BarChart2, Trophy, Target,
  GraduationCap, Briefcase, Gamepad2, Globe, BookOpen,
  Award, Clock, Calculator, Gauge
} from 'lucide-react';

interface RelatedFeature {
  title: string;
  description: string;
  href: string;
  icon: keyof typeof ICONS;
}

const ICONS = {
  Keyboard,
  Zap,
  Code,
  Users,
  BarChart2,
  Trophy,
  Target,
  GraduationCap,
  Briefcase,
  Gamepad2,
  Globe,
  BookOpen,
  Award,
  Clock,
  Calculator,
  Gauge,
};

// Pre-defined feature groups for internal linking
export const FEATURE_GROUPS = {
  typingTests: [
    { title: 'Free Typing Test', description: 'Check your WPM instantly', href: '/', icon: 'Keyboard' as const },
    { title: '1 Minute Test', description: 'Quick speed check', href: '/1-minute-typing-test', icon: 'Clock' as const },
    { title: '3 Minute Test', description: 'Standard assessment', href: '/3-minute-typing-test', icon: 'Clock' as const },
    { title: '5 Minute Test', description: 'Professional evaluation', href: '/5-minute-typing-test', icon: 'Clock' as const },
  ],
  specialized: [
    { title: 'Code Typing', description: '20+ programming languages', href: '/code-mode', icon: 'Code' as const },
    { title: 'Data Entry Test', description: 'Numbers and forms', href: '/data-entry-typing-test', icon: 'Calculator' as const },
    { title: 'CPM Test', description: 'Characters per minute', href: '/cpm-test', icon: 'Gauge' as const },
    { title: 'Accuracy Test', description: 'Error-free typing', href: '/typing-accuracy-test', icon: 'Target' as const },
  ],
  learning: [
    { title: 'Touch Typing Guide', description: 'Master finger placement', href: '/touch-typing', icon: 'BookOpen' as const },
    { title: 'How to Type Faster', description: '15 proven tips', href: '/how-to-type-faster', icon: 'Zap' as const },
    { title: 'Typing for Beginners', description: 'Start from scratch', href: '/typing-for-beginners', icon: 'GraduationCap' as const },
    { title: 'What is WPM?', description: 'Speed explained', href: '/what-is-wpm', icon: 'Gauge' as const },
  ],
  professional: [
    { title: 'Professional Test', description: 'Employment ready', href: '/professional-typing-test', icon: 'Briefcase' as const },
    { title: 'Job Requirements', description: 'WPM by profession', href: '/typing-speed-requirements', icon: 'Briefcase' as const },
    { title: 'Typing Certificate', description: 'Verified credentials', href: '/typing-certificate', icon: 'Award' as const },
    { title: 'Data Entry Jobs', description: 'Career preparation', href: '/typing-test-jobs', icon: 'Briefcase' as const },
  ],
  statistics: [
    { title: 'Average Speed', description: 'WPM by age/profession', href: '/average-typing-speed', icon: 'BarChart2' as const },
    { title: 'Speed Chart', description: 'Benchmarks & percentiles', href: '/typing-speed-chart', icon: 'Trophy' as const },
    { title: 'Leaderboard', description: 'Global rankings', href: '/leaderboard', icon: 'Trophy' as const },
    { title: 'Analytics', description: 'Your performance insights', href: '/analytics', icon: 'BarChart2' as const },
  ],
  games: [
    { title: 'Typing Games', description: 'Fun practice', href: '/typing-games', icon: 'Gamepad2' as const },
    { title: 'Multiplayer Race', description: 'Compete live', href: '/multiplayer', icon: 'Users' as const },
    { title: 'Stress Test', description: 'Under pressure', href: '/stress-test', icon: 'Zap' as const },
    { title: 'Dictation Mode', description: 'Audio typing', href: '/dictation-mode', icon: 'Globe' as const },
  ],
  audience: [
    { title: 'Student Test', description: 'For schools', href: '/student-typing-test', icon: 'GraduationCap' as const },
    { title: 'Kids Typing', description: 'Age-appropriate', href: '/typing-test-for-kids', icon: 'Gamepad2' as const },
    { title: 'Mobile Test', description: 'Phone typing', href: '/mobile-typing-test', icon: 'Globe' as const },
    { title: 'Practice Mode', description: 'Daily training', href: '/typing-practice', icon: 'Keyboard' as const },
  ],
  alternatives: [
    { title: 'vs Monkeytype', description: 'Feature comparison', href: '/monkeytype-alternative', icon: 'Zap' as const },
    { title: 'vs TypeRacer', description: 'Multiplayer comparison', href: '/typeracer-alternative', icon: 'Users' as const },
    { title: 'vs Keybr', description: 'Learning comparison', href: '/keybr-alternative', icon: 'BookOpen' as const },
    { title: 'vs 10FastFingers', description: 'Speed test comparison', href: '/10fastfingers-alternative', icon: 'Trophy' as const },
  ],
};

interface RelatedFeaturesProps {
  /** Title for the section */
  title?: string;
  /** Features to display - can be a preset group name or custom array */
  features?: keyof typeof FEATURE_GROUPS | RelatedFeature[];
  /** Number of columns for grid layout */
  columns?: 2 | 3 | 4;
  /** Whether to show descriptions */
  showDescriptions?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function RelatedFeatures({
  title = 'You Might Also Like',
  features = 'typingTests',
  columns = 4,
  showDescriptions = true,
  className = '',
}: RelatedFeaturesProps) {
  const featureList = typeof features === 'string'
    ? FEATURE_GROUPS[features]
    : features;

  const gridCols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <section className={`py-8 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-primary" />
        {title}
      </h3>
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {featureList.map((feature, index) => {
          const IconComponent = ICONS[feature.icon];
          return (
            <Link key={index} href={feature.href}>
              <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className={`p-4 ${showDescriptions ? '' : 'text-center'}`}>
                  <IconComponent className={`w-6 h-6 text-primary ${showDescriptions ? 'mb-2' : 'mx-auto mb-2'}`} />
                  <div className="font-semibold text-sm">{feature.title}</div>
                  {showDescriptions && (
                    <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Inline links component for text-based internal linking
 */
interface InternalLinkProps {
  children: React.ReactNode;
  href: string;
  className?: string;
}

export function InternalLink({ children, href, className = '' }: InternalLinkProps) {
  return (
    <Link href={href}>
      <span className={`text-primary hover:underline cursor-pointer ${className}`}>
        {children}
      </span>
    </Link>
  );
}

/**
 * Quick links footer component for consistent internal linking at page bottom
 */
interface QuickLinksFooterProps {
  exclude?: string[];
}

export function QuickLinksFooter({ exclude = [] }: QuickLinksFooterProps) {
  const quickLinks = [
    { label: 'Typing Test', href: '/' },
    { label: 'Practice', href: '/typing-practice' },
    { label: 'Learn', href: '/learn' },
    { label: 'Games', href: '/typing-games' },
    { label: 'Multiplayer', href: '/multiplayer' },
    { label: 'Code Mode', href: '/code-mode' },
    { label: 'Analytics', href: '/analytics' },
    { label: 'Certificate', href: '/typing-certificate' },
    { label: 'FAQ', href: '/faq' },
  ].filter(link => !exclude.includes(link.href));

  return (
    <div className="hidden flex flex-wrap justify-center gap-3 py-4 text-sm">
      {quickLinks.map((link, i) => (
        <span key={link.href}>
          <Link href={link.href}>
            <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              {link.label}
            </span>
          </Link>
          {i < quickLinks.length - 1 && <span className="text-muted-foreground/50 ml-3">•</span>}
        </span>
      ))}
    </div>
  );
}

export default RelatedFeatures;

