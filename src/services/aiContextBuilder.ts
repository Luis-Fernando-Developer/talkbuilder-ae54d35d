import { Message, PersistentMemory } from "../types/runtime";

interface BuildContextOptions {
  systemPrompt: string;
  history: Message[];
  persistentMemory: PersistentMemory;
  variables: Record<string, any>;
  knowledgeBase?: {
    kbFiles?: any[];
    kbFilesEnabled?: boolean;
    kbLinks?: any[];
    kbLinksEnabled?: boolean;
    knowledgeBaseId?: string;
  };
  tools?: any[];
  maxHistoryMessages?: number;
}

export const buildAgentContext = ({
  systemPrompt,
  history,
  persistentMemory,
  variables,
  knowledgeBase,
  tools,
  maxHistoryMessages = 15
}: BuildContextOptions) => {
  // 1. Truncamento inteligente do histórico
  const recentHistory = history.slice(-maxHistoryMessages);

  // 2. Formatação da memória persistente
  const memoryStr = Object.keys(persistentMemory).length > 0 
    ? `\n\n[MEMÓRIA DO USUÁRIO]\n${JSON.stringify(persistentMemory, null, 2)}`
    : "";

  // 3. Formatação das variáveis
  const varsStr = Object.keys(variables).length > 0
    ? `\n\n[VARIÁVEIS DO FLUXO]\n${JSON.stringify(variables, null, 2)}`
    : "";

  // 4. Formatação da Base de Conhecimento
  let kbStr = "";
  if (knowledgeBase) {
    const files = (knowledgeBase.kbFiles || [])
      .filter((f: any) => (knowledgeBase.kbFilesEnabled !== false) && f.content)
      .map((f: any) => `### Arquivo: ${f.name}\n${f.content}`)
      .join("\n\n");
    
    const links = (knowledgeBase.kbLinks || [])
      .filter((l: any) => (knowledgeBase.kbLinksEnabled !== false) && l.url)
      .map((l: any) => `- Link: ${l.url}`)
      .join("\n");

    if (files || links) {
      kbStr = `\n\n[BASE DE CONHECIMENTO]\nVocê deve priorizar as informações abaixo para responder ao usuário. Se a resposta não estiver aqui, use seu conhecimento geral, mas mencione que não encontrou nos documentos se for algo muito específico.\n\n${files}\n${links}`;
    }
  }

  // 5. Montagem do prompt do sistema
  const fullSystemPrompt = `${systemPrompt}${memoryStr}${varsStr}${kbStr}\n\nResponda sempre de forma natural e prestativa.`;

  console.log("[aiContextBuilder] Full System Prompt created. KB present:", !!kbStr);

  return {
    system: fullSystemPrompt,
    messages: recentHistory.map(msg => ({
      role: msg.role === "assistant" ? "assistant" : msg.role,
      content: msg.content
    }))
  };
};