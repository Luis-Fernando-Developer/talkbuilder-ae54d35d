import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { CanvasEditor } from "@/components/chatbot/CanvasEditor";
import { Button } from "@/components/ui/button";
import type { Container, Edge } from "@/types/chatbot";

const STORAGE_PREFIX = "bot_flow_";

interface StoredFlow {
  containers: Container[];
  edges: Edge[];
}

function loadFlow(botId: string): StoredFlow {
  if (typeof window === "undefined") return { containers: [], edges: [] };
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${botId}`);
    if (!raw) return { containers: [], edges: [] };
    const parsed = JSON.parse(raw) as Partial<StoredFlow>;
    return {
      containers: parsed.containers ?? [],
      edges: parsed.edges ?? [],
    };
  } catch {
    return { containers: [], edges: [] };
  }
}

function saveFlow(botId: string, flow: StoredFlow) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `${STORAGE_PREFIX}${botId}`,
    JSON.stringify(flow)
  );
}

export default function BotPage() {
  const params = useParams();
  const navigate = useNavigate();
  const botId = (params.id as string) ?? "default";

  const [containers, setContainers] = useState<Container[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const flow = loadFlow(botId);
    setContainers(flow.containers);
    setEdges(flow.edges);
    setHydrated(true);
  }, [botId]);

  useEffect(() => {
    if (!hydrated) return;
    saveFlow(botId, { containers, edges });
  }, [botId, containers, edges, hydrated]);

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-950 z-50">
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-gray-800 text-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="text-white hover:bg-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <span className="text-sm opacity-70">Bot: {botId}</span>
      </div>
      <div className="flex-1 w-full">
        <CanvasEditor
          containers={containers}
          onContainersChange={setContainers}
          edges={edges}
          onEdgesChange={setEdges}
          onTest={() => {}}
        />
      </div>
    </div>
  );
}
