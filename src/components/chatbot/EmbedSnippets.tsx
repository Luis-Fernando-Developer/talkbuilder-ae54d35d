import React, { useEffect, useState } from 'react';

export function EmbedSnippets({ publicUrl, botName = 'Bot' }: EmbedSnippetsProps) {
  const [active, setActive] = useState<Platform>('wordpress');
  const [copiedPlatform, setCopiedPlatform] = useState<Platform | null>(null);

  const handleCopy = async (platform: Platform) => {
    const snippet = buildSnippet(platform, publicUrl, botName);
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedPlatform(platform);
      toast.success('Código copiado!');
      setTimeout(() => setCopiedPlatform(null), 2000);
    } catch (err) {
      console.error('clipboard error', err);
      toast.error('Não foi possível copiar.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Incorporar em outras plataformas</Label>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">URL base do embed</Label>
        <Input value={publicUrl} readOnly className="text-xs bg-muted" />
      </div>

      <Tabs value={active} onValueChange={(v: string) => setActive(v as Platform)} className="w-full">
        <TabsList className="grid grid-cols-4 sm:grid-cols-7 h-auto gap-1 bg-muted/40 p-1">
          {PLATFORMS.map((p) => {
            const Icon = p.icon;
            return (
              <TabsTrigger
                key={p.id}
                value={p.id}
                className="flex flex-col items-center gap-1 py-2 text-[11px] data-[state=active]:bg-background"
              >
                <Icon className="w-4 h-4" />
                <span className="leading-none">{p.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {PLATFORMS.map((p) => {
          if (p.id === 'whatsapp') {
            return (
              <TabsContent key={p.id} value={p.id} className="mt-3">
                <div className="rounded-lg border border-dashed p-10 text-center text-sm space-y-2">
                  <SiWhatsapp className="w-8 h-8 mx-auto text-green-600" />
                  <p className="font-medium text-lg">WhatsApp em breve</p>
                  <p className="text-muted-foreground">
                    Estamos trabalhando para liberar a integração direta com WhatsApp.
                  </p>
                </div>
              </TabsContent>
            );
          }
          const snippet = buildSnippet(p.id, publicUrl, botName);
          const isCopied = copiedPlatform === p.id;
          return (
            <TabsContent key={p.id} value={p.id} className="mt-3 space-y-2">
              <div className="relative">
                <pre className="text-[11px] leading-relaxed bg-muted rounded-md p-3 max-h-64 overflow-auto whitespace-pre-wrap break-all border border-border">
                  <code>{snippet}</code>
                </pre>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCopy(p.id)}
                  className="absolute top-2 right-2 h-7 gap-1 text-xs"
                >
                  {isCopied ? (
                    <><Check className="w-3 h-3 text-green-500" /> Copiado</>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copiar</>
                  )}
                </Button>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
