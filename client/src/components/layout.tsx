import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Keyboard, BarChart2, User, Settings, Trophy, LogOut, Sparkles, Github, Twitter, Mail, Globe, Zap, Shield, BookOpen, Users, Award, TrendingUp, Code, Book, Headphones, Star, Menu, MessageSquarePlus, Palette, Sun, Waves, TreePine, Moon, Circle, Sunrise, Gamepad2, Binary, ChevronDown, Target, Leaf, Ghost, Monitor } from "lucide-react";
import FeedbackWidget from "@/components/FeedbackWidget";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useState, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAdminFlags } from "@/hooks/useAdminFlags";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// Inline Logo Component for reliable rendering across all pages and themes
function LogoHorizontal({ className }: { className?: string }) {
  return (
    <div
      className={cn("relative z-10 inline-flex items-center gap-2 select-none whitespace-nowrap", className)}
      aria-label="TypeMasterAI Logo"
    >
      {/* TM Badge Circle */}
      {/* Badge background */}
      {/* TM Letters inside badge */}
      {/* TypeMaster Text */}
      <div className="relative h-8 w-8 shrink-0">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 p-[2px]">
          <div className="h-full w-full rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-extrabold text-slate-50">
            TM
          </div>
        </div>
      </div>
      <div className="text-[18px] leading-none font-bold text-foreground shrink-0">
        TypeMaster<span className="text-cyan-400">AI</span>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [themeMenuExpanded, setThemeMenuExpanded] = useState(false);
  const isMobile = useIsMobile();
  const { isFeedbackAdmin, isBlogAdmin } = useAdminFlags();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const primaryNavItems = [
    { href: "/", icon: Keyboard, label: "Quick Test", description: "Practice typing with various texts and languages" },
    { href: "/code-mode", icon: Code, label: "Code Practice", description: "Practice typing real programming code" },
    // HIDDEN FOR LAUNCH - Book Library (will be enabled post-launch)
    // { href: "/books", icon: Book, label: "Book Library", description: "Type passages from famous books" },
    { href: "/dictation-mode", icon: Headphones, label: "Listen & Type", description: "Listen and type what you hear" },
    { href: "/stress-test", icon: Zap, label: "Speed Challenge", description: "Test your typing under pressure" },
    { href: "/multiplayer", icon: Users, label: "Live Race", description: "Race against other players in real-time" },
  ];

  const secondaryNavItems = [
    { href: "/leaderboard", icon: Trophy, label: "Leaderboard", description: "See top typists and rankings" },
    { href: "/analytics", icon: BarChart2, label: "Analytics", description: "View your typing statistics and progress" },
    { href: "/chat", icon: Sparkles, label: "AI Chat", description: "Get AI-powered typing tips and help" },
    { href: "/profile", icon: User, label: "Profile", description: "View and edit your profile" },
    { href: "/settings", icon: Settings, label: "Settings", description: "Customize your typing experience" },
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 isolate border-b border-border/40 bg-background/95 backdrop-blur-md shadow-sm overflow-x-hidden">
        <div className="max-w-[1800px] mx-auto px-2 sm:px-4 h-14 flex items-center justify-between gap-2 min-w-0">
          <Link href="/">
            <div className="flex items-center shrink-0 cursor-pointer group p-1.5 whitespace-nowrap min-w-0">
              <LogoHorizontal
                className="h-7 sm:h-8 w-auto transition-transform group-hover:scale-105 max-w-[120px] sm:max-w-none"
              />
            </div>
          </Link>

          <nav className="hidden md:flex items-center flex-1 justify-center min-w-0 overflow-x-auto">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <div
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-200 text-xs font-medium cursor-pointer whitespace-nowrap",
                          isActive
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                        data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-card border-border">
                    <p className="text-sm">{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}

            {location !== "/" && (
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-200 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent whitespace-nowrap"
                        data-testid="nav-theme-toggle"
                      >
                        <Palette className="w-4 h-4" />
                        <span>Theme</span>
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-card border-border">
                    <p className="text-sm">Change color theme</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="center" className="w-[280px] sm:w-72 p-2 sm:p-3">
                  <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
                    <span className="text-xs sm:text-sm font-semibold">Choose Theme</span>
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground capitalize px-1.5 sm:px-2 py-0.5 bg-muted rounded-full">{theme}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                    {[
                      { id: "focus", icon: Target, color: "from-blue-500 to-indigo-600", label: "Focus" },
                      { id: "light", icon: Sun, color: "from-amber-300 to-yellow-500", label: "Light" },
                      { id: "minimal", icon: Circle, color: "from-slate-400 to-slate-600", label: "Minimal" },
                    ].map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id as any)}
                          className={cn(
                            "relative flex flex-col items-center gap-1 sm:gap-1.5 p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all duration-200 active:scale-95 sm:hover:scale-[1.02]",
                            theme === t.id
                              ? "border-primary bg-primary/10 shadow-md"
                              : "border-border/50 hover:border-border hover:bg-accent/50"
                          )}
                          data-testid={`theme-option-${t.id}`}
                        >
                          <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg ring-2 ring-white/20", t.color)}>
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-sm" />
                          </div>
                          <span className="text-[10px] sm:text-xs font-medium">{t.label}</span>
                          {theme === t.id && (
                            <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-4 h-4 sm:w-5 sm:h-5 bg-primary rounded-full flex items-center justify-center shadow-md ring-2 ring-background">
                              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="px-1 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Nature</div>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                    {[
                      { id: "ocean", icon: Waves, color: "from-cyan-400 to-blue-600", label: "Ocean" },
                      { id: "forest", icon: TreePine, color: "from-emerald-400 to-green-600", label: "Forest" },
                      { id: "sunset", icon: Sunrise, color: "from-orange-400 to-rose-500", label: "Sunset" },
                    ].map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id as any)}
                          className={cn(
                            "relative flex flex-col items-center gap-1 sm:gap-1.5 p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all duration-200 active:scale-95 sm:hover:scale-[1.02]",
                            theme === t.id
                              ? "border-primary bg-primary/10 shadow-md"
                              : "border-border/50 hover:border-border hover:bg-accent/50"
                          )}
                          data-testid={`theme-option-${t.id}`}
                        >
                          <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg ring-2 ring-white/20", t.color)}>
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-sm" />
                          </div>
                          <span className="text-[10px] sm:text-xs font-medium">{t.label}</span>
                          {theme === t.id && (
                            <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-4 h-4 sm:w-5 sm:h-5 bg-primary rounded-full flex items-center justify-center shadow-md ring-2 ring-background">
                              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="px-1 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Special</div>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {[
                      { id: "dracula", icon: Ghost, color: "from-purple-500 to-pink-600", label: "Dracula" },
                      { id: "retro", icon: Gamepad2, color: "from-amber-500 to-orange-600", label: "Retro" },
                      { id: "cyber", icon: Binary, color: "from-fuchsia-500 to-violet-600", label: "Cyber" },
                    ].map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id as any)}
                          className={cn(
                            "relative flex flex-col items-center gap-1 sm:gap-1.5 p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all duration-200 active:scale-95 sm:hover:scale-[1.02]",
                            theme === t.id
                              ? "border-primary bg-primary/10 shadow-md"
                              : "border-border/50 hover:border-border hover:bg-accent/50"
                          )}
                          data-testid={`theme-option-${t.id}`}
                        >
                          <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg ring-2 ring-white/20", t.color)}>
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-sm" />
                          </div>
                          <span className="text-[10px] sm:text-xs font-medium">{t.label}</span>
                          {theme === t.id && (
                            <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-4 h-4 sm:w-5 sm:h-5 bg-primary rounded-full flex items-center justify-center shadow-md ring-2 ring-background">
                              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          <div className="flex items-center gap-1.5 shrink-0 min-w-0 ml-2">
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-7 w-7 rounded-full p-0 shrink-0">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {user.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-semibold">{user.username}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isFeedbackAdmin && (
                      <>
                        <Link href="/admin/feedback">
                          <DropdownMenuItem data-testid="button-admin-feedback">
                            <Shield className="w-4 h-4 mr-2" />
                            Admin Feedback
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {isBlogAdmin && (
                      <>
                        <Link href="/admin/blog">
                          <DropdownMenuItem data-testid="button-admin-blog">
                            <Shield className="w-4 h-4 mr-2" />
                            Admin Blog
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {/* Desktop: Use submenu, Mobile: Inline expandable */}
                    {!isMobile ? (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger data-testid="button-theme-menu" className="gap-2">
                          <Palette className="w-4 h-4" />
                          <span>Theme</span>
                          <span className="ml-auto text-[10px] text-muted-foreground capitalize">{theme}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-64 p-2">
                          <div className="grid grid-cols-3 gap-1.5 mb-3">
                            {[
                              { id: "focus", icon: Target, color: "from-blue-500 to-indigo-600" },
                              { id: "light", icon: Sun, color: "from-amber-300 to-yellow-500" },
                              { id: "minimal", icon: Circle, color: "from-slate-400 to-slate-600" },
                            ].map((t) => {
                              const Icon = t.icon;
                              return (
                                <button
                                  key={t.id}
                                  onClick={() => setTheme(t.id as any)}
                                  className={cn(
                                    "relative flex flex-col items-center gap-1.5 p-2.5 rounded-lg border-2 transition-all duration-200",
                                    theme === t.id
                                      ? "border-primary bg-primary/10 shadow-sm"
                                      : "border-transparent hover:border-border hover:bg-accent/50"
                                  )}
                                  data-testid={`theme-${t.id}`}
                                >
                                  <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center shadow-inner", t.color)}>
                                    <Icon className="w-4 h-4 text-white drop-shadow-sm" />
                                  </div>
                                  <span className="text-[11px] font-medium capitalize">{t.id}</span>
                                  {theme === t.id && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                      <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          <div className="px-1 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Nature</div>
                          <div className="grid grid-cols-3 gap-1.5 mb-3">
                            {[
                              { id: "ocean", icon: Waves, color: "from-cyan-400 to-blue-600" },
                              { id: "forest", icon: TreePine, color: "from-emerald-400 to-green-600" },
                              { id: "sunset", icon: Sunrise, color: "from-orange-400 to-rose-500" },
                            ].map((t) => {
                              const Icon = t.icon;
                              return (
                                <button
                                  key={t.id}
                                  onClick={() => setTheme(t.id as any)}
                                  className={cn(
                                    "relative flex flex-col items-center gap-1.5 p-2.5 rounded-lg border-2 transition-all duration-200",
                                    theme === t.id
                                      ? "border-primary bg-primary/10 shadow-sm"
                                      : "border-transparent hover:border-border hover:bg-accent/50"
                                  )}
                                  data-testid={`theme-${t.id}`}
                                >
                                  <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center shadow-inner", t.color)}>
                                    <Icon className="w-4 h-4 text-white drop-shadow-sm" />
                                  </div>
                                  <span className="text-[11px] font-medium capitalize">{t.id}</span>
                                  {theme === t.id && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                      <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          <div className="px-1 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Special</div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: "dracula", icon: Ghost, color: "from-purple-500 to-pink-600" },
                              { id: "retro", icon: Gamepad2, color: "from-amber-500 to-orange-600" },
                              { id: "cyber", icon: Binary, color: "from-fuchsia-500 to-violet-600" },
                            ].map((t) => {
                              const Icon = t.icon;
                              return (
                                <button
                                  key={t.id}
                                  onClick={() => setTheme(t.id as any)}
                                  className={cn(
                                    "relative flex flex-col items-center gap-1.5 p-2.5 rounded-lg border-2 transition-all duration-200",
                                    theme === t.id
                                      ? "border-primary bg-primary/10 shadow-sm"
                                      : "border-transparent hover:border-border hover:bg-accent/50"
                                  )}
                                  data-testid={`theme-${t.id}`}
                                >
                                  <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center shadow-inner", t.color)}>
                                    <Icon className="w-4 h-4 text-white drop-shadow-sm" />
                                  </div>
                                  <span className="text-[11px] font-medium capitalize">{t.id}</span>
                                  {theme === t.id && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                      <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    ) : (
                      <>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            setThemeMenuExpanded(!themeMenuExpanded);
                          }}
                          className="flex items-center justify-between cursor-pointer"
                          data-testid="button-theme-menu-mobile"
                        >
                          <div className="flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            <span>Theme</span>
                            <span className="text-[10px] text-muted-foreground capitalize px-1.5 py-0.5 bg-muted rounded">{theme}</span>
                          </div>
                          <ChevronDown className={cn(
                            "w-4 h-4 transition-transform duration-200",
                            themeMenuExpanded && "rotate-180"
                          )} />
                        </DropdownMenuItem>
                        {themeMenuExpanded && (
                          <div className="px-2 py-2 bg-muted/30 rounded-lg mx-1 my-1">
                            <div className="grid grid-cols-3 gap-1.5">
                              {[
                                { id: "focus", icon: Target, color: "from-blue-500 to-indigo-600" },
                                { id: "light", icon: Sun, color: "from-amber-300 to-yellow-500" },
                                { id: "minimal", icon: Circle, color: "from-slate-400 to-slate-600" },
                                { id: "ocean", icon: Waves, color: "from-cyan-400 to-blue-600" },
                                { id: "forest", icon: TreePine, color: "from-emerald-400 to-green-600" },
                                { id: "sunset", icon: Sunrise, color: "from-orange-400 to-rose-500" },
                                { id: "dracula", icon: Ghost, color: "from-purple-500 to-pink-600" },
                                { id: "retro", icon: Gamepad2, color: "from-amber-500 to-orange-600" },
                                { id: "cyber", icon: Binary, color: "from-fuchsia-500 to-violet-600" },
                              ].map((t) => {
                                const Icon = t.icon;
                                return (
                                  <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id as any)}
                                    className={cn(
                                      "relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all duration-200 active:scale-95",
                                      theme === t.id
                                        ? "border-primary bg-primary/10"
                                        : "border-transparent hover:bg-accent/50"
                                    )}
                                    data-testid={`theme-${t.id}-mobile`}
                                  >
                                    <div className={cn("w-7 h-7 rounded-full bg-gradient-to-br flex items-center justify-center shadow-sm", t.color)}>
                                      <Icon className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <span className="text-[10px] font-medium capitalize">{t.id}</span>
                                    {theme === t.id && (
                                      <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full flex items-center justify-center ring-2 ring-background">
                                        <svg className="w-2 h-2 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-1">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-[11px] h-7 px-2" data-testid="button-nav-login">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="text-[11px] h-7 px-2" data-testid="button-nav-register">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden h-7 w-7 p-0" data-testid="button-mobile-menu">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-mono font-bold text-lg">
                      T
                    </div>
                    TypeMasterAI
                  </SheetTitle>
                </SheetHeader>

                <div className="p-2 overflow-y-auto max-h-[calc(100vh-200px)]">
                  <div className="space-y-1">
                    {allNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = location === item.href;
                      return (
                        <Link key={item.href} href={item.href}>
                          <div
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium cursor-pointer",
                              isActive
                                ? "text-primary bg-primary/10"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                            data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="px-3 py-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Theme</span>
                      <span className="text-[10px] text-muted-foreground capitalize px-2 py-0.5 bg-muted rounded-full">{theme}</span>
                    </div>
                    <div className="px-2">
                      <div className="grid grid-cols-3 gap-1.5 p-2 bg-muted/30 rounded-xl">
                        {[
                          { id: "focus", icon: Target, color: "from-blue-500 to-indigo-600" },
                          { id: "light", icon: Sun, color: "from-amber-300 to-yellow-500" },
                          { id: "minimal", icon: Circle, color: "from-slate-400 to-slate-600" },
                          { id: "ocean", icon: Waves, color: "from-cyan-400 to-blue-600" },
                          { id: "forest", icon: TreePine, color: "from-emerald-400 to-green-600" },
                          { id: "sunset", icon: Sunrise, color: "from-orange-400 to-rose-500" },
                          { id: "dracula", icon: Ghost, color: "from-purple-500 to-pink-600" },
                          { id: "retro", icon: Gamepad2, color: "from-amber-500 to-orange-600" },
                          { id: "cyber", icon: Binary, color: "from-fuchsia-500 to-violet-600" },
                        ].map((t) => {
                          const Icon = t.icon;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                setTheme(t.id as any);
                                setMobileMenuOpen(false);
                              }}
                              className={cn(
                                "relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all duration-200 active:scale-95",
                                theme === t.id
                                  ? "border-primary bg-primary/10 shadow-sm"
                                  : "border-transparent active:bg-accent/50"
                              )}
                              data-testid={`mobile-theme-${t.id}`}
                            >
                              <div className={cn("w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center shadow-md ring-1 ring-white/20", t.color)}>
                                <Icon className="w-[18px] h-[18px] text-white drop-shadow-sm" />
                              </div>
                              <span className="text-[10px] font-medium capitalize leading-tight">{t.id}</span>
                              {theme === t.id && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center shadow ring-2 ring-background">
                                  <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {!user && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <Link href="/login">
                        <Button variant="outline" className="w-full" onClick={() => setMobileMenuOpen(false)} data-testid="mobile-button-login">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/register">
                        <Button className="w-full" onClick={() => setMobileMenuOpen(false)} data-testid="mobile-button-register">
                          Sign Up
                        </Button>
                      </Link>
                    </div>
                  )}

                  {user && (
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        data-testid="mobile-button-logout"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary text-primary-foreground px-3 py-2 rounded">
        Skip to main content
      </a>
      <main id="main-content" className="flex-1 pt-16 pb-12 container mx-auto px-4" role="main" aria-label="Main content">
        {children}
      </main>

      <footer
        className="border-t border-border/40 bg-card/20"
        role="contentinfo"
        aria-label="Site footer"
      >
        <div className="container mx-auto px-4 py-4">
          {/* Footer Links Grid - SEO optimized internal linking */}
          <div className="hidden grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-6 text-sm">
            {/* Typing Tests Column */}
            <div>
              <h3 className="font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">Typing Tests</h3>
              <nav className="space-y-2" aria-label="Typing tests">
                <Link href="/" className="block text-muted-foreground hover:text-primary transition-colors">Free Typing Test</Link>
                <Link href="/wpm-test" className="block text-muted-foreground hover:text-primary transition-colors">WPM Test</Link>
                <Link href="/1-minute-typing-test" className="block text-muted-foreground hover:text-primary transition-colors">1 Minute Test</Link>
                <Link href="/3-minute-typing-test" className="block text-muted-foreground hover:text-primary transition-colors">3 Minute Test</Link>
                <Link href="/5-minute-typing-test" className="block text-muted-foreground hover:text-primary transition-colors">5 Minute Test</Link>
                <Link href="/keyboard-test" className="block text-muted-foreground hover:text-primary transition-colors">Keyboard Test</Link>
              </nav>
            </div>

            {/* Practice Column */}
            <div>
              <h3 className="font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">Practice</h3>
              <nav className="space-y-2" aria-label="Practice modes">
                <Link href="/typing-practice" className="block text-muted-foreground hover:text-primary transition-colors">Typing Practice</Link>
                <Link href="/code-mode" className="block text-muted-foreground hover:text-primary transition-colors">Code Typing</Link>
                <Link href="/typing-games" className="block text-muted-foreground hover:text-primary transition-colors">Typing Games</Link>
                <Link href="/typing-test-for-kids" className="block text-muted-foreground hover:text-primary transition-colors">Typing for Kids</Link>
                <Link href="/mobile-typing-test" className="block text-muted-foreground hover:text-primary transition-colors">Mobile Typing Test</Link>
                <Link href="/data-entry-typing-test" className="block text-muted-foreground hover:text-primary transition-colors">Data Entry Test</Link>
              </nav>
            </div>

            {/* Compete Column */}
            <div>
              <h3 className="font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">Compete</h3>
              <nav className="space-y-2" aria-label="Competition features">
                <Link href="/multiplayer" className="block text-muted-foreground hover:text-primary transition-colors">Multiplayer Race</Link>
                <Link href="/leaderboard" className="block text-muted-foreground hover:text-primary transition-colors">Leaderboard</Link>
                <Link href="/code-leaderboard" className="block text-muted-foreground hover:text-primary transition-colors">Code Leaderboard</Link>
                <Link href="/stress-leaderboard" className="block text-muted-foreground hover:text-primary transition-colors">Stress Leaderboard</Link>
                <Link href="/typing-certificate" className="block text-muted-foreground hover:text-primary transition-colors">Typing Certificate</Link>
              </nav>
            </div>

            {/* Learn Column */}
            <div>
              <h3 className="font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">Learn</h3>
              <nav className="space-y-2" aria-label="Learning resources">
                <Link href="/learn" className="block text-muted-foreground hover:text-primary transition-colors font-medium">Learn Touch Typing</Link>
                <Link href="/touch-typing" className="block text-muted-foreground hover:text-primary transition-colors">Touch Typing Guide</Link>
                <Link href="/typing-for-beginners" className="block text-muted-foreground hover:text-primary transition-colors">Typing for Beginners</Link>
                <Link href="/how-to-type-faster" className="block text-muted-foreground hover:text-primary transition-colors">How to Type Faster</Link>
                <Link href="/what-is-wpm" className="block text-muted-foreground hover:text-primary transition-colors">What is WPM?</Link>
                <Link href="/keyboard-layouts" className="block text-muted-foreground hover:text-primary transition-colors">Keyboard Layouts</Link>
                <Link href="/average-typing-speed" className="block text-muted-foreground hover:text-primary transition-colors">Average Typing Speed</Link>
                <Link href="/typing-speed-chart" className="block text-muted-foreground hover:text-primary transition-colors">Typing Speed Chart</Link>
              </nav>
            </div>

            {/* Help & FAQ Column */}
            <div>
              <h3 className="font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">Help & FAQ</h3>
              <nav className="space-y-2" aria-label="Help and FAQ">
                <Link href="/faq" className="block text-muted-foreground hover:text-primary transition-colors font-medium">FAQ Hub</Link>
                <Link href="/knowledge" className="block text-muted-foreground hover:text-primary transition-colors">Knowledge Base</Link>
                <Link href="/chat" className="block text-muted-foreground hover:text-primary transition-colors">AI Typing Coach</Link>
                <Link href="/average-typing-speed" className="block text-muted-foreground hover:text-primary transition-colors">Average Typing Speed</Link>
                <Link href="/typing-speed-chart" className="block text-muted-foreground hover:text-primary transition-colors">Typing Speed Chart</Link>
                <Link href="/analytics" className="block text-muted-foreground hover:text-primary transition-colors">Typing Analytics</Link>
                <Link href="/verify" className="block text-muted-foreground hover:text-primary transition-colors">Verify Certificate</Link>
              </nav>
            </div>

            {/* Compare Column */}
            <div>
              <h3 className="font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">Compare</h3>
              <nav className="space-y-2" aria-label="Alternative comparisons">
                <Link href="/monkeytype-alternative" className="block text-muted-foreground hover:text-primary transition-colors">vs Monkeytype</Link>
                <Link href="/typeracer-alternative" className="block text-muted-foreground hover:text-primary transition-colors">vs Typeracer</Link>
                <Link href="/10fastfingers-alternative" className="block text-muted-foreground hover:text-primary transition-colors">vs 10FastFingers</Link>
                <Link href="/typingcom-alternative" className="block text-muted-foreground hover:text-primary transition-colors">vs Typing.com</Link>
              </nav>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">Company</h3>
              <nav className="space-y-2" aria-label="Company information">
                <Link href="/about" className="block text-muted-foreground hover:text-primary transition-colors">About Us</Link>
                <Link href="/contact" className="block text-muted-foreground hover:text-primary transition-colors">Contact</Link>
                <Link href="/privacy-policy" className="block text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
                <Link href="/terms-of-service" className="block text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
                <Link href="/accessibility" className="block text-muted-foreground hover:text-primary transition-colors">Accessibility</Link>
                <Link href="/blog" className="block text-muted-foreground hover:text-primary transition-colors">Blog</Link>
              </nav>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-2">
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
              <Link href="/contact" className="hover:text-primary transition-colors" data-testid="link-footer-contact">Contact</Link>
              <span className="text-muted-foreground/40">·</span>
              <Link href="/about" className="hover:text-primary transition-colors" data-testid="link-footer-about">About</Link>
              <span className="text-muted-foreground/40">·</span>
              <Link href="/blog" className="hover:text-primary transition-colors" data-testid="link-footer-blog">Blog</Link>
              <span className="text-muted-foreground/40">·</span>
              <Link href="/faq" className="hover:text-primary transition-colors" data-testid="link-footer-faq">FAQ</Link>
              <span className="text-muted-foreground/40">·</span>
              <Link href="/learn" className="hover:text-primary transition-colors" data-testid="link-footer-learn">Learn</Link>
              <span className="text-muted-foreground/40">·</span>
              <Link href="/privacy-policy" className="hover:text-primary transition-colors" data-testid="link-footer-privacy">Privacy</Link>
              <span className="text-muted-foreground/40">·</span>
              <Link href="/terms-of-service" className="hover:text-primary transition-colors" data-testid="link-footer-terms">Terms</Link>
              <span className="text-muted-foreground/40">·</span>
              <Link href="/cookie-policy" className="hover:text-primary transition-colors" data-testid="link-footer-cookies">Cookies</Link>
              <span className="text-muted-foreground/40">·</span>
              <Link href="/ai-transparency" className="hover:text-primary transition-colors" data-testid="link-footer-ai">AI Transparency</Link>
              <span className="text-muted-foreground/40">·</span>
              <Link href="/accessibility" className="hover:text-primary transition-colors" data-testid="link-footer-accessibility">Accessibility</Link>
              <span className="text-muted-foreground/40">·</span>
              <Link href="/verify" className="hover:text-primary transition-colors" data-testid="link-footer-verify">Verify Certificate</Link>
              <span className="text-muted-foreground/40">·</span>
              <span>© {new Date().getFullYear()} TypeMasterAI</span>
              <span className="text-muted-foreground/40">·</span>
              <a href="mailto:support@typemasterai.com" className="hover:text-primary transition-colors" data-testid="link-footer-support-email">support@typemasterai.com</a>
              <span className="text-muted-foreground/40">·</span>
              <span>Registered in Solapur, India</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
