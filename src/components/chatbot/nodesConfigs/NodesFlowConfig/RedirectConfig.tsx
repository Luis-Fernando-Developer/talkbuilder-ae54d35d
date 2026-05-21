import { useState, useEffect } from "react";
import { NodeConfig, Container, Node, NodeType } from "@/types/chatbot";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info, Loader2, MessageSquare, Database, Share2, Box, HelpCircle } from "lucide-react";
import { SkillConfig } from "../SkillConfig";
import { getSupabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";

interface RedirectConfigProps {
  config: NodeConfig;
  setConfig: (config: NodeConfig) => void;
  containers: Container[];
}

interface PublishedBot {
  id: string;
  name: string;
}

// Module-level caches: persistem entre aberturas do diálogo de configuração
const botsCache = new Map<string, PublishedBot[]>();
const containersCache = new Map<string, Container[]>();
const inflight = new Map<string, Promise<any>>();

export const RedirectConfig = ({ config, setConfig }: RedirectConfigProps) => {
  const { currentWorkspace } = useAuth();
  const wsId = currentWorkspace?.id;

  const [publishedBots, setPublishedBots] = useState<PublishedBot[]>(
    () => (wsId && botsCache.get(wsId)) || []
  );
  const [targetFlowContainers, setTargetFlowContainers] = useState<Container[]>(
    () => (config.targetFlow && containersCache.get(config.targetFlow)) || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);
  const [loadedWorkspaceId, setLoadedWorkspaceId] = useState<string | null>(
    wsId && botsCache.has(wsId) ? wsId : null
  );

  const selectedBotFallback = config.targetFlow
    ? [{ id: config.targetFlow, name: config.targetFlowName || config.targetFlow }]
    : [];

  const botOptions = publishedBots.some((bot) => bot.id === config.targetFlow)
    ? publishedBots
    : [...selectedBotFallback, ...publishedBots];

  const fetchPublishedBots = async (force = false) => {
    const id = currentWorkspace?.id;
    if (!id) return;
    if (!force && (isLoading || loadedWorkspaceId === id)) return;

    // Cache hit
    const cached = botsCache.get(id);
    if (cached && !force) {
      setPublishedBots(cached);
      setLoadedWorkspaceId(id);
      return;
    }

    setIsLoading(true);
    try {
      const key = `bots:${id}`;
      let promise = inflight.get(key);
      if (!promise) {
        const supabase = getSupabase();
        promise = Promise.resolve(
          supabase
            .from("chatbot_flows")
            .select("id, name")
            .eq("workspace_id", id)
            .eq("is_published", true)
            .order("name", { ascending: true })
        );
        inflight.set(key, promise);
      }
      const { data, error } = await promise!;
      inflight.delete(key);

      if (error) throw error;

      const bots = (data || []).map((bot: any) => ({ id: bot.id, name: bot.name }));
      botsCache.set(id, bots);
      setPublishedBots(bots);
      setLoadedWorkspaceId(id);

      if (config.targetFlow) {
        const match = bots.find((b: PublishedBot) => b.id === config.targetFlow);
        if (match && match.name !== config.targetFlowName) {
          setConfig({ ...config, targetFlowName: match.name });
        }
      }
    } catch (error) {
      console.error("Erro ao buscar bots publicados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFlowContainers = async (flowId: string) => {
    if (!flowId) return;

    const cached = containersCache.get(flowId);
    if (cached) {
      setTargetFlowContainers(cached);
      return;
    }

    setIsLoadingNodes(true);
    try {
      const key = `containers:${flowId}`;
      let promise = inflight.get(key);
      if (!promise) {
        const supabase = getSupabase();
        promise = Promise.resolve(
          supabase
            .from("chatbot_flows")
            .select("published_containers, draft_containers")
            .eq("id", flowId)
            .maybeSingle()
        );
        inflight.set(key, promise);
      }
      const { data, error } = await promise!;
      inflight.delete(key);

      if (error) throw error;
      if (data) {
        const containers: Container[] = (data.published_containers || data.draft_containers || []) as Container[];
        containersCache.set(flowId, containers);
        setTargetFlowContainers(containers);
      }
    } catch (error) {
      console.error("Erro ao buscar blocos do fluxo:", error);
    } finally {
      setIsLoadingNodes(false);
    }
  };

  // Pré-carrega bots e blocos assim que o componente monta para evitar
  // a espera ao abrir os selects.
  useEffect(() => {
    fetchPublishedBots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id]);

  useEffect(() => {
    if (config.targetFlow) {
      fetchFlowContainers(config.targetFlow);
    }
  }, [config.targetFlow]);

  const handleFlowChange = (value: string) => {
    const selectedBot = botOptions.find((bot) => bot.id === value);

    setConfig({ 
      ...config, 
      targetFlow: value,
      targetFlowName: selectedBot?.name || value,
      startNodeId: undefined,
      startContainerId: undefined,
      startContainerName: undefined,
    });
  };

  const handleStartContainerChange = (value: string) => {
    if (value === "default") {
      setConfig({
        ...config,
        startContainerId: undefined,
        startContainerName: undefined,
        startNodeId: undefined,
      });
      return;
    }
    const container = targetFlowContainers.find((c) => c.id === value);
    const firstNodeId = container?.nodes?.[0]?.id;
    setConfig({
      ...config,
      startContainerId: value,
      startContainerName: container?.nameContainer || `Bloco #${value.slice(-4)}`,
      // Runtime usa startNodeId como ponto de entrada
      startNodeId: firstNodeId,
    });
  };

  const getContainerLabel = (container: Container, index: number) => {
    return container.nameContainer || `Bloco #${container.id.slice(-4)} (${index + 1})`;
  };

  const getNodeIcon = (type: NodeType) => {
    if (type.startsWith("bubble-")) return <MessageSquare className="h-3 w-3" />;
    if (type.startsWith("input-")) return <Box className="h-3 w-3" />;
    if (type === "set-variable" || type === "script") return <Database className="h-3 w-3" />;
    if (type === "redirect" || type === "go-to" || type === "start") return <Share2 className="h-3 w-3" />;
    return <HelpCircle className="h-3 w-3" />;
  };

  const getNodeLabel = (node: Node) => {
    const typeLabel = node.type.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    const content = node.config.content || node.config.label || node.config.name || "";
    const truncatedContent = content.length > 20 ? content.slice(0, 17) + "..." : content;
    return `${typeLabel}${truncatedContent ? `: ${truncatedContent}` : ""}`;
  };

  const selectedContainer = targetFlowContainers.find(c => c.id === config.startContainerId);

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label>Selecionar Fluxo de Destino</Label>
        <Select 
          value={config.targetFlow || ""} 
          onValueChange={handleFlowChange} 
          onOpenChange={(open) => {
            if (open) fetchPublishedBots();
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={isLoading ? "Carregando fluxos..." : "Selecione um bot/fluxo"} />
          </SelectTrigger>
          <SelectContent>
            {botOptions.length > 0 ? (
              botOptions.map((bot) => (
                <SelectItem key={bot.id} value={bot.id}>
                  {bot.name}
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-xs text-muted-foreground text-center">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  "Nenhum bot publicado encontrado"
                )}
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {config.targetFlow && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Bloco de Entrada (Opcional)</Label>
            <Select 
              value={config.startContainerId || "default"} 
              onValueChange={handleStartContainerChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingNodes ? "Carregando blocos..." : "Início padrão"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Início padrão (Bloco Start)</SelectItem>
                {targetFlowContainers.map((container, index) => (
                  <SelectItem key={container.id} value={container.id}>
                    {getContainerLabel(container, index)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {config.startContainerId && selectedContainer && selectedContainer.nodes?.length > 1 && (
            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
              <Label className="text-xs">Iniciar a partir de um Node específico</Label>
              <Select 
                value={config.startNodeId || ""} 
                onValueChange={(nodeId) => setConfig({ ...config, startNodeId: nodeId })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Primeiro node do bloco" />
                </SelectTrigger>
                <SelectContent>
                  {selectedContainer.nodes.map((node) => (
                    <SelectItem key={node.id} value={node.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        {getNodeIcon(node.type)}
                        <span>{getNodeLabel(node)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Seletor avançado: pule etapas iniciais do bloco se necessário.
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Se não selecionado, o fluxo iniciará normalmente pelo bloco de "Start".
          </p>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          Direciona o fluxo atual para outro bot publicado.
        </p>
      </div>
      
      <SkillConfig config={config} setConfig={setConfig} />
    </div>
  );
};
