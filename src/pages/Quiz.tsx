import { ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Quiz() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card px-5 pt-6 pb-4 border-b border-border flex items-center gap-4">
        <button onClick={() => navigate('/')}>
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground tracking-wide">AI QUIZ</h1>
      </div>

      <div className="flex flex-col items-center justify-center px-8 mt-24 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-card-green flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Practice Quizzes</h2>
        <p className="text-muted-foreground text-center text-sm max-w-xs mb-8">
          Generate AI-powered quizzes on any subject. Test your knowledge and get instant feedback.
        </p>
        <Button className="h-12 px-8 rounded-lg text-base font-semibold">
          Generate Quiz
        </Button>
      </div>
    </div>
  );
}
