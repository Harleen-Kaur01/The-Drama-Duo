import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import BottomNav from '@/components/BottomNav';

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card px-5 pt-6 pb-4 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground tracking-wide text-center">CALENDAR</h1>
      </div>

      <div className="px-5 mt-6 animate-fade-in">
        <div className="bg-card rounded-2xl p-4 shadow-sm">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="pointer-events-auto w-full"
          />
        </div>

        {date && (
          <div className="mt-6 bg-card rounded-2xl p-5 shadow-sm animate-slide-up">
            <h3 className="font-semibold text-foreground mb-2">
              {format(date, 'EEEE, MMMM d, yyyy')}
            </h3>
            <p className="text-muted-foreground text-sm">No events scheduled for this day.</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
