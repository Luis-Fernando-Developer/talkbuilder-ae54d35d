import { NodeConfig } from "@/types/chatbot";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Braces } from "lucide-react";
import { useState, useRef } from "react";
import { VariableModal } from "../../VariableModal";

interface ScriptConfigProps {
  config: NodeConfig;
  setConfig: (config: NodeConfig) => void;
}

export const ScriptConfig = ({ config, setConfig }: ScriptConfigProps) => {
  const [variableModalOpen, setVariableModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleVariableSelect = (variableName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentCode = config.code || "";
    
    // Insert variable reference at cursor position
    const variableRef = `{{${variableName}}}`;
    const newCode = currentCode.substring(0, start) + variableRef + currentCode.substring(end);
    
    setConfig({ ...config, code: newCode });
    
    // Focus and set cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + variableRef.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Código JavaScript</Label>
        <div className="relative">
          <Textarea
            ref={textareaRef}
            id="code"
            placeholder="// Seu código aqui..."
            value={config.code || ""}
            onChange={(e) => setConfig({ ...config, code: e.target.value })}
            className="min-h-[150px] font-mono text-sm pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute bottom-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setVariableModalOpen(true)}
            title="Inserir variável"
          >
            <Braces className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="executeOnServer">Executar no Servidor</Label>
          <p className="text-xs text-muted-foreground">Requer Lovable Cloud</p>
        </div>
        <Switch
          id="executeOnServer"
          checked={config.executeOnServer || false}
          onCheckedChange={(checked) => setConfig({ ...config, executeOnServer: checked })}
        />
      </div>
      <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-border">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Como usar (Estilo Typebot):</p>
        <div className="space-y-1 text-[11px] text-muted-foreground">
          <p>• <strong>Variáveis:</strong> <code className="bg-background px-1 rounded">variables.nome</code></p>
          <p>• <strong>Salvar resultado:</strong> <code className="bg-background px-1 rounded">return {"{ result: 10 }"}</code></p>
          <p>• <strong>Exemplo:</strong> <code className="bg-background px-1 rounded font-mono">return {"{ soma: variables.n1 + variables.n2 }"}</code></p>
        </div>
      </div>

      <VariableModal
        open={variableModalOpen}
        onClose={() => setVariableModalOpen(false)}
        onSelect={handleVariableSelect}
      />
    </div>
  );
};
