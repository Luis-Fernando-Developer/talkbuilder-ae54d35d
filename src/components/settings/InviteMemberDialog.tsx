import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { getSupabase } from "../../lib/supabaseClient";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/use-toast";
import { Copy, Loader2 } from "lucide-react";

export function InviteMemberDialog() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const { currentWorkspace, user } = useAuth();
  const { toast } = useToast();

  const handleInvite = async () => {
    if (!email || !user) {
      toast({
        title: "Atenção",
        description: "Certifique-se de que o e-mail está preenchido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase não configurado");

      // LOG PARA DEBUG: Verificar a URL do Supabase para saber qual banco está sendo usado
      const supabaseUrl = (supabase as any).supabaseUrl;
      console.log("Supabase Client URL:", supabaseUrl);

      let workspaceId = currentWorkspace?.id;
      
      if (!workspaceId) {
        const hash = window.location.hash;
        const cleanHash = hash.startsWith('#') ? hash.substring(1) : hash;
        const pathParts = cleanHash.split("/").filter(Boolean);
        const slugFromUrl = pathParts[0];

        if (!slugFromUrl || slugFromUrl === 'workspace' || slugFromUrl === 'invite') {
          throw new Error("Slug do workspace não identificado na URL.");
        }

        // TENTATIVA 1: Buscar diretamente pelo slug
        const { data: workspaceData, error: workspaceError } = await supabase
          .from("workspaces")
          .select("id")
          .eq("slug", slugFromUrl)
          .maybeSingle();

        if (workspaceData) {
          workspaceId = workspaceData.id;
        } else {
          // TENTATIVA 2: Se não encontrou, pode ser que o usuário não tenha permissão de ler a tabela 'workspaces'
          // Vamos tentar verificar se ele tem algum membro em 'workspace_members' para esse slug
          console.log("Slug não encontrado em 'workspaces', tentando via 'workspace_members'...");
          const { data: memberData, error: memberError } = await supabase
            .from("workspace_members")
            .select("workspace_id, workspaces(slug)")
            .limit(10);
          
          console.log("Dados de membros encontrados:", memberData);
          
          const foundMember = memberData?.find((m: any) => m.workspaces?.slug === slugFromUrl);
          if (foundMember) {
            workspaceId = foundMember.workspace_id;
          } else {
            // TENTATIVA 3: Último recurso - buscar qualquer workspace para ver se o banco está vazio ou inacessível
            const { data: allW } = await supabase.from("workspaces").select("slug").limit(5);
            const visibleSlugs = allW?.map(w => w.slug).join(", ") || "nenhum";
            
            throw new Error(`Workspace '${slugFromUrl}' não encontrado no banco ${supabaseUrl}. Slugs visíveis: ${visibleSlugs}. Verifique se você está no ambiente correto.`);
          }
        }
      }

      const { data, error } = await supabase
        .from("workspace_invitations")
        .insert({
          workspace_id: workspaceId,
          email: email.toLowerCase().trim(),
          role,
          invited_by: user.id,
        })
        .select("token")
        .single();

      if (error) {
        console.error("Erro ao inserir convite:", error);
        throw error;
      }

      const link = `${window.location.origin}/invite/${data.token}`;
      setInviteLink(link);
      
      toast({
        title: "Convite gerado!",
        description: `O convite para ${email} foi criado com sucesso.`,
      });
    } catch (error: any) {
      console.error("Catch error handleInvite:", error);
      toast({
        title: "Erro ao convidar",
        description: error.message + " (verifique se você está usando o Supabase do sistema)",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast({
        title: "Link copiado!",
        description: "O link do convite foi copiado para a área de transferência.",
      });
    }
  };

  const resetForm = () => {
    setEmail("");
    setRole("editor");
    setInviteLink(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
          Convidar Membro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Convidar para a Equipe</DialogTitle>
          <DialogDescription>
            Envie um convite para que novos membros se juntem ao seu workspace.
          </DialogDescription>
        </DialogHeader>
        
        {!inviteLink ? (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Cargo</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-700">
              Convite criado! Envie o link abaixo para o novo membro:
            </div>
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="bg-gray-50" />
              <Button size="icon" variant="outline" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {!inviteLink ? (
            <Button onClick={handleInvite} disabled={loading || !email}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gerar Convite
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
