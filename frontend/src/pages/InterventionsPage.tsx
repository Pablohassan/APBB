import { useMemo, useState } from 'react';
import { useApiQuery } from '../hooks/use-api';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { motion } from 'framer-motion';

interface Intervention {
  id: string;
  title: string;
  status: string;
  priority: 'STANDARD' | 'URGENT';
  type: string;
  scheduledStart?: string;
  case: {
    client: { name: string };
    site: { label: string; city: string };
  };
}

const tabOptions = [
  { id: 'ALL', label: 'Toutes' },
  { id: 'URGENT', label: 'Urgent' },
  { id: 'PENDING_ASSIGNMENT', label: 'À prendre' },
  { id: 'ASSIGNED', label: 'Assignées' },
  { id: 'ON_SITE', label: 'En cours' },
];

export function InterventionsPage() {
  const { data, isLoading } = useApiQuery<Intervention[]>(['interventions'], '/interventions');
  const [tab, setTab] = useState('ALL');

  const filtered = useMemo(() => {
    if (!data) return [];
    if (tab === 'ALL') return data;
    if (tab === 'URGENT') return data.filter((item) => item.priority === 'URGENT');
    return data.filter((item) => item.status === tab);
  }, [data, tab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Interventions</h1>
          <p className="text-sm text-slate-500">
            Vue technicien & bureau pour suivre l'urgence, les statuts et accéder à la fiche terrain.
          </p>
        </div>
        <Button variant="secondary">Importer planning (.ics)</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabOptions.map((option) => (
          <Button
            key={option.id}
            onClick={() => setTab(option.id)}
            variant={tab === option.id ? 'default' : 'secondary'}
            className="text-xs"
          >
            {option.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className={item.priority === 'URGENT' ? 'border-red-200' : undefined}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold">{item.title}</h2>
                    <Badge variant={item.priority === 'URGENT' ? 'destructive' : 'success'}>
                      {item.priority === 'URGENT' ? 'Urgent' : 'Standard'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {item.case.client.name} • {item.case.site.label}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-slate-600">
                  <div>Statut : {item.status}</div>
                  <div>Type : {item.type}</div>
                  {item.scheduledStart && (
                    <div>
                      Prévu le :
                      {new Date(item.scheduledStart).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="ghost" className="flex-1">
                      Détails
                    </Button>
                    <Button size="sm" className="flex-1">
                      Changer statut
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-sm text-slate-500">Aucune intervention.</CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
