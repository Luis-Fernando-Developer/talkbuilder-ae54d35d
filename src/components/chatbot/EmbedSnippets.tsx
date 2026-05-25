import React, { useEffect, useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Globe,
  FileCode,
  Boxes,
  ShoppingBag,
} from 'lucide-react';
import { SiWhatsapp } from '@icons-pack/react-simple-icons';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface EmbedSnippetsProps {
  /** URL pública completa do bot, ex: https://app.com/#/slug/flow/publicId */
  publicUrl: string;
  /** Nome do bot, usado em títulos default */
  botName?: string;
}

type Platform =
  | 'whatsapp'
  | 'wordpress'
  | 'next'
  | 'react'
  | 'iframe'
  | 'html'
  | 'shopify';

interface PlatformDef {
  id: Platform;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PLATFORMS: PlatformDef[] = [
  { id: 'wordpress', label: 'WordPress', icon: Globe },
  { id: 'shopify', label: 'Shopify', icon: ShoppingBag },
  { id: 'html', label: 'HTML/JS', icon: FileCode },
  { id: 'iframe', label: 'Iframe', icon: Code2 },
  { id: 'next', label: 'Next.js', icon: Boxes },
  { id: 'react', label: 'React', icon: Boxes },
  { id: 'whatsapp', label: 'WhatsApp', icon: SiWhatsapp as any },
];

function buildSnippet(platform: Platform, publicUrl: string, botName: string): string {
  const safeName = botName.replace(/`/g, '');
  const title = `Chatbot - ${safeName}`;

  switch (platform) {
    case 'wordpress':
    case 'shopify':
    case 'html':
      return `<!-- TalkBuilder Chatbot -->
<div id="talkbuilder-chatbot"></div>
<style>
  #talkbuilder-fab { position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    width: 60px; height: 60px; border-radius: 50%; background: #7c3aed;
    color: #fff; border: none; cursor: pointer; box-shadow: 0 8px 24px rgba(0,0,0,.2);
    display: flex; align-items: center; justify-content: center; font-size: 28px; }
  #talkbuilder-frame { position: fixed; bottom: 96px; right: 24px; z-index: 9999;
    width: 380px; height: 600px; max-width: calc(100vw - 32px); max-height: calc(100vh - 120px);
    border: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 16px 48px rgba(0,0,0,.25);
    display: none; background: #fff; }
  #talkbuilder-frame.open { display: block; }
</style>
<button id="talkbuilder-fab" aria-label="Abrir chat">💬</button>
<iframe id="talkbuilder-frame" src="${publicUrl}" title="${title}"></iframe>
<script>
  (function () {
    var fab = document.getElementById('talkbuilder-fab');
    var frame = document.getElementById('talkbuilder-frame');
    fab.addEventListener('click', function () { frame.classList.toggle('open'); });
  })();
</script>`;

    case 'iframe':
      return `<iframe
  src="${publicUrl}"
  title="${title}"
  width="100%"
  height="600"
  style="border:0; border-radius:12px; overflow:hidden;"
  allow="clipboard-write; microphone; camera"
></iframe>`;

    case 'next':
      return `// app/components/TalkBuilderChat.tsx
'use client';
export default function TalkBuilderChat() {
  return (
    <iframe
      src="${publicUrl}"
      title="${title}"
      style={{ width: '100%', height: '600px', border: 0, borderRadius: 12, overflow: 'hidden' }}
      allow="clipboard-write; microphone; camera"
    />
  );
}`;

    case 'react':
      return `// TalkBuilderChat.jsx
export default function TalkBuilderChat() {
  return (
    <iframe
      src="${publicUrl}"
      title="${title}"
      style={{ width: '100%', height: 600, border: 0, borderRadius: 12, overflow: 'hidden' }}
      allow="clipboard-write; microphone; camera"
    />
  );
}`;
    case 'whatsapp':
      return '';
  }
}

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