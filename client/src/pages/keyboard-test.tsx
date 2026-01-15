import { useState, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import { Keyboard, CheckCircle, XCircle, RotateCcw, ArrowRight, Info } from 'lucide-react';
import { useSEO, SEO_CONFIGS, getSoftwareAppSchema } from '@/lib/seo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { cn } from '@/lib/utils';

// Standard QWERTY layout for visualization
const KEYBOARD_LAYOUT = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['CapsLock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
  ['Ctrl', 'Alt', ' ', 'Alt', 'Ctrl'],
];

// Key code to display key mapping
const KEY_DISPLAY_MAP: Record<string, string> = {
  ' ': 'Space',
  'Backspace': '⌫',
  'Tab': '⇥',
  'Enter': '↵',
  'Shift': '⇧',
  'Control': 'Ctrl',
  'Alt': 'Alt',
  'CapsLock': 'Caps',
};

export default function KeyboardTestPage() {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [testedKeys, setTestedKeys] = useState<Set<string>>(new Set());
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  useSEO({
    ...SEO_CONFIGS.keyboardTest,
    structuredData: getSoftwareAppSchema(
      'TypeMasterAI Keyboard Tester',
      'Free online keyboard test to check if all your keys are working properly',
      ['Test all keys', 'Visual feedback', 'Key response detection', 'Works with any keyboard']
    ),
  });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    e.preventDefault();
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    setPressedKeys(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setTestedKeys(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setLastKey(key);
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    setPressedKeys(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  useEffect(() => {
    if (isActive) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, [isActive, handleKeyDown, handleKeyUp]);

  const resetTest = () => {
    setPressedKeys(new Set());
    setTestedKeys(new Set());
    setLastKey(null);
  };

  const getKeyClass = (key: string) => {
    const normalizedKey = key.length === 1 ? key.toLowerCase() : key;
    const isPressed = pressedKeys.has(normalizedKey) || pressedKeys.has(key);
    const isTested = testedKeys.has(normalizedKey) || testedKeys.has(key);

    return cn(
      "flex items-center justify-center rounded border text-sm font-mono transition-all",
      key === ' ' ? 'col-span-5 min-w-[200px]' : '',
      key === 'Backspace' || key === 'Tab' ? 'min-w-[80px]' : '',
      key === 'CapsLock' || key === 'Enter' ? 'min-w-[90px]' : '',
      key === 'Shift' ? 'min-w-[100px]' : '',
      isPressed && "bg-primary text-primary-foreground scale-95",
      isTested && !isPressed && "bg-green-500/20 border-green-500 text-green-400",
      !isTested && !isPressed && "bg-card/50 border-border/50 text-muted-foreground"
    );
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pt-20 pb-16">
        <Breadcrumbs items={[{ label: 'Keyboard Test', href: '/keyboard-test' }]} />

        {/* Hero Section */}
        <section className="max-w-4xl mx-auto text-center pt-8 sm:pt-12 md:pt-16 pb-6 sm:pb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 mb-4 sm:mb-6">
            Online Keyboard Tester
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-3 sm:mb-4 px-2">
            Test if all your keyboard keys are working properly
          </p>
          <p className="text-sm sm:text-base text-muted-foreground/80 mb-6 sm:mb-8 px-2">
            Press any key to test it. Keys turn green when successfully detected.
          </p>
        </section>

        {/* Keyboard Test Area */}
        <section className="max-w-4xl mx-auto py-6 sm:py-8">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div>
                  <CardTitle className="text-base sm:text-lg">Keyboard Test</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {isActive
                      ? `Press any key to test. ${testedKeys.size} keys tested.`
                      : 'Click Start to begin testing your keyboard'}
                  </CardDescription>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {isActive ? (
                    <>
                      <Button variant="outline" size="sm" onClick={resetTest} className="flex-1 sm:flex-none text-xs sm:text-sm">
                        <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        Reset
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsActive(false)} className="flex-1 sm:flex-none text-xs sm:text-sm">
                        Stop
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsActive(true)} className="w-full sm:w-auto text-xs sm:text-sm">
                      <Keyboard className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Start Test
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {/* Last Key Display */}
              {lastKey && (
                <div className="text-center mb-4 sm:mb-6">
                  <p className="text-xs sm:text-sm text-muted-foreground">Last key pressed:</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-mono text-primary">
                    {KEY_DISPLAY_MAP[lastKey] || lastKey}
                  </p>
                </div>
              )}

              {/* Virtual Keyboard */}
              <div className="flex flex-col items-center gap-0.5 sm:gap-1 p-2 sm:p-4 bg-muted/20 rounded-lg overflow-x-auto">
                {KEYBOARD_LAYOUT.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-0.5 sm:gap-1">
                    {row.map((key, keyIndex) => (
                      <div
                        key={`${rowIndex}-${keyIndex}`}
                        className={cn(getKeyClass(key), "h-8 sm:h-10 px-1.5 sm:px-2 min-w-[30px] sm:min-w-[40px] text-xs sm:text-sm")}
                      >
                        {KEY_DISPLAY_MAP[key] || key}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-4 sm:mt-6 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-card/50 border border-border/50" />
                  <span className="text-muted-foreground">Not tested</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-500/20 border border-green-500" />
                  <span className="text-muted-foreground">Working</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-primary" />
                  <span className="text-muted-foreground">Currently pressed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Features */}
        <section className="max-w-4xl mx-auto py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">Why Use Our Keyboard Tester?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-green-500 mb-2" />
                <h3 className="font-semibold mb-1.5 sm:mb-2 text-base sm:text-lg">Test All Keys</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Verify every key on your keyboard works correctly before gaming or important work.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                <Info className="h-7 w-7 sm:h-8 sm:w-8 text-primary mb-2" />
                <h3 className="font-semibold mb-1.5 sm:mb-2 text-base sm:text-lg">Detect Ghosting</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Test multiple keys at once to check for keyboard ghosting issues.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SEO Content */}
        <section className="max-w-4xl mx-auto py-8 sm:py-12 md:py-16">
          <article className="prose prose-sm sm:prose-base md:prose-lg dark:prose-invert max-w-none">
            <h2>Free Online Keyboard Test</h2>
            <p>
              Use our free <strong>keyboard tester</strong> to check if all your keyboard keys are working properly. This tool is useful for:
            </p>
            <ul>
              <li>Testing a new keyboard before use</li>
              <li>Diagnosing keyboard problems</li>
              <li>Checking for stuck or unresponsive keys</li>
              <li>Testing keyboard ghosting (multiple key presses)</li>
              <li>Verifying keyboard shortcuts work correctly</li>
            </ul>

            <h3>How to Use</h3>
            <ol>
              <li>Click "Start Test" to activate the keyboard tester</li>
              <li>Press each key on your keyboard</li>
              <li>Working keys will turn green on the virtual keyboard</li>
              <li>If a key doesn't register, it may be faulty</li>
            </ol>

            <h3>Compatible With All Keyboards</h3>
            <p>
              Our keyboard test works with any keyboard type including:
            </p>
            <ul>
              <li>Mechanical keyboards</li>
              <li>Membrane keyboards</li>
              <li>Laptop keyboards</li>
              <li>Wireless keyboards</li>
              <li>USB and Bluetooth keyboards</li>
            </ul>
          </article>
        </section>

        {/* CTA */}
        <section className="max-w-2xl mx-auto text-center py-8 sm:py-12 md:py-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Ready to Type?</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 px-2">
            Now that your keyboard works, test your typing speed!
          </p>
          <Link href="/">
            <Button size="lg" className="text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-6 w-full sm:w-auto">
              <Keyboard className="mr-2 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
              Take Typing Test
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}

