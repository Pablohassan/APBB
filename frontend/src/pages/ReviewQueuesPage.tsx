import { useState } from 'react';
import { useApiQuery } from '../hooks/use-api';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';

interface ReviewItem {
  id: string;
  queue: 'REPORT' | 'DEVICE_VALIDATION' | 'ASTREINTE' | 'QUOTE';
  label: string;
  notes?: string;
  createdAt: string;
}

const queueLabels: Record<ReviewItem['queue'], { title: string; description: string; badge: string }> = {
  REPORT: {
    title: 'Comptes rendus à valider',
    description: 'Validation des comptes rendus d’intervention avant envoi client.',
    badge: 'CR',
  },
  DEVICE_VALIDATION: {
    title: 'Installations à valider',
    description: 'Contrôle des nouveaux appareils proposés par les techniciens.',
    badge: 'Install',
  },
  ASTREINTE: {
    title: 'Astreintes à régulariser',
    description: 'Tickets saisis en mobilité pendant l’astreinte à régulariser.',
    badge: 'Astreinte',
  },
  QUOTE: {
    title: 'Devis à traiter',
    description: 'Demandes de devis à chiffrer ou envoyer au client.',
    badge: 'Devis',
  },
};

export function ReviewQueuesPage() {
  const { data, isLoading } = useApiQuery<ReviewItem[]>(['reviews'], '/reviews');
  const [activeQueue, setActiveQueue] = useState<ReviewItem['queue']>('REPORT');

  const list = (data ?? []).filter((item) => item.queue === activeQueue);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Files de validation</h1>
        <p className="text-sm text-slate-500">Pilotage du bureau : comptes rendus, installations, devis et astreintes.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(queueLabels) as ReviewItem['queue'][]).map((queue) => (
          <Card
            key={queue}
            className={activeQueue === queue ? 'border-blue-200 shadow-md' : 'cursor-pointer transition hover:border-blue-100'}
            onClick={() => setActiveQueue(queue)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">{queueLabels[queue].title}</h2>
                <Badge>{queueLabels[queue].badge}</Badge>
              </div>
              <p className="text-xs text-slate-500">{queueLabels[queue].description}</p>
            </CardHeader>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">{queueLabels[activeQueue].title}</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {list.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-100 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium text-slate-800">{item.label}</p>
                  <Button size="sm" variant="secondary">
                    Marquer comme traité
                  </Button>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Créé le {new Date(item.createdAt).toLocaleString('fr-FR')}
                </p>
                {item.notes && <p className="mt-2 text-xs text-slate-600">{item.notes}</p>}
              </div>
            ))}
            {list.length === 0 && <p className="text-sm text-slate-500">Aucun élément dans cette file.</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
