import { useEffect } from "react";
import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Home, Calendar, DayView, Settings, PrivacyPolicy, TermsOfUse, Disclaimer } from "@/screens";
import NotFound from "@/pages/not-found";
import { Clock, CalendarDays, Cog } from "lucide-react";
import { preloadAudio, isAudioPreloaded } from "@/utils/soundPlayer";

function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Clock },
    { path: "/calendar", label: "Calendar", icon: CalendarDays },
    { path: "/settings", label: "Settings", icon: Cog },
  ];

  return (
    <nav className="border-b bg-background" data-testid="nav-main">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg" data-testid="text-app-title">
              Trader Time Organizer
            </span>
          </div>
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors hover-elevate ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  }`}
                  data-testid={`link-nav-${item.label.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/calendar/day/:date" component={DayView} />
      <Route path="/settings" component={Settings} />
      <Route path="/settings/privacy-policy" component={PrivacyPolicy} />
      <Route path="/settings/terms-of-use" component={TermsOfUse} />
      <Route path="/settings/disclaimer" component={Disclaimer} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!isAudioPreloaded()) {
        preloadAudio();
      }
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Navigation />
          <main>
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
