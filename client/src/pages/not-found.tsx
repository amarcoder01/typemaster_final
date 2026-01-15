import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Home, 
  Search, 
  Keyboard, 
  Code, 
  Users, 
  Trophy, 
  BarChart3, 
  BookOpen, 
  Mic, 
  Zap, 
  HelpCircle,
  ArrowRight,
  Gamepad2,
  Target,
  Award,
  AlertCircle,
  RotateCcw
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSEO } from "@/lib/seo";
import { Breadcrumbs } from "@/components/breadcrumbs";

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location] = useLocation();

  useSEO({
    title: "404 - Page Not Found | TypeMasterAI - Free Typing Test",
    description: "The page you're looking for doesn't exist. Explore our free typing test, code typing mode, multiplayer racing, and more typing practice features.",
    keywords: "404, page not found, typing test, free typing practice",
    canonical: "https://typemasterai.com/404",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "404 - Page Not Found",
      "description": "The requested page could not be found on TypeMasterAI",
      "url": "https://typemasterai.com/404",
    },
  });

  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
      try {
        fetch("/api/error-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: {
              message: "404 Page Not Found",
              code: "NOT_FOUND",
            },
            context: {
              path: location,
              referrer: document.referrer,
            },
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          }),
        }).catch(() => {});
      } catch {
      }
    }
  }, [location]);

  const popularPages = [
    { name: "Home - Typing Test", href: "/", icon: Home, description: "Start a free typing test" },
    { name: "Code Typing Mode", href: "/code-mode", icon: Code, description: "Practice typing code in 20+ languages" },
    { name: "Multiplayer Racing", href: "/multiplayer", icon: Users, description: "Race against other typists live" },
    { name: "Global Leaderboard", href: "/leaderboard", icon: Trophy, description: "See the fastest typists" },
    { name: "Analytics Dashboard", href: "/analytics", icon: BarChart3, description: "View your typing stats" },
    { name: "Stress Test", href: "/stress-test", icon: Zap, description: "Type under pressure" },
  ];

  const quickLinks = [
    { name: "1-Minute Typing Test", href: "/1-minute-typing-test" },
    { name: "3-Minute Typing Test", href: "/3-minute-typing-test" },
    { name: "5-Minute Typing Test", href: "/5-minute-typing-test" },
    { name: "Code Leaderboard", href: "/code-leaderboard" },
    { name: "Stress Leaderboard", href: "/stress-leaderboard" },
    { name: "Dictation Mode", href: "/dictation-mode" },
    // HIDDEN: Book mode temporarily disabled
    // { name: "Book Typing", href: "/books" },
    { name: "AI Chat Assistant", href: "/chat" },
    { name: "Learn Typing", href: "/learn" },
    { name: "Your Profile", href: "/profile" },
    { name: "Settings", href: "/settings" },
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const alternativePages = [
    { name: "Monkeytype Alternative", href: "/monkeytype-alternative" },
    { name: "TypeRacer Alternative", href: "/typeracer-alternative" },
    { name: "10FastFingers Alternative", href: "/10fastfingers-alternative" },
    { name: "Typing.com Alternative", href: "/typingcom-alternative" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const failedPath = location !== "/404" ? location : "";

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 md:pt-16 pb-12 sm:pb-16 md:pb-20 max-w-6xl">
        <Breadcrumbs items={[{ label: "Page Not Found", href: "/404" }]} />
        
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 mb-4 sm:mb-6">
            <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-cyan-400" aria-hidden="true" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 px-2">
            404 - Page Not Found
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-2 sm:mb-3 px-2">
            Oops! Looks like this page took a typing break.
          </p>
          <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto px-2">
            The page you're looking for doesn't exist or has been moved. 
            But don't worry - there's plenty more to explore!
          </p>
          {failedPath && (
            <div className="mt-4 sm:mt-6 inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg">
              <code className="text-xs sm:text-sm text-slate-400 font-mono break-all">
                {failedPath}
              </code>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <Card className="bg-slate-800/50 border-slate-700 max-w-xl mx-auto mb-8 sm:mb-12">
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3" role="search" aria-label="Search TypeMasterAI">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" aria-hidden="true" />
                <Input
                  type="search"
                  placeholder="Search TypeMasterAI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 sm:pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 text-sm sm:text-base"
                  data-testid="input-404-search"
                  aria-label="Search for pages"
                />
              </div>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-2.5 w-full sm:w-auto"
                data-testid="button-404-search"
              >
                <Search className="mr-2 h-4 w-4 sm:h-5 sm:w-5 sm:hidden" />
                <span className="sm:inline">Search</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12">
          <Link href="/">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 w-full sm:w-auto"
              data-testid="button-back-home"
            >
              <Home className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Back to Typing Test
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
          <Button 
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
            className="border-slate-600 text-slate-300 hover:bg-slate-800/50 hover:text-white text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-6 w-full sm:w-auto"
            data-testid="button-go-back"
          >
            <RotateCcw className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Go Back
          </Button>
        </div>

        {/* Popular Pages Grid */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6 text-center px-2">
            <Keyboard className="inline-block mr-2 h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" aria-hidden="true" />
            Popular Pages
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {popularPages.map((page) => (
              <Link key={page.href} href={page.href}>
                <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 transition-all cursor-pointer h-full group">
                  <CardContent className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-colors flex-shrink-0">
                      <page.icon className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white mb-1 text-sm sm:text-base">{page.name}</h3>
                      <p className="text-xs sm:text-sm text-slate-400 line-clamp-2">{page.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-12">
          {/* More Pages */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" aria-hidden="true" />
                More Features
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="group">
                    <span className="text-slate-300 hover:text-cyan-400 transition-colors text-xs sm:text-sm block py-1.5 sm:py-2 cursor-pointer flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                      <span>{link.name}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alternative Pages & Help */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" aria-hidden="true" />
                Compare TypeMasterAI
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mb-3 sm:mb-4">
                See how TypeMasterAI compares to other popular typing test sites:
              </p>
              <div className="space-y-1 sm:space-y-2 mb-4 sm:mb-6">
                {alternativePages.map((link) => (
                  <Link key={link.href} href={link.href} className="group">
                    <span className="text-slate-300 hover:text-cyan-400 transition-colors text-xs sm:text-sm block py-1.5 sm:py-2 cursor-pointer flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                      <span>{link.name}</span>
                    </span>
                  </Link>
                ))}
              </div>
              
              <div className="mt-4 sm:mt-6 pt-4 border-t border-slate-700">
                <h4 className="text-base sm:text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                  Need Help?
                </h4>
                <div className="space-y-1 sm:space-y-2">
                  <Link href="/contact" className="group">
                    <span className="text-slate-300 hover:text-cyan-400 transition-colors text-xs sm:text-sm block py-1.5 sm:py-2 cursor-pointer flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                      <span>Contact Support</span>
                    </span>
                  </Link>
                  <Link href="/faq" className="group">
                    <span className="text-slate-300 hover:text-cyan-400 transition-colors text-xs sm:text-sm block py-1.5 sm:py-2 cursor-pointer flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                      <span>FAQ</span>
                    </span>
                  </Link>
                  <Link href="/privacy-policy" className="group">
                    <span className="text-slate-300 hover:text-cyan-400 transition-colors text-xs sm:text-sm block py-1.5 sm:py-2 cursor-pointer flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                      <span>Privacy Policy</span>
                    </span>
                  </Link>
                  <Link href="/terms-of-service" className="group">
                    <span className="text-slate-300 hover:text-cyan-400 transition-colors text-xs sm:text-sm block py-1.5 sm:py-2 cursor-pointer flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                      <span>Terms of Service</span>
                    </span>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fun Typing Tip */}
        <Card className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-cyan-500/30 max-w-2xl mx-auto">
          <CardContent className="p-4 sm:p-6 text-center">
            <Gamepad2 className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-400 mx-auto mb-2 sm:mb-3" aria-hidden="true" />
            <h3 className="text-base sm:text-lg font-semibold text-white mb-2 px-2">
              While you're here...
            </h3>
            <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4 px-2">
              Did you know? The average typing speed is 40 WPM, but with regular practice on TypeMasterAI, 
              you can reach 80+ WPM in just a few weeks!
            </p>
            <Link href="/">
              <Button 
                variant="outline" 
                size="lg"
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto"
                data-testid="button-start-practice"
              >
                <Keyboard className="mr-2 h-4 w-4" />
                Start Practicing Now
              </Button>
            </Link>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
