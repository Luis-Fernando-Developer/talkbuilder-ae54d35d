import { useState, useEffect } from "react";
import { SiWhatsapp } from "@icons-pack/react-simple-icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { CheckCircle2, XCircle, RefreshCw, Trash2, Loader2, QrCode } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import { useToast } from "../../../../hooks/use-toast";
import { supabaseClient as supabase } from "../../../../lib/supabaseClient";
import { evoApi } from "../../../../services/evolutionApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";

export default function WhatsAppConfig() {
  const { currentWorkspace } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [instanceName, setInstanceName] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentWorkspace?.id) {
      loadConnections();
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [currentWorkspace?.id]);

  const loadConnections = async () => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_connections")
        .select("*")
        .eq("workspace_id", currentWorkspace?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (err) {
      console.error("Erro ao carregar conexões:", err);
    } finally {
      setLoading(false);
    }
  };

  const createInstance = async () => {
    if (!instanceName.trim()) {
      toast({ title: "Dê um nome para a instância", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const result = await evoApi.createInstance(instanceName);
      
      const { error } = await supabase.from("whatsapp_connections").insert({
        workspace_id: currentWorkspace?.id,
        instance_name: instanceName,
        status: "disconnected",
        settings: result.instance,
      });

      if (error) throw error;

      toast({ title: "Instância criada com sucesso!" });
      setInstanceName("");
      loadConnections();
      
      if (result.qrcode?.base64) {
        setQrCodeData(result.qrcode.base64);
        setShowQrModal(true);
        startPolling(instanceName);
      }
    } catch (err: any) {
      toast({ title: "Erro ao criar instância", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const startPolling = (name: string) => {
    if (pollInterval) clearInterval(pollInterval);
    
    const interval = setInterval(async () => {
      try {
        const status = await evoApi.getInstanceStatus(name);
        if (status?.instance?.state === "open") {
          toast({ title: "WhatsApp conectado!", variant: "default" });
          setShowQrModal(false);
          setQrCodeData(null);
          loadConnections();
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Erro no polling:", err);
      }
    }, 5000);
    
    setPollInterval(interval);
  };

  const handleConnect = async (name: string) => {
    try {
      setQrCodeData(null);
      setShowQrModal(true);
      const result = await evoApi.getQrCode(name);
      if (result?.base64) {
        setQrCodeData(result.base64);
        startPolling(name);
      } else if (result?.code === "instance_already_connected") {
          toast({ title: "Instância já está conectada" });
          setShowQrModal(false);
          loadConnections();
      }
    } catch (err) {
      toast({ title: "Erro ao buscar QR Code", variant: "destructive" });
      setShowQrModal(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm("Tem certeza que deseja remover esta conexão?")) return;

    try {
      await evoApi.deleteInstance(name);
      const { error } = await supabase.from("whatsapp_connections").delete().eq("id", id);
      if (error) throw error;
      
      toast({ title: "Conexão removida" });
      loadConnections();
    } catch (err) {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  const handleRefreshStatus = async (name: string) => {
    try {
      const status = await evoApi.getInstanceStatus(name);
      const newState = status?.instance?.state === "open" ? "connected" : "disconnected";
      
      await supabase
        .from("whatsapp_connections")
        .update({ status: newState })
        .eq("instance_name", name);
        
      loadConnections();
      toast({ title: "Status atualizado" });
    } catch (err) {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  };

  return (
    <Card className='border shadow-sm'>
      <CardHeader className='pb-4'>
        <div className='flex items-center gap-3'>
          <div className='p-2.5 h-fit w-fit rounded-xl bg-green-50'>
            <SiWhatsapp className='w-5 h-5 text-green-600'/>
          </div>
          <div>
            <CardTitle className="text-xl">WhatsApp</CardTitle>
            <CardDescription>Conecte seu chatbot ao WhatsApp via Evolution API</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4 p-4 border rounded-xl bg-gray-50/50">
          <Label className="text-sm font-medium">Nova Conexão</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Nome da instância (ex: comercial-zap)"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              className="bg-white"
            />
            <Button onClick={createInstance} disabled={creating} className="bg-green-600 hover:bg-green-700">
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Criar Instância
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium px-1">Suas Instâncias</Label>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed rounded-xl text-muted-foreground bg-white">
              Nenhuma instância ativa. Crie uma acima para começar.
            </div>
          ) : (
            connections.map((conn) => (
              <div key={conn.id} className="flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm hover:border-green-200 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${conn.status === 'connected' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    <SiWhatsapp className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{conn.instance_name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      {conn.status === "connected" ? (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-green-600 uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" /> Online
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                          <XCircle className="w-3 h-3" /> Offline
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleRefreshStatus(conn.instance_name)} title="Atualizar status" className="h-8 w-8 text-gray-500">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  
                  {conn.status !== "connected" && (
                    <Button variant="outline" size="sm" onClick={() => handleConnect(conn.instance_name)} className="h-8 border-green-200 text-green-700 hover:bg-green-50">
                      <QrCode className="w-3.5 h-3.5 mr-1.5" />
                      Conectar
                    </Button>
                  )}
                  
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-destructive" onClick={() => handleDelete(conn.id, conn.instance_name)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
            <DialogDescription>
              Escaneie o código abaixo com o seu WhatsApp para realizar a conexão.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg border-2 border-dashed">
            {qrCodeData ? (
              <div className="bg-white p-2 rounded-lg shadow-sm border">
                <img src={qrCodeData} alt="WhatsApp QR Code" className="w-64 h-64" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10">
                <Loader2 className="w-10 h-10 animate-spin text-green-600" />
                <p className="text-sm font-medium text-gray-500">Gerando QR Code...</p>
              </div>
            )}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600 font-medium">
                Aguardando leitura do código...
              </p>
              <p className="text-xs text-gray-400 px-4">
                O painel será atualizado automaticamente assim que o dispositivo for pareado.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
