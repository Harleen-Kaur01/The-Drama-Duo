import { useState, useEffect, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { Loader2, Wand2, Box } from "lucide-react";
import { motion } from "motion/react";

interface SceneObject {
  type: "box" | "sphere" | "cylinder" | "cone";
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
}

export default function ModelGenerator() {
  const location = useLocation();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [objects, setObjects] = useState<SceneObject[] | null>(null);
  const [description, setDescription] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("prompt")?.trim() || "";
    if (query) {
      setPrompt(query);
      generateModel(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const generateModel = async (inputPrompt?: string) => {
    const promptText = inputPrompt ?? prompt;
    if (!promptText) return;
    if (!prompt) return;
    setLoading(true);
    setObjects(null);
    setDescription("");

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
        contents: `Generate a 3D scene representation of: ${prompt}. Use basic geometric shapes (box, sphere, cylinder, cone) to approximate the object or concept. Keep it simple but recognizable. Return as JSON with fields: explanation (string), objects (array of objects with fields type, position [x,y,z], scale [x,y,z], color as hex).`,
      });

      const jsonText = response.text || "{}";

      const extractJson = (text: string) => {
        let cleaned = text.trim();

        const fencedMatch = cleaned.match(/^```(?:json)?\n([\s\S]*?)\n```$/i);
        if (fencedMatch) {
          cleaned = fencedMatch[1].trim();
        }

        if (cleaned.startsWith("```") && cleaned.endsWith("```")) {
          cleaned = cleaned.slice(3, -3).trim();
        }

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
      setObjects(data.objects || []);
      setDescription(data.explanation || "");
    } catch (error) {
      console.error("Failed to generate model", error);
      alert("Failed to generate model. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const renderObject = (obj: SceneObject, i: number) => {
    const props = {
      position: obj.position,
      scale: obj.scale,
      castShadow: true,
      receiveShadow: true,
    };

    const material = <meshStandardMaterial color={obj.color} roughness={0.4} metalness={0.1} />;

    switch (obj.type) {
      case "box":
        return (
          <mesh key={i} {...props}>
            <boxGeometry args={[1, 1, 1]} />
            {material}
          </mesh>
        );
      case "sphere":
        return (
          <mesh key={i} {...props}>
            <sphereGeometry args={[0.5, 32, 32]} />
            {material}
          </mesh>
        );
      case "cylinder":
        return (
          <mesh key={i} {...props}>
            <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
            {material}
          </mesh>
        );
      case "cone":
        return (
          <mesh key={i} {...props}>
            <coneGeometry args={[0.5, 1, 32]} />
            {material}
          </mesh>
        );
      default:
        return (
          <mesh key={i} {...props}>
            <boxGeometry args={[1, 1, 1]} />
            {material}
          </mesh>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-73px)]">
      <div className="p-6 bg-white border-b border-neutral-200 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">3D Concept Visualizer</h1>
          <p className="text-neutral-600 mb-4 text-sm">Describe a concept or object, and AI will generate a 3D representation using basic shapes.</p>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="E.g., A simple house, A water molecule, A solar system"
              className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateModel()}
            />
            <button
              onClick={() => generateModel()}
              disabled={loading || !prompt}
              className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              Generate
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-neutral-100">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100/80 z-20 backdrop-blur-sm">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
            <p className="text-neutral-600 font-medium">Generating 3D Scene...</p>
          </div>
        )}

        {objects ? (
          <>
            <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
              <color attach="background" args={["#f5f5f5"]} />
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />
              <Suspense fallback={null}>
                <group position={[0, 0, 0]}>{objects.map((obj, i) => renderObject(obj, i))}</group>
                <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={20} blur={2} far={4} />
                <Environment preset="city" />
              </Suspense>
              <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
            </Canvas>

            {description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 max-w-2xl w-full px-4"
              >
                <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20">
                  <h3 className="font-semibold text-neutral-900 mb-2">AI Explanation</h3>
                  <p className="text-neutral-700 text-sm leading-relaxed">{description}</p>
                </div>
              </motion.div>
            )}
          </>
        ) : (
          !loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-md">
                <Box className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-500">Enter a prompt above to generate a 3D model.</p>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}