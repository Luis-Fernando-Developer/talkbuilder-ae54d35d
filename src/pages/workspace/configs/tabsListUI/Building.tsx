"use client";

import { Camera, Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CompanyForm } from "../forms/CompanyForm";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../../components/ui/card";
import { Separator } from "../../../../components/ui/separator";
import { useAuth } from "../../../../context/AuthContext";
import { useToast } from "../../../../hooks/use-toast";
import { getSupabase } from "../../../../lib/supabaseClient";
import { getInitials } from "../../../../lib/initials";

export default function Building() {
	const { user } = useAuth();
	const { toast } = useToast();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [logoUrl, setLogoUrl] = useState<string | null>(null);
	const [companyName, setCompanyName] = useState<string>("");
	const [uploading, setUploading] = useState(false);

	useEffect(() => {
		const supabase = getSupabase();
		if (!supabase || !user) return;
		let cancelled = false;
		supabase
			.from("companies")
			.select("name,logo_url")
			.eq("user_id", user.id)
			.maybeSingle()
			.then(({ data, error }) => {
				if (cancelled) return;
				if (error) {
					console.error(error);
					return;
				}
				setLogoUrl(data?.logo_url ?? null);
				setCompanyName(data?.name ?? "");
			});
		return () => {
			cancelled = true;
		};
	}, [user]);

	async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file || !user) return;
		const supabase = getSupabase();
		if (!supabase) return;

		if (file.size > 2 * 1024 * 1024) {
			toast({ title: "Arquivo muito grande", description: "Máx. 2MB" });
			return;
		}

		setUploading(true);
		const ext = file.name.split(".").pop() || "png";
		const path = `${user.id}/logo-${Date.now()}.${ext}`;
		const { error: upErr } = await supabase.storage
			.from("company-logos")
			.upload(path, file, { upsert: true, contentType: file.type });

		if (upErr) {
			setUploading(false);
			toast({ title: "Erro ao enviar logo", description: upErr.message });
			return;
		}

		const { data: pub } = supabase.storage
			.from("company-logos")
			.getPublicUrl(path);
		const url = pub.publicUrl;

		const { error: updErr } = await supabase
			.from("companies")
			.upsert({ user_id: user.id, logo_url: url });
		setUploading(false);

		if (updErr) {
			toast({ title: "Erro ao salvar logo", description: updErr.message });
			return;
		}
		setLogoUrl(url);
		toast({ title: "Logo atualizada" });
		if (fileInputRef.current) fileInputRef.current.value = "";
	}

	async function handleLogoRemove() {
		if (!user) return;
		const supabase = getSupabase();
		if (!supabase) return;
		setUploading(true);

		try {
			const { data: list } = await supabase.storage
				.from("company-logos")
				.list(user.id);
			if (list && list.length > 0) {
				await supabase.storage
					.from("company-logos")
					.remove(list.map((f) => `${user.id}/${f.name}`));
			}
		} catch (err) {
			console.warn("falha ao limpar logos antigas:", err);
		}

		const { error: updErr } = await supabase
			.from("companies")
			.upsert({ user_id: user.id, logo_url: null });
		setUploading(false);

		if (updErr) {
			toast({ title: "Erro ao remover logo", description: updErr.message });
			return;
		}
		setLogoUrl(null);
		toast({ title: "Logo removida" });
	}

	const initials = getInitials(companyName, "EM");

	return (
		<div>
			<Card>
				<CardHeader>
					<CardTitle>Dados da Empresa</CardTitle>
					<CardDescription>
						Gerencie sua empresa, workspace e preferências
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="relative flex w-full space-x-4 items-center">
						<div className="relative w-fit rounded-full p-1">
							{logoUrl ? (
								<img
									src={logoUrl}
									alt="Logo da empresa"
									className="w-24 h-24 rounded-full object-cover border-2 border-[#06B6D4]"
								/>
							) : (
								<div className="w-24 h-24 rounded-full bg-[#06B6D4] flex items-center justify-center text-white text-2xl font-semibold border-2 border-[#06B6D4] select-none">
									{initials}
								</div>
							)}
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								disabled={uploading}
								className="absolute -bottom-0 -right-1 w-8 h-8 text-white border-2 border-white bg-[#06B6D4] rounded-full p-1.5 cursor-pointer disabled:opacity-60"
								title={logoUrl ? "Trocar logo" : "Adicionar logo"}
							>
								{uploading ? (
									<Loader2 className="w-full h-full animate-spin" />
								) : (
									<Camera className="w-full h-full" />
								)}
							</button>
							{logoUrl && !uploading && (
								<button
									type="button"
									onClick={handleLogoRemove}
									disabled={uploading}
									className="absolute -bottom-0 -left-1 w-8 h-8 text-white border-2 border-white bg-red-500 hover:bg-red-600 rounded-full p-1.5 cursor-pointer disabled:opacity-60"
									title="Remover logo"
								>
									<Trash2 className="w-full h-full" />
								</button>
							)}
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={handleLogoChange}
							/>
						</div>
						<div className="flex-1">
							<h4 className="text-lg ">Logo da Empresa</h4>
							<p className="text-sm text-gray-500">PNG, JPG até 2MB</p>
						</div>
					</div>
					<Separator />
					<div>
						<CompanyForm onNameChange={setCompanyName} />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
