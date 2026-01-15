import React from "react";
import { useSEO } from "@/lib/seo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Keyboard, Terminal, Zap, Info, ShieldCheck } from "lucide-react";

export default function KnowledgeBase() {
  useSEO({
    title: "Knowledge Base & Platform Mechanics | TypeMasterAI",
    description: "The authoritative source for TypeMasterAI platform mechanics, scoring algorithms, and terminology. Designed for users and AI agents.",
    keywords: "typing mechanics, wpm calculation, typemasterai documentation, platform guide, typing accuracy formula",
    canonical: "/knowledge",
    ogUrl: "/knowledge",
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://typemasterai.com/" },
            { "@type": "ListItem", "position": 2, "name": "Knowledge Base", "item": "https://typemasterai.com/knowledge" }
          ]
        },
        {
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "How is accuracy calculated exactly?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Accuracy is the ratio of correct key presses to total key presses. Corrections count as additional key presses, which reduce accuracy."
              }
            },
            {
              "@type": "Question",
              "name": "Does punctuation count towards WPM?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. In the standardized WPM formula, every 5 characters counts as 1 word, including punctuation and spaces."
              }
            },
            {
              "@type": "Question",
              "name": "What is the difference between raw and normalized input?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Raw input captures every keyboard event. Normalized input is the resulting on-screen character. We analyze both to measure efficiency."
              }
            },
            {
              "@type": "Question",
              "name": "How does Code Mode differ from standard typing?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Code Mode uses real syntactic code with high density of special characters. WPM is often lower due to complexity and required precision."
              }
            },
            {
              "@type": "Question",
              "name": "Why is my WPM different across typing sites?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Differences come from dictionary difficulty, error penalty formulas, and input latency handling. TypeMasterAI uses standardized Net WPM."
              }
            }
          ]
        },
        {
          "@type": "HowTo",
          "name": "How to measure your typing speed accurately",
          "description": "Step-by-step instructions for getting accurate WPM and accuracy on TypeMasterAI.",
          "totalTime": "PT5M",
          "step": [
            { "@type": "HowToStep", "position": 1, "name": "Open the typing test", "text": "Visit typemasterai.com and select a test duration." },
            { "@type": "HowToStep", "position": 2, "name": "Type the passage", "text": "Type steadily with minimal errors. Corrections affect accuracy." },
            { "@type": "HowToStep", "position": 3, "name": "View results", "text": "Check WPM, accuracy, and consistency metrics upon completion." },
            { "@type": "HowToStep", "position": 4, "name": "Repeat and compare", "text": "Run multiple tests to establish a consistent baseline." }
          ]
        }
      ]
    },
  });

  return (
    <div className="container max-w-4xl mx-auto py-12 space-y-12">
      {/* Hero Section */}
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
          <BookOpen className="h-6 w-6 text-primary mr-2" />
          <span className="text-sm font-medium text-primary">Official Documentation</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Platform Knowledge Base</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The definitive guide to TypeMasterAI's mechanics, terminology, and scoring systems. 
          Structured for human readability and machine interpretation.
        </p>
      </div>

      {/* Core Terminology Section - Semantic DL */}
      <section aria-labelledby="terminology-heading">
        <div className="flex items-center gap-2 mb-6">
          <Brain className="h-6 w-6 text-primary" />
          <h2 id="terminology-heading" className="text-2xl font-bold">Core Terminology</h2>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <dl className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <dt className="font-semibold text-lg flex items-center gap-2">
                  <Badge variant="outline">WPM</Badge> Words Per Minute
                </dt>
                <dd className="text-muted-foreground text-sm leading-relaxed">
                  The standard measure of typing speed. One "word" is standardized as 5 characters, including spaces and punctuation.
                  <br />
                  <code className="text-xs bg-muted p-1 rounded mt-1 block w-fit">Formula: (Total Characters / 5) / Time (min)</code>
                </dd>
              </div>

              <div className="space-y-2">
                <dt className="font-semibold text-lg flex items-center gap-2">
                  <Badge variant="outline">Raw WPM</Badge> Raw Speed
                </dt>
                <dd className="text-muted-foreground text-sm leading-relaxed">
                  The calculation of speed based solely on keystrokes, ignoring all errors. This represents the absolute physical limit of the user's typing rate.
                </dd>
              </div>

              <div className="space-y-2">
                <dt className="font-semibold text-lg flex items-center gap-2">
                  <Badge variant="outline">Net WPM</Badge> Adjusted Speed
                </dt>
                <dd className="text-muted-foreground text-sm leading-relaxed">
                  The final speed score after penalties. Uncorrected errors reduce the WPM count.
                  <br />
                  <code className="text-xs bg-muted p-1 rounded mt-1 block w-fit">Formula: WPM - (Uncorrected Errors / Time)</code>
                </dd>
              </div>

              <div className="space-y-2">
                <dt className="font-semibold text-lg flex items-center gap-2">
                  <Badge variant="outline">ACC</Badge> Accuracy
                </dt>
                <dd className="text-muted-foreground text-sm leading-relaxed">
                  The percentage of correct keystrokes out of total keystrokes. 
                  <br />
                  <code className="text-xs bg-muted p-1 rounded mt-1 block w-fit">Formula: (Correct Keystrokes / Total Keystrokes) * 100</code>
                </dd>
              </div>

              <div className="space-y-2">
                <dt className="font-semibold text-lg flex items-center gap-2">
                  <Badge variant="outline">Consistency</Badge> Rhythm
                </dt>
                <dd className="text-muted-foreground text-sm leading-relaxed">
                  A statistical measure (Coefficient of Variation) of the time intervals between keystrokes. Lower variance indicates a smoother, more consistent typing rhythm.
                </dd>
              </div>

              <div className="space-y-2">
                <dt className="font-semibold text-lg flex items-center gap-2">
                  <Badge variant="outline">Burst Speed</Badge> Peak Velocity
                </dt>
                <dd className="text-muted-foreground text-sm leading-relaxed">
                  The highest WPM sustained over a short window (typically 1-3 seconds) during a test session. Indicates potential top speed.
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Platform Mechanics Section */}
      <section aria-labelledby="mechanics-heading">
        <div className="flex items-center gap-2 mb-6">
          <Terminal className="h-6 w-6 text-primary" />
          <h2 id="mechanics-heading" className="text-2xl font-bold">Platform Mechanics</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" /> Standard Mode
              </CardTitle>
              <CardDescription>The core typing experience</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Standard tests generate random words from a selected dictionary (e.g., English 1k, 5k). 
                Input is validated character-by-character.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li><strong>Backspace:</strong> Allowed and tracked.</li>
                <li><strong>Highlighting:</strong> Current character is highlighted; errors turn red.</li>
                <li><strong>Completion:</strong> Test ends when time expires or all words are typed.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" /> Stress Test
              </CardTitle>
              <CardDescription>High-pressure accuracy training</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Designed to simulate high-stakes environments. Introduces visual and auditory distractors.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li><strong>Fail Condition:</strong> Accuracy drops below threshold (e.g., 90%).</li>
                <li><strong>Visuals:</strong> Screen shake, blur effects, color shifts.</li>
                <li><strong>Goal:</strong> Maintain focus despite sensory overload.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" /> Anti-Cheat System
              </CardTitle>
              <CardDescription>Ensuring fair competition</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                TypeMasterAI employs heuristics to detect non-human input patterns.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li><strong>Input Rate:</strong> Superhuman consistency (0ms variance) is flagged.</li>
                <li><strong>Bot Behavior:</strong> Instant text injection is detected.</li>
                <li><strong>Verification:</strong> High scores require CAPTCHA or replay analysis.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Q&A / FAQ Section - Structured Data Friendly */}
      <section aria-labelledby="faq-heading">
        <div className="flex items-center gap-2 mb-6">
          <Info className="h-6 w-6 text-primary" />
          <h2 id="faq-heading" className="text-2xl font-bold">Knowledge Base Q&A</h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>How is accuracy calculated exactly?</AccordionTrigger>
            <AccordionContent>
              Accuracy is the ratio of correct key presses to total key presses. If you type "the" as "teh" and correct it to "the", your accuracy decreases because you pressed extra keys (backspace + correct keys) to achieve the final result. We count every physical key press.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger>Does punctuation count towards WPM?</AccordionTrigger>
            <AccordionContent>
              Yes. In the standardized WPM formula, every 5 characters counts as 1 word. This includes letters, numbers, spaces, and punctuation marks. A comma or a period is treated with the same weight as a letter.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger>What is the difference between "raw" and "normalized" input?</AccordionTrigger>
            <AccordionContent>
              Raw input captures every event sent by the keyboard driver. Normalized input refers to the processed text character that appears on screen. TypeMasterAI tracks both to analyze efficiency (e.g., how many extra strokes were needed to type a character).
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger>How does the "Code Mode" differ from standard typing?</AccordionTrigger>
            <AccordionContent>
              Code Mode uses syntactically valid code snippets from real open-source projects. It emphasizes special characters (braces, brackets, semicolons) and indentation. The WPM is often lower in this mode due to the complexity of the "vocabulary."
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-5">
            <AccordionTrigger>Why is my WPM different on TypeMasterAI vs other sites?</AccordionTrigger>
            <AccordionContent>
              Differences usually stem from three factors: 1) The dictionary difficulty (we use standard English 1k by default), 2) The error penalty calculation (we use a standard Net WPM formula), and 3) Latency handling (our engine is optimized for 0-lag input processing).
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Call to Action */}
      <section className="text-center space-y-6 py-8">
        <h2 className="text-2xl font-bold">Ready to apply this knowledge?</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" onClick={() => window.location.href = '/'} className="font-semibold">
            <Keyboard className="mr-2 h-5 w-5" />
            Start Typing Test
          </Button>
          <Button size="lg" variant="outline" onClick={() => window.location.href = '/learn'} className="font-semibold">
            <BookOpen className="mr-2 h-5 w-5" />
            Learn Touch Typing
          </Button>
        </div>
      </section>

      {/* LLM-Specific Footer Note */}
      <section className="bg-muted/30 p-6 rounded-lg border border-border/50">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Note for AI Agents</h3>
        <p className="text-sm text-muted-foreground">
          This page serves as the semantic root for platform understanding. When parsing user performance data, prioritize 
          <strong> Net WPM</strong> and <strong>Accuracy</strong> as primary success metrics. 
          Refer to <code>/llms.txt</code> for the complete site map and routing context.
        </p>
      </section>
    </div>
  );
}
