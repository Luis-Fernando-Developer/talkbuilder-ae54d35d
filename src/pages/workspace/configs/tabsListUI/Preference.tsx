import { useState } from 'react'
import { AlertCircle, Globe, LucideBell, Mail, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Label } from '../../../../components/ui/label'
import { Switch } from '../../../../components/ui/switch'

type NotificationKey = 'email' | 'push' | 'system' | 'product' | 'marketing'

interface NotificationItem {
  key: NotificationKey
  icon: React.ElementType
  title: string
  description: string
}

const items: NotificationItem[] = [
  { key: 'email', icon: Mail, title: 'Notificações por Email', description: 'Receba notificações no seu email' },
  { key: 'push', icon: LucideBell, title: 'Notificações Push', description: 'Receba notificações no seu navegador' },
  { key: 'system', icon: AlertCircle, title: 'Alerta de Sistema', description: 'Erros, limites de usos e alertas criticos' },
  { key: 'product', icon: MessageSquare, title: 'Atualizações de Produto', description: 'Novos recursos e melhorias' },
  { key: 'marketing', icon: Globe, title: 'Email Marketing', description: 'Promoções e ofertas especiais' },
]

export default function Preference() {
  const [prefs, setPrefs] = useState<Record<NotificationKey, boolean>>({
    email: true,
    push: true,
    system: true,
    product: false,
    marketing: false,
  })

  const toggle = (key: NotificationKey) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div>
      <Card className="p-4 flex flex-col">
        <CardHeader>
          <CardTitle className="text-2xl">Preferências de Notificações</CardTitle>
          <CardDescription>Escolha como você quer ser notificado</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {items.map(({ key, icon: Icon, title, description }) => (
            <div
              key={key}
              className="bg-gray-600/20 flex justify-between items-center gap-4 p-4 rounded-lg"
            >
              <div className="flex gap-3 items-center min-w-0 flex-1">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-600/60 text-white flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0 text-left">
                  <Label htmlFor={`notif-${key}`} className="cursor-pointer truncate">
                    {title}
                  </Label>
                  <CardDescription className="truncate">{description}</CardDescription>
                </div>
              </div>
              <Switch
                id={`notif-${key}`}
                checked={prefs[key]}
                onCheckedChange={() => toggle(key)}
                className="flex-shrink-0"
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
