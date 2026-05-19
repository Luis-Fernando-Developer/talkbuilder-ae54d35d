import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getSupabase } from "../../../lib/supabaseClient";
import { useAuth } from "../../../context/AuthContext";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card";
import { Loader2, CheckCircle2, XCircle, LogIn } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<any>(null);
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!token) return;

    const fetchInvite = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;

        const { data, error } = await supabase
          .rpc("get_invitation_by_token", { invitation_token: token })
          .maybeSingle();
        const invite = data as any;

        if (error) throw error;
        if (!invite) {
          setError("Convite não encontrado.");
        } else if (invite.accepted_at || invite.status === "accepted") {
          setError("Este convite já foi utilizado.");
        } else if (new Date(invite.expires_at) < new Date()) {
          setError("Este convite expirou.");
        } else {
          setInviteData(invite);
        }
      } catch (err: any) {
        console.error("Erro ao carregar convite:", err);
        setError("Erro ao processar o convite.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!token || !user) return;

    setLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data, error } = await supabase.rpc("accept_invitation", {
        invitation_token: token
      });

      if (error) throw error;
      
      if (data.error) {
        toast({ title: "Erro", description: data.error, variant: "destructive" });
        return;
      }

      setAccepted(true);
      toast({ 
        title: "Sucesso!", 
        description: `Agora você é membro de ${data.workspace_name}` 
      });

      // Redirecionar após breve delay
      setTimeout(() => {
        navigate(`/${data.workspace_slug}/workspace`);
      }, 2000);

    } catch (err: any) {
      toast({ 
        title: "Erro ao aceitar", 
        description: err.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            {accepted ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : error ? (
              <XCircle className="h-6 w-6 text-red-600" />
            ) : (
              <CheckCircle2 className="h-6 w-6 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">Convite para Equipe</CardTitle>
          <CardDescription>
            {accepted 
              ? "Convite aceito com sucesso!" 
              : error 
                ? "Não foi possível processar seu convite."
                : `Você foi convidado para participar do workspace ${inviteData?.workspace_name}`
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center pb-6">
          {accepted ? (
            <p className="text-gray-600">Redirecionando você para o workspace...</p>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          ) : !user ? (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Você precisa estar logado para aceitar este convite. Se ainda não tem uma conta, crie uma agora.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild className="w-full">
                  <Link to={`/login?redirect=/invite/${token}`}>Entrar</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/signup?redirect=/invite/${token}`}>Criar Conta</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Logado como:</p>
              <p className="font-medium">{user.email}</p>
            </div>
          )}
        </CardContent>

        {!accepted && !error && user && (
          <CardFooter>
            <Button onClick={handleAccept} className="w-full" size="lg" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aceitar Convite
            </Button>
          </CardFooter>
        )}
        
        {error && (
          <CardFooter>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/">Voltar para o Início</Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
