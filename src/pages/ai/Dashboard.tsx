import { Link } from "react-router-dom";
import { Brain, Video, Box, MessageSquare, BookOpen, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export default function Dashboard() {
  const features = [
    { title: "AI Quiz Generator", description: "Generate custom quizzes and assessments based on any topic instantly.", icon: <BookOpen className="w-8 h-8 text-blue-500" />, link: "/ai/quiz", color: "bg-blue-50 border-blue-100" },
    { title: "3D Concept Visualizer", description: "Understand complex concepts with AI-generated 3D interactive models.", icon: <Box className="w-8 h-8 text-purple-500" />, link: "/ai/3d", color: "bg-purple-50 border-purple-100" },
    { title: "Live Virtual Classes", description: "Join real-time video classes with your teachers and peers.", icon: <Video className="w-8 h-8 text-emerald-500" />, link: "/ai/class", color: "bg-emerald-50 border-emerald-100" },
    { title: "AI Tutor Chat", description: "Ask subject-specific questions and get instant, detailed explanations.", icon: <MessageSquare className="w-8 h-8 text-amber-500" />, link: "/ai/ask", color: "bg-amber-50 border-amber-100" },
  ];

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
      <div className="mb-12 text-center mt-8">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl font-bold tracking-tight text-neutral-900 mb-4">
          Welcome to <span className="text-indigo-600">EduVision AI</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-xl text-neutral-600 max-w-2xl mx-auto">
          Your personalized, AI-powered learning platform. Explore interactive 3D models, generate custom quizzes, and join live classes.
        </motion.p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + index * 0.1 }}>
            <Link to={feature.link} className={`block p-8 rounded-3xl border ${feature.color} hover:shadow-lg transition-all duration-300 group`}>
              <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm mb-6">{feature.icon}</div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-2">{feature.title}</h2>
              <p className="text-neutral-600 mb-6">{feature.description}</p>
              <div className="flex items-center text-sm font-semibold text-neutral-900 group-hover:text-indigo-600 transition-colors">
                Explore Feature <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}