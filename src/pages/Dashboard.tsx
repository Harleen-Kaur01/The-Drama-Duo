import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Sparkles, Box, LogOut, BookOpen, TrendingUp, Clock, ChevronRight, Search, X, MessageSquare, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getProgress } from '@/lib/progress';
import BottomNav from '@/components/BottomNav';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quizzesTaken, setQuizzesTaken] = useState(0);
  const [studyHours, setStudyHours] = useState(0);

  const displayName = user?.user_metadata?.full_name || 'Student';
  const firstName = displayName.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const today = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });

  useEffect(() => {
    const load = () => {
      const progress = getProgress();
      setQuizzesTaken(progress.quizzesTaken);
      setStudyHours(Math.round((progress.studyMinutes || 0) / 60));
    };

    const handleProgressUpdated = () => load();

    load();
    window.addEventListener('eduverse-progress-updated', handleProgressUpdated);
    return () => window.removeEventListener('eduverse-progress-updated', handleProgressUpdated);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const searchItems = [
    { label: 'AI Quiz', path: '/ai/quiz', icon: Sparkles },
    { label: '3D Models', path: '/ai/3d', icon: Box },
    { label: 'Live Video Class', path: '/ai/class', icon: Video },
    { label: 'Classroom', path: '/classroom', icon: BookOpen },
    { label: 'Calendar', path: '/calendar', icon: Clock },
    { label: 'Profile', path: '/profile', icon: MessageSquare },
  ];

  const filteredItems = searchItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Navbar */}
      <div className="bg-primary px-5 pt-5 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-base font-bold text-primary-foreground tracking-widest">EDUVERSE AI</h1>
          <div className="flex items-center gap-3">
            {/* Bell - Notifications */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors relative">
                  <Bell className="w-5 h-5 text-primary-foreground" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Notifications</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col items-center justify-center py-16">
                  <Bell className="w-10 h-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">You're all caught up!</p>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logout */}
            <button
              onClick={handleSignOut}
              className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <p className="text-primary-foreground/60 text-xs font-medium">{today}</p>
            <p className="text-primary-foreground/80 text-sm mt-1">Hi, {firstName} 👋</p>
            <h2 className="text-2xl font-bold text-primary-foreground">{greeting}</h2>
          </div>

          {/* Avatar - Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-16 h-16 rounded-full bg-primary-foreground/20 border-2 border-primary-foreground/30 flex items-center justify-center text-2xl font-bold text-primary-foreground hover:bg-primary-foreground/30 transition-colors cursor-pointer">
                {firstName.charAt(0).toUpperCase()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/calendar')} className="cursor-pointer">
                Calendar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search Bar */}
        <div className="mt-5 relative">
          <div
            className="flex items-center bg-primary-foreground/10 rounded-xl px-4 py-3 gap-3 cursor-text hover:bg-primary-foreground/15 transition-colors"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="w-4 h-4 text-primary-foreground/50" />
            {!searchOpen && (
              <span className="text-primary-foreground/40 text-sm">Search courses, quizzes...</span>
            )}
            {searchOpen && (
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to search..."
                className="bg-transparent outline-none text-primary-foreground text-sm placeholder:text-primary-foreground/40 flex-1"
                onBlur={() => {
                  if (!searchQuery) setSearchOpen(false);
                }}
              />
            )}
            {searchOpen && (
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSearchQuery('');
                  setSearchOpen(false);
                }}
              >
                <X className="w-4 h-4 text-primary-foreground/50 hover:text-primary-foreground" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchOpen && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-lg border border-border overflow-hidden z-50">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <button
                    key={item.path}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      navigate(item.path);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted transition-colors text-left"
                  >
                    <item.icon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-muted-foreground">No results found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="px-5 -mt-4 animate-slide-up">
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/ai/quiz')}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-card shadow-sm border border-border transition-transform hover:scale-105 active:scale-95"
          >
            <div className="w-11 h-11 rounded-xl bg-card-green flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <span className="font-medium text-foreground text-xs">AI Quiz</span>
          </button>
          <button
            onClick={() => navigate('/ai/3d')}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-card shadow-sm border border-border transition-transform hover:scale-105 active:scale-95"
          >
            <div className="w-11 h-11 rounded-xl bg-card-pink flex items-center justify-center">
              <Box className="w-6 h-6 text-accent" />
            </div>
            <span className="font-medium text-foreground text-xs">3D Models</span>
          </button>
          <button
            onClick={() => navigate('/ai/class')}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-card shadow-sm border border-border transition-transform hover:scale-105 active:scale-95"
          >
            <div className="w-11 h-11 rounded-xl bg-card-yellow flex items-center justify-center">
              <Video className="w-6 h-6 text-secondary-foreground" />
            </div>
            <span className="font-medium text-foreground text-xs">Live Class</span>
          </button>
        </div>
      </div>

      {/* My Course Section */}
      <div className="mx-5 mt-5 rounded-2xl bg-primary p-5 animate-slide-up cursor-pointer hover:opacity-95 transition-opacity" onClick={() => navigate('/classroom')}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-primary-foreground/70 text-xs font-semibold uppercase tracking-wider">My Course</p>
          <ChevronRight className="w-4 h-4 text-primary-foreground/50" />
        </div>
        <p className="text-primary-foreground text-base font-bold">No course selected yet</p>
        <p className="text-primary-foreground/50 text-xs mt-1">
          Head to Classroom to join your courses.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="px-5 mt-5 animate-slide-up">
        <h3 className="text-sm font-semibold text-foreground mb-3">Your Progress</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/ai/quiz')}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Quizzes Taken</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{quizzesTaken}</p>
            <p className="text-xs text-muted-foreground mt-1">Start practicing!</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/ai/class')}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Study Hours</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{studyHours}h</p>
            <p className="text-xs text-muted-foreground mt-1">Keep going!</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-5 mt-5 animate-slide-up">
        <h3 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h3>
        <div className="bg-card rounded-xl p-6 border border-border flex flex-col items-center justify-center">
          <MessageSquare className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground text-center">No recent activity yet.</p>
          <p className="text-xs text-muted-foreground/60 text-center mt-1">Your quiz attempts and learning sessions will appear here.</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
