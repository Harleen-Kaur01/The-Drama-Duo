import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, LogIn, Copy, Check, Users, Crown, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Classroom {
  id: string;
  name: string;
  description: string | null;
  code: string;
  created_by: string;
  created_at: string;
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function Classroom() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});

  const fetchClassrooms = async () => {
    if (!user) return;
    setLoading(true);

    // Get classrooms user is a member of
    const { data: memberships } = await supabase
      .from('classroom_members')
      .select('classroom_id')
      .eq('user_id', user.id);

    const memberClassIds = (memberships || []).map((m: any) => m.classroom_id);

    // Get classrooms user created
    const { data: created } = await supabase
      .from('classrooms')
      .select('*')
      .eq('created_by', user.id);

    const createdIds = (created || []).map((c: any) => c.id);
    const allIds = [...new Set([...memberClassIds, ...createdIds])];

    if (allIds.length === 0) {
      setClassrooms([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('classrooms')
      .select('*')
      .in('id', allIds)
      .order('created_at', { ascending: false });

    setClassrooms((data as Classroom[]) || []);

    // Fetch member counts
    const counts: Record<string, number> = {};
    for (const id of allIds) {
      const { count } = await supabase
        .from('classroom_members')
        .select('*', { count: 'exact', head: true })
        .eq('classroom_id', id);
      counts[id] = count || 0;
    }
    setMemberCounts(counts);
    setLoading(false);
  };

  useEffect(() => {
    fetchClassrooms();
  }, [user]);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Code copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLeave = async (classroomId: string, isCreator: boolean) => {
    if (!user) return;
    if (isCreator) {
      // Delete the whole classroom
      await supabase.from('classroom_members').delete().eq('classroom_id', classroomId);
      await supabase.from('classrooms').delete().eq('id', classroomId);
      toast.success('Classroom deleted');
    } else {
      await supabase.from('classroom_members').delete().eq('classroom_id', classroomId).eq('user_id', user.id);
      toast.success('Left classroom');
    }
    fetchClassrooms();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary px-5 pt-6 pb-5 rounded-b-3xl shadow-lg">
        <h1 className="text-lg font-semibold text-primary-foreground tracking-wide text-center">CLASSROOM</h1>
        <p className="text-primary-foreground/60 text-xs text-center mt-1">Create or join study groups</p>
        <div className="mt-3 text-center">
          <button
            onClick={() => window.location.assign('/ai/class')}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
          >
            Launch Live Video Class
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-5 -mt-4 grid grid-cols-2 gap-3 animate-slide-up">
        <button
          onClick={() => navigate('/ai/class')}
          className="flex items-center gap-3 bg-card rounded-2xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-card-green flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Start Live Class</p>
            <p className="text-xs text-muted-foreground">Open AI live session</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/ai/class')}
          className="flex items-center gap-3 bg-card rounded-2xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-card-pink flex items-center justify-center">
            <LogIn className="w-5 h-5 text-accent" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Join Live Class</p>
            <p className="text-xs text-muted-foreground">Instant room entry</p>
          </div>
        </button>
      </div>

      {/* Classrooms List */}
      <div className="px-5 mt-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">My Classrooms</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border animate-pulse h-24" />
            ))}
          </div>
        ) : classrooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">No Classrooms Yet</h3>
            <p className="text-muted-foreground text-center text-xs max-w-xs">
              Create your own classroom or join one with a code to start studying together.
            </p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {classrooms.map((c) => {
              const isCreator = c.created_by === user?.id;
              return (
                <div key={c.id} className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground truncate">{c.name}</h3>
                        {isCreator && (
                          <span className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            <Crown className="w-3 h-3" /> Owner
                          </span>
                        )}
                      </div>
                      {c.description && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{c.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" /> {memberCounts[c.id] || 0} members
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-3 shrink-0">
                      {/* Copy code */}
                      <button
                        onClick={() => handleCopyCode(c.code, c.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted text-xs font-mono font-bold text-foreground hover:bg-muted/80 transition-colors"
                        title="Copy class code"
                      >
                        {copiedId === c.id ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                        {c.code}
                      </button>

                      {/* Leave / Delete */}
                      <button
                        onClick={() => handleLeave(c.id, isCreator)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-destructive/10 transition-colors"
                        title={isCreator ? 'Delete classroom' : 'Leave classroom'}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
