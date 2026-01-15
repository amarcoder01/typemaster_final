import { Switch, Route, Router } from "wouter";
import { lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { NetworkProvider } from "@/lib/network-context";
import { ErrorProvider } from "@/lib/error-context";
import { NetworkStatusBanner } from "@/components/NetworkStatusBanner";
import { ErrorBoundary } from "@/components/error-boundary";
import { AchievementCelebrationProvider } from "@/components/achievement-celebration";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import Layout from "@/components/layout";
import { NotificationSync } from "@/components/NotificationSync";

// Critical pages - loaded eagerly for fast initial load
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";

// Lazy-loaded pages for better code splitting and performance
// These pages are loaded on-demand when the user navigates to them
const Profile = lazy(() => import("@/pages/profile"));
const ProfileEdit = lazy(() => import("@/pages/profile-edit"));
const Leaderboard = lazy(() => import("@/pages/leaderboard"));
const Settings = lazy(() => import("@/pages/settings"));
const Chat = lazy(() => import("@/pages/chat"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const VerifyEmail = lazy(() => import("@/pages/verify-email"));
const Analytics = lazy(() => import("@/pages/analytics"));
const Multiplayer = lazy(() => import("@/pages/multiplayer"));
const Race = lazy(() => import("@/pages/race"));
const CodeMode = lazy(() => import("@/pages/code-mode"));
const CodeLeaderboard = lazy(() => import("@/pages/code-leaderboard"));
const DictationTest = lazy(() => import("@/pages/dictation-test"));
const DictationMode = lazy(() => import("@/pages/dictation-mode"));
const StressTest = lazy(() => import("@/pages/stress-test"));
const StressLeaderboard = lazy(() => import("@/pages/stress-leaderboard"));
const UnifiedLeaderboard = lazy(() => import("@/pages/unified-leaderboard"));
const SharedResult = lazy(() => import("@/pages/shared-result"));
const Result = lazy(() => import("@/pages/result"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const TermsOfService = lazy(() => import("@/pages/terms-of-service"));
const CookiePolicy = lazy(() => import("@/pages/cookie-policy"));
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const Verify = lazy(() => import("@/pages/verify"));
const NotificationSettings = lazy(() => import("@/pages/NotificationSettings"));
const TypingTest1Min = lazy(() => import("@/pages/typing-test-1-min"));
const TypingTest3Min = lazy(() => import("@/pages/typing-test-3-min"));
const TypingTest5Min = lazy(() => import("@/pages/typing-test-5-min"));
const MonkeytypeAlternative = lazy(() => import("@/pages/monkeytype-alternative"));
const TyperacerAlternative = lazy(() => import("@/pages/typeracer-alternative"));
const TenFastFingersAlternative = lazy(() => import("@/pages/10fastfingers-alternative"));
const TypingComAlternative = lazy(() => import("@/pages/typingcom-alternative"));
const AdminFeedbackDashboard = lazy(() => import("@/pages/admin/feedback"));
const Learn = lazy(() => import("@/pages/learn"));
const AITransparency = lazy(() => import("@/pages/ai-transparency"));
const AccessibilityStatement = lazy(() => import("@/pages/accessibility"));
const FAQ = lazy(() => import("@/pages/faq"));
const KnowledgeBase = lazy(() => import("@/pages/knowledge-base"));

// New SEO landing pages
const TypingPractice = lazy(() => import("@/pages/typing-practice"));
const WPMTest = lazy(() => import("@/pages/wpm-test"));
const TypingGames = lazy(() => import("@/pages/typing-games"));
const KeyboardTest = lazy(() => import("@/pages/keyboard-test"));
const TypingCertificate = lazy(() => import("@/pages/typing-certificate"));
const AverageTypingSpeed = lazy(() => import("@/pages/average-typing-speed"));
const TypingSpeedChart = lazy(() => import("@/pages/typing-speed-chart"));
const KeybrAlternative = lazy(() => import("@/pages/keybr-alternative"));
const TypingTestJobs = lazy(() => import("@/pages/typing-test-jobs"));
const TouchTyping = lazy(() => import("@/pages/touch-typing"));
const SpanishTypingTest = lazy(() => import("@/pages/es/typing-test"));
const FrenchTypingTest = lazy(() => import("@/pages/fr/typing-test"));
const GermanTypingTest = lazy(() => import("@/pages/de/typing-test"));
const BlogIndex = lazy(() => import("@/blog/index"));
const BlogPostPage = lazy(() => import("@/blog/post"));
const BlogAdmin = lazy(() => import("@/blog-admin/index"));
const BlogTagPage = lazy(() => import("@/blog/tag"));
const BlogTagsPage = lazy(() => import("@/blog/tags"));

// Pillar-Cluster Content Pages
const WhatIsWpm = lazy(() => import("@/pages/what-is-wpm"));
const HowToTypeFaster = lazy(() => import("@/pages/how-to-type-faster"));
const KeyboardLayouts = lazy(() => import("@/pages/keyboard-layouts"));
const TypingForBeginners = lazy(() => import("@/pages/typing-for-beginners"));
const DataEntryTypingTest = lazy(() => import("@/pages/data-entry-typing-test"));
const TypingTestForKids = lazy(() => import("@/pages/typing-test-for-kids"));
const MobileTypingTest = lazy(() => import("@/pages/mobile-typing-test"));

// Programming Language Typing Test Pages
const JavaScriptTypingTest = lazy(() => import("@/pages/javascript-typing-test"));
const PythonTypingTest = lazy(() => import("@/pages/python-typing-test"));

// New Authority Landing Pages
const FreeOnlineTypingTest = lazy(() => import("@/pages/free-online-typing-test"));
const CPMTest = lazy(() => import("@/pages/cpm-test"));
const TypingSpeedRequirements = lazy(() => import("@/pages/typing-speed-requirements"));
const TypingAccuracyTest = lazy(() => import("@/pages/typing-accuracy-test"));
const ProfessionalTypingTest = lazy(() => import("@/pages/professional-typing-test"));
const StudentTypingTest = lazy(() => import("@/pages/student-typing-test"));

// Loading component for Suspense fallback
function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
}

function AppRouter() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/share/:shareId" component={SharedResult} />
        <Route path="/result/:shareToken" component={Result} />
        <Route>
          <Layout>
            <Suspense fallback={<PageLoader />}>
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/1-minute-typing-test" component={TypingTest1Min} />
                <Route path="/3-minute-typing-test" component={TypingTest3Min} />
                <Route path="/5-minute-typing-test" component={TypingTest5Min} />
                <Route path="/monkeytype-alternative" component={MonkeytypeAlternative} />
                <Route path="/typeracer-alternative" component={TyperacerAlternative} />
                <Route path="/10fastfingers-alternative" component={TenFastFingersAlternative} />
                <Route path="/typingcom-alternative" component={TypingComAlternative} />
                <Route path="/typing-practice" component={TypingPractice} />
                <Route path="/wpm-test" component={WPMTest} />
                <Route path="/typing-games" component={TypingGames} />
                <Route path="/keyboard-test" component={KeyboardTest} />
                <Route path="/typing-certificate" component={TypingCertificate} />
                <Route path="/average-typing-speed" component={AverageTypingSpeed} />
                <Route path="/typing-speed-chart" component={TypingSpeedChart} />
                <Route path="/keybr-alternative" component={KeybrAlternative} />
                <Route path="/typing-test-jobs" component={TypingTestJobs} />
                <Route path="/touch-typing" component={TouchTyping} />
                <Route path="/es/typing-test" component={SpanishTypingTest} />
                <Route path="/fr/typing-test" component={FrenchTypingTest} />
                <Route path="/de/typing-test" component={GermanTypingTest} />
                <Route path="/what-is-wpm" component={WhatIsWpm} />
                <Route path="/how-to-type-faster" component={HowToTypeFaster} />
                <Route path="/keyboard-layouts" component={KeyboardLayouts} />
                <Route path="/typing-for-beginners" component={TypingForBeginners} />
                <Route path="/data-entry-typing-test" component={DataEntryTypingTest} />
                <Route path="/typing-test-for-kids" component={TypingTestForKids} />
                <Route path="/mobile-typing-test" component={MobileTypingTest} />
                <Route path="/javascript-typing-test" component={JavaScriptTypingTest} />
                <Route path="/python-typing-test" component={PythonTypingTest} />
                <Route path="/free-online-typing-test" component={FreeOnlineTypingTest} />
                <Route path="/cpm-test" component={CPMTest} />
                <Route path="/typing-speed-requirements" component={TypingSpeedRequirements} />
                <Route path="/typing-accuracy-test" component={TypingAccuracyTest} />
                <Route path="/professional-typing-test" component={ProfessionalTypingTest} />
                <Route path="/student-typing-test" component={StudentTypingTest} />
                <Route path="/profile" component={Profile} />
                <Route path="/profile/edit" component={ProfileEdit} />
                <Route path="/leaderboard" component={Leaderboard} />
                <Route path="/leaderboards" component={UnifiedLeaderboard} />
                <Route path="/analytics" component={Analytics} />
                <Route path="/multiplayer" component={Multiplayer} />
                <Route path="/race/:id" component={Race} />
                <Route path="/code-mode" component={CodeMode} />
                <Route path="/code-leaderboard" component={CodeLeaderboard} />
                <Route path="/blog" component={BlogIndex} />
                <Route path="/blog/:slug" component={BlogPostPage} />
                <Route path="/blog/tag/:slug" component={BlogTagPage} />
                <Route path="/blog/tags" component={BlogTagsPage} />
                {/* HIDDEN: Book mode temporarily disabled */}
                {/* <Route path="/book-mode" component={BookMode} /> */}
                <Route path="/dictation-mode" component={DictationMode} />
                <Route path="/dictation-test" component={DictationTest} />
                <Route path="/stress-test" component={StressTest} />
                <Route path="/stress-leaderboard" component={StressLeaderboard} />
                {/* HIDDEN: Book routes temporarily disabled */}
                {/* <Route path="/books/:slug/chapter/:chapterNum" component={ChapterTyping} /> */}
                {/* <Route path="/books/:slug" component={BookDetail} /> */}
                {/* <Route path="/books" component={BookLibrary} /> */}
                <Route path="/chat" component={Chat} />
                <Route path="/settings" component={Settings} />
                <Route path="/notifications" component={NotificationSettings} />
                <Route path="/privacy-policy" component={PrivacyPolicy} />
                <Route path="/terms-of-service" component={TermsOfService} />
                <Route path="/cookie-policy" component={CookiePolicy} />
                <Route path="/about" component={About} />
                <Route path="/contact" component={Contact} />
                <Route path="/faq" component={FAQ} />
                <Route path="/knowledge" component={KnowledgeBase} />
                <Route path="/verify" component={Verify} />
                <Route path="/verify/:verificationId" component={Verify} />
                <Route path="/learn" component={Learn} />
                <Route path="/ai-transparency" component={AITransparency} />
                <Route path="/accessibility" component={AccessibilityStatement} />
                <Route path="/admin/feedback" component={AdminFeedbackDashboard} />
                <Route path="/admin/blog" component={BlogAdmin} />
                <Route path="/admin/blog/:action/:id?" component={BlogAdmin} />
                <Route component={NotFound} />
              </Switch>
            </Suspense>
          </Layout>
        </Route>
        </Switch>
      </Suspense>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <NetworkProvider>
            <ErrorProvider>
              <AuthProvider>
                <AchievementCelebrationProvider>
                  <TooltipProvider>
                    <NetworkStatusBanner />
                    <Toaster />
                    <SonnerToaster
                      position="bottom-right"
                      richColors
                      closeButton
                      toastOptions={{
                        duration: 5000,
                        className: "font-sans text-xs sm:text-sm !p-3 sm:!p-4",
                      }}
                    />
                    <NotificationSync />
                    <AppRouter />
                    <CookieConsentBanner />
                  </TooltipProvider>
                </AchievementCelebrationProvider>
              </AuthProvider>
            </ErrorProvider>
          </NetworkProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
