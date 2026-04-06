import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Mail, User as UserIcon } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.user_metadata?.full_name || 'Student';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card px-5 pt-6 pb-4 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground tracking-wide text-center">PROFILE</h1>
      </div>

      <div className="flex flex-col items-center mt-10 px-5 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-4xl font-bold text-primary-foreground mb-4">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-xl font-bold text-foreground">{displayName}</h2>

        <div className="w-full mt-8 space-y-4">
          <div className="flex items-center gap-4 bg-card p-4 rounded-xl">
            <UserIcon className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="text-sm font-medium text-foreground">{displayName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-card p-4 rounded-xl">
            <Mail className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        <Button onClick={handleSignOut} variant="destructive" className="w-full mt-8 h-12 rounded-lg">
          <LogOut className="w-4 h-4 mr-2" /> Sign Out
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
