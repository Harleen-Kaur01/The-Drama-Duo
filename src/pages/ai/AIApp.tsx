import { Link, Routes, Route, Navigate } from "react-router-dom";
import { Brain, Video, Box, MessageSquare, BookOpen } from "lucide-react";
import Dashboard from "./Dashboard";
import QuizGenerator from "./QuizGenerator";
import ModelGenerator from "./ModelGenerator";
import VideoClass from "./VideoClass";
import Chatbot from "./Chatbot";

export default function AIApp() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
      <nav className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link to="/ai" className="flex items-center gap-2 text-xl font-semibold text-neutral-900">
          <Brain className="w-6 h-6 text-indigo-600" />
          EduVision AI
        </Link>
        <div className="flex items-center gap-6 text-sm font-medium text-neutral-600">
          <Link to="/ai/quiz" className="hover:text-indigo-600 flex items-center gap-1"><BookOpen className="w-4 h-4" /> Quizzes</Link>
          <Link to="/ai/3d" className="hover:text-indigo-600 flex items-center gap-1"><Box className="w-4 h-4" /> 3D Models</Link>
          <Link to="/ai/class" className="hover:text-indigo-600 flex items-center gap-1"><Video className="w-4 h-4" /> Live Class</Link>
          <Link to="/ai/ask" className="hover:text-indigo-600 flex items-center gap-1"><MessageSquare className="w-4 h-4" /> Ask AI</Link>
        </div>
      </nav>
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="" element={<Dashboard />} />
          <Route path="quiz" element={<QuizGenerator />} />
          <Route path="3d" element={<ModelGenerator />} />
          <Route path="class" element={<VideoClass />} />
          <Route path="ask" element={<Chatbot />} />
          <Route path="*" element={<Navigate to="/ai" replace />} />
        </Routes>
      </main>
    </div>
  );
}