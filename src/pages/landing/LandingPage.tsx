import LandingNav from "./sections/LandingNav";
import Hero from "./sections/Hero";
import Channels from "./sections/Channels";
import FeaturesBento from "./sections/FeaturesBento";
import HowItWorks from "./sections/HowItWorks";
import EditorReveal from "./sections/EditorReveal";
import SocialProof from "./sections/SocialProof";
import Pricing from "./sections/Pricing";
import Faq from "./sections/Faq";
import CtaFinal from "./sections/CtaFinal";
import LandingFooter from "./sections/LandingFooter";
import { isSupabaseConfigured, saveSystemSupabaseCreds } from "../../lib/supabaseClient";
import { useState } from "react";
import { AlertCircle, Database, Settings } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useToast } from "../../hooks/use-toast";

export default function LandingPage() {
	const { toast } = useToast();
	const [showConfig, setShowConfig] = useState(false);
	const [url, setUrl] = useState("");
	const [key, setKey] = useState("");
	const configured = isSupabaseConfigured();

	const handleSave = () => {
		if (!url || !key) {
			toast({ title: "Erro", description: "Preencha URL e Key", variant: "destructive" });
			return;
		}
		saveSystemSupabaseCreds({ url, anonKey: key });
		toast({ title: "Configurado!", description: "Recarregando para aplicar mudanças..." });
		setTimeout(() => window.location.reload(), 1500);
	};

	return (
		<div className="landing-page relative min-h-svh overflow-x-hidden">
			{!configured && (
				<div className="fixed bottom-4 right-4 z-[9999] max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
					<Alert variant="destructive" className="bg-destructive/10 border-destructive/20 backdrop-blur-sm">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle className="text-destructive font-bold">Banco Externo Não Detectado</AlertTitle>
						<AlertDescription className="text-xs text-muted-foreground mt-1">
							O TalkMap precisa das credenciais do seu Supabase externo para funcionar.
						</AlertDescription>
						<Dialog open={showConfig} onOpenChange={setShowConfig}>
							<DialogTrigger asChild>
								<Button size="sm" variant="outline" className="mt-2 w-full text-[10px] h-8 gap-2">
									<Settings className="h-3 w-3" />
									Configurar agora
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle className="flex items-center gap-2">
										<Database className="h-5 w-5" />
										Conectar Banco Externo
									</DialogTitle>
								</DialogHeader>
								<div className="space-y-4 py-4">
									<div className="space-y-2">
										<Label>Supabase URL</Label>
										<Input 
											placeholder="https://xyz.supabase.co" 
											value={url} 
											onChange={e => setUrl(e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<Label>Supabase Anon Key</Label>
										<Input 
											type="password" 
											placeholder="eyJhbG..." 
											value={key} 
											onChange={e => setKey(e.target.value)}
										/>
									</div>
									<p className="text-[10px] text-muted-foreground">
										Nota: Para produção, adicione como segredos (Secrets) 
										<code className="bg-muted px-1 rounded">VITE_SUPABASE_URL</code> e 
										<code className="bg-muted px-1 rounded">VITE_SUPABASE_ANON_KEY</code>.
									</p>
									<Button className="w-full" onClick={handleSave}>Salvar e Recarregar</Button>
								</div>
							</DialogContent>
						</Dialog>
					</Alert>
				</div>
			)}
			<LandingNav />
			<main>
				<Hero />
				<Channels />
				<FeaturesBento />
				<HowItWorks />
				<EditorReveal />
				<SocialProof />
				<Pricing />
				<Faq />
				<CtaFinal />
			</main>
			<LandingFooter />
		</div>
	);
}
