import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { incrementQuizCount } from '@/lib/progress';

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export default function QuizGenerator() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const generateQuiz = async () => {
    if (!topic) return;
    setLoading(true);
    setQuiz(null);
    setAnswers({});
    setSubmitted(false);
    setScore(0);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        alert("AI service not configured");
        return;
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Generate a 5-question multiple choice quiz about ${topic} at a ${difficulty} difficulty level. Return as JSON array with fields: question, options (array of 4 strings), correctAnswer (one of the options), explanation.`,
      });

      const jsonText = response.text || "[]";

      const extractJson = (text: string) => {
        let cleaned = text.trim();

        // remove markdown fences
        const fencedMatch = cleaned.match(/^```(?:json)?\n([\s\S]*?)\n```$/i);
        if (fencedMatch) {
          cleaned = fencedMatch[1].trim();
        }

        // strip leading backticks not caught above
        if (cleaned.startsWith("```") && cleaned.endsWith("```")) {
          cleaned = cleaned.slice(3, -3).trim();
        }

        // if contains surrounding text, keep first JSON bracket structure
        const firstArray = cleaned.indexOf("[");
        const firstObject = cleaned.indexOf("{");
        if (firstArray !== -1 && (firstObject === -1 || firstArray < firstObject)) {
          cleaned = cleaned.slice(firstArray);
        } else if (firstObject !== -1) {
          cleaned = cleaned.slice(firstObject);
        }

        return cleaned;
      };

      const parsedText = extractJson(jsonText);
      const data = JSON.parse(parsedText);
      setQuiz(Array.isArray(data) ? data : data.questions || []);
    } catch (error) {
      console.error("Failed to generate quiz", error);
      alert("Failed to generate quiz. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = () => {
    if (!quiz) return;
    let currentScore = 0;
    quiz.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) {
        currentScore++;
      }
    });
    setScore(currentScore);
    setSubmitted(true);
    incrementQuizCount();
  };

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-200 mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">AI Quiz Generator</h1>
        <p className="text-neutral-600 mb-6">Enter a topic to generate a custom multiple-choice quiz.</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="E.g., Photosynthesis, World War II, Python Basics"
            className="flex-1 px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateQuiz()}
          />
          <select
            className="px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button
            onClick={generateQuiz}
            disabled={loading || !topic}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate"}
          </button>
        </div>
      </div>

      {quiz && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {quiz.map((q, i) => (
            <div key={i} className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-200">
              <h3 className="text-xl font-semibold text-neutral-900 mb-6">
                <span className="text-indigo-600 mr-2">{i + 1}.</span>
                {q.question}
              </h3>
              <div className="space-y-3">
                {q.options.map((option, j) => {
                  const isSelected = answers[i] === option;
                  const isCorrect = option === q.correctAnswer;
                  const showCorrect = submitted && isCorrect;
                  const showIncorrect = submitted && isSelected && !isCorrect;

                  return (
                    <button
                      key={j}
                      onClick={() => !submitted && setAnswers({ ...answers, [i]: option })}
                      className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                        showCorrect
                          ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                          : showIncorrect
                          ? "border-red-500 bg-red-50 text-red-900"
                          : isSelected
                          ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                          : "border-neutral-200 hover:border-indigo-300 hover:bg-neutral-50 text-neutral-700"
                      }`}
                      disabled={submitted}
                    >
                      <span>{option}</span>
                      {showCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      {showIncorrect && <XCircle className="w-5 h-5 text-red-500" />}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <div className="mt-6 p-4 bg-blue-50 text-blue-900 rounded-xl border border-blue-100">
                  <p className="font-medium mb-1">Explanation:</p>
                  <p className="text-sm">{q.explanation}</p>
                </div>
              )}
            </div>
          ))}

          {!submitted ? (
            <div className="flex justify-end">
              <button
                onClick={submitQuiz}
                disabled={Object.keys(answers).length !== quiz.length}
                className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
              >
                Submit Answers
              </button>
            </div>
          ) : (
            <div className="bg-indigo-600 text-white rounded-3xl p-8 text-center shadow-lg">
              <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
              <p className="text-xl mb-6">You scored {score} out of {quiz.length}</p>
              <button
                onClick={generateQuiz}
                className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-neutral-50 flex items-center justify-center gap-2 mx-auto"
              >
                <RefreshCw className="w-5 h-5" /> Try Another Quiz
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}