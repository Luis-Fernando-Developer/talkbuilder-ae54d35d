"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../../components/ui/card";

import { Button } from "../../../../components/ui/button";

import { FormInputField } from "../forms/components/FormInputField";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../../components/ui/select";
import { Trash2Icon } from "lucide-react";
import { useToast } from "../../../../hooks/use-toast";
import { Label } from "../../../../components/ui/label";
import { getSupabase } from "../../../../lib/supabaseClient";
import { useAuth } from "../../../../context/AuthContext";

const workspaceConfigSchema = z.object({
	workspaceName: z.string().min(2).max(100),
	fusoHours: z.string().min(2).max(100),
	language: z.string().min(2).max(100),
});

type WorkspaceConfigFormData = z.infer<typeof workspaceConfigSchema>;

const EMPTY: WorkspaceConfigFormData = {
	workspaceName: "",
	fusoHours: "",
	language: "",
};

export default function WorkspaceConfig() {
	const { toast } = useToast();
	const { user } = useAuth();
	const [loading, setLoading] = useState(true);

	const {
		register,
		handleSubmit,
		control,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<WorkspaceConfigFormData>({
		resolver: zodResolver(workspaceConfigSchema),
		defaultValues: EMPTY,
	});

	useEffect(() => {
		const supabase = getSupabase();
		if (!supabase || !user) {
			setLoading(false);
			return;
		}
		let cancelled = false;
		supabase
			.from("workspace_settings")
			.select("workspace_name,timezone,language")
			.eq("user_id", user.id)
			.maybeSingle()
			.then(({ data, error }) => {
				if (cancelled) return;
				if (error) console.error(error);
				if (data) {
					reset({
						workspaceName: data.workspace_name ?? "",
						fusoHours: data.timezone ?? "",
						language: data.language ?? "",
					});
				}
				setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [user, reset]);

	async function onSubmit(data: WorkspaceConfigFormData) {
		const supabase = getSupabase();
		if (!supabase || !user) return;
		const { error } = await supabase.from("workspace_settings").upsert({
			user_id: user.id,
			workspace_name: data.workspaceName,
			timezone: data.fusoHours,
			language: data.language,
		});
		if (error) {
			toast({ title: "Erro ao salvar", description: error.message });
			return;
		}
		toast({
			title: "Workspace Atualizado",
			description: "As Informações do workspace foram atualizadas com sucesso.",
		});
	}

	const members = [
		{ name: "Luis", email: "email@exemplo.com", role: "Admin" },
		{ name: "Maria", email: "maria@exemplo.com", role: "Membro" },
	];

	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardHeader>
					<CardTitle>Configurações do Workspace</CardTitle>
					<CardDescription>
						Configurações operacionais do seu ambiente de trabalho
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					{loading ? (
						<div className="text-sm text-gray-500">Carregando...</div>
					) : (
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
							<FormInputField
								label="Nome do Workspace"
								name="workspaceName"
								register={register}
								errors={errors}
								placeholder="Digite o Nome do Workspace"
							/>

							<div className="space-y-1">
								<Label>Fuso Horário</Label>
								<Controller
									name="fusoHours"
									control={control}
									render={({ field }) => (
										<Select onValueChange={field.onChange} value={field.value}>
											<SelectTrigger>
												<SelectValue placeholder="Selecione um fuso horário" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="america/saopaulo">
													America/Sao Paulo (GMT-3)
												</SelectItem>
												<SelectItem value="america/new_york">
													America/New York (GMT-5)
												</SelectItem>
												<SelectItem value="europe/london">
													Europe/London (GMT+0)
												</SelectItem>
												<SelectItem value="asia/tokyo">Asia/Tokyo (GMT+9)</SelectItem>
											</SelectContent>
										</Select>
									)}
								/>
								{errors.fusoHours && (
									<p className="text-red-500">{errors.fusoHours.message}</p>
								)}
							</div>
							<div className="space-y-1">
								<Label> Idioma</Label>
								<Controller
									name="language"
									control={control}
									render={({ field }) => (
										<Select onValueChange={field.onChange} value={field.value}>
											<SelectTrigger>
												<SelectValue placeholder="Selecione um idioma" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="BR">Brasil</SelectItem>
												<SelectItem value="EN">Inglês(us)</SelectItem>
												<SelectItem value="ES">Espanhol</SelectItem>
											</SelectContent>
										</Select>
									)}
								/>
								{errors.language && (
									<p className="text-red-500">{errors.language.message}</p>
								)}
							</div>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? "Salvando..." : "Salvar alterações"}
							</Button>
						</form>
					)}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<div className="flex justify-between items-center">
						<CardTitle>Membros da Equipe</CardTitle>
						<Button variant="default">Convidar</Button>
					</div>
					<CardDescription>
						Gerencie os membros da sua equipe, convites e permissões do seu
						workspace
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<div className="flex flex-col gap-2 justify-between ">
							{members.map((member, item) => (
								<div
									key={item}
									className="flex flex-col p-3 gap-2 rounded-2xl bg-gray-200/40 "
								>
									<div className="flex gap-4 items-center">
										<p className="font-semibold">{member.name}</p>
										<p className="text-sm text-muted-foreground">{member.email}</p>
									</div>
									<div className="flex items-center gap-2">
										<Select>
											<SelectTrigger>
												<SelectValue placeholder="Selecione uma permissão" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="admin">Admin</SelectItem>
												<SelectItem value="editor">Editor</SelectItem>
												<SelectItem value="viewer">Viewer</SelectItem>
											</SelectContent>
										</Select>
										<Button variant="destructive">
											<Trash2Icon />{" "}
										</Button>
									</div>
								</div>
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
