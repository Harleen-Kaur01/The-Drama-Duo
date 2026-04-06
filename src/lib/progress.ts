export interface LearningProgress {
  quizzesTaken: number;
  studyMinutes: number;
}

const STORAGE_KEY = 'eduverse-learning-progress';

export function getProgress(): LearningProgress {
  if (typeof window === 'undefined') {
    return { quizzesTaken: 0, studyMinutes: 0 };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { quizzesTaken: 0, studyMinutes: 0 };
    }
    const parsed = JSON.parse(raw) as Partial<LearningProgress>;
    return {
      quizzesTaken: Number(parsed.quizzesTaken || 0),
      studyMinutes: Number(parsed.studyMinutes || 0),
    };
  } catch {
    return { quizzesTaken: 0, studyMinutes: 0 };
  }
}

function persistProgress(progress: LearningProgress) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  window.dispatchEvent(new CustomEvent('eduverse-progress-updated', { detail: progress }));
}

export function incrementQuizCount() {
  const current = getProgress();
  const next = { ...current, quizzesTaken: current.quizzesTaken + 1 };
  persistProgress(next);
  return next;
}

export function addStudyMinutes(minutes: number) {
  if (minutes <= 0) return getProgress();
  const current = getProgress();
  const next = { ...current, studyMinutes: current.studyMinutes + minutes };
  persistProgress(next);
  return next;
}
