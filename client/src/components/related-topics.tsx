import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface RelatedTopic {
  title: string;
  description: string;
  href: string;
}

interface RelatedTopicsProps {
  topics: RelatedTopic[];
  title?: string;
  className?: string;
}

// Predefined topic clusters for easy reuse
export const TOPIC_CLUSTERS = {
  typingSpeed: [
    { title: 'What is WPM?', description: 'Understand the WPM metric', href: '/what-is-wpm' },
    { title: 'Average Typing Speed', description: 'See how you compare', href: '/average-typing-speed' },
    { title: 'Typing Speed Chart', description: 'Speed benchmarks by age', href: '/typing-speed-chart' },
    { title: 'How to Type Faster', description: 'Proven speed tips', href: '/how-to-type-faster' },
  ],
  learning: [
    { title: 'Touch Typing Guide', description: 'Master proper technique', href: '/touch-typing' },
    { title: 'Typing for Beginners', description: 'Start from scratch', href: '/typing-for-beginners' },
    { title: 'Keyboard Layouts', description: 'QWERTY vs Dvorak vs Colemak', href: '/keyboard-layouts' },
    { title: 'Learn Typing', description: 'Complete guide', href: '/learn' },
  ],
  practice: [
    { title: 'Typing Practice', description: 'Free practice exercises', href: '/typing-practice' },
    { title: 'Typing Games', description: 'Fun practice games', href: '/typing-games' },
    { title: 'WPM Test', description: 'Test your speed', href: '/wpm-test' },
    { title: 'Multiplayer Racing', description: 'Compete with others', href: '/multiplayer' },
  ],
  professional: [
    { title: 'Typing Test for Jobs', description: 'Career requirements', href: '/typing-test-jobs' },
    { title: 'Data Entry Test', description: 'Employment practice', href: '/data-entry-typing-test' },
    { title: 'Typing Certificate', description: 'Get certified', href: '/typing-certificate' },
    { title: '5-Minute Test', description: 'Standard job test', href: '/5-minute-typing-test' },
  ],
  codeTyping: [
    { title: 'Code Mode', description: 'Practice code typing', href: '/code-mode' },
    { title: 'Code Leaderboard', description: 'Compete with developers', href: '/code-leaderboard' },
    { title: 'JavaScript Test', description: 'JavaScript typing', href: '/javascript-typing-test' },
    { title: 'Python Test', description: 'Python typing', href: '/python-typing-test' },
  ],
  audience: [
    { title: 'Typing for Kids', description: 'Kid-friendly practice', href: '/typing-test-for-kids' },
    { title: 'Typing for Beginners', description: 'Start learning', href: '/typing-for-beginners' },
    { title: 'Mobile Typing Test', description: 'Phone typing practice', href: '/mobile-typing-test' },
    { title: 'Data Entry Test', description: 'Job preparation', href: '/data-entry-typing-test' },
  ],
  comparison: [
    { title: 'Monkeytype Alternative', description: 'Compare features', href: '/monkeytype-alternative' },
    { title: 'Typeracer Alternative', description: 'Modern racing', href: '/typeracer-alternative' },
    { title: 'Keybr Alternative', description: 'Better practice', href: '/keybr-alternative' },
    { title: '10FastFingers Alternative', description: 'More features', href: '/10fastfingers-alternative' },
  ],
};

export function RelatedTopics({ topics, title = "Related Topics", className }: RelatedTopicsProps) {
  if (topics.length === 0) return null;

  // Take maximum 4 topics for clean layout
  const displayTopics = topics.slice(0, 4);

  return (
    <section className={className}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayTopics.map((topic, index) => (
          <Link key={index} href={topic.href}>
            <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full group">
              <CardContent className="p-4">
                <div className="font-semibold mb-1 flex items-center justify-between">
                  {topic.title}
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-sm text-muted-foreground">{topic.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

// Simplified version for 3-column layouts
export function RelatedTopicsCompact({ topics, title = "Related Topics", className }: RelatedTopicsProps) {
  if (topics.length === 0) return null;

  const displayTopics = topics.slice(0, 3);

  return (
    <section className={className}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="grid sm:grid-cols-3 gap-4">
        {displayTopics.map((topic, index) => (
          <Link key={index} href={topic.href}>
            <Card className="bg-card/30 hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="p-4">
                <div className="font-semibold mb-1">{topic.title}</div>
                <p className="text-sm text-muted-foreground">{topic.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

