import { useMemo } from 'react';
import { useApiQuery } from '../hooks/use-api';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { motion } from 'framer-motion';

interface CaseSummary {
  id: string;
  title: string;
  priority: 'STANDARD' | 'URGENT';
  status: string;
  client: { name: string };
  site: { city: string; label: string };
}

interface InterventionSummary {
  id: string;
  title: string;
  status: string;
  priority: 'STANDARD' | 'URGENT';
  type: string;
  scheduledStart?: string;
}

interface ReviewItem {
  id: string;
  queue: 'REPORT' | 'DEVICE_VALIDATION' | 'ASTREINTE' | 'QUOTE';
  label: string;
  createdAt: string;
}

const statusVariant: Record<string, { label: string; variant: 'default' | 'warning' | 'destructive' | 'success' | 'outline' }> = {
  OPEN: { label: 'Ouvert', variant: 'outline' },
  IN_PROGRESS: { label: 'En cours', variant: 'warning' },
  WAITING_CLIENT: { label: 'En attente client', variant: 'warning' },
  WAITING_PARTS: { label: 'En attente pièces', variant: 'warning' },
  REPORT_PENDING: { label: 'CR à valider', variant: 'warning' },
  COMPLETED: { label: 'Terminé', variant: 'success' },
  CLOSED: { label: 'Clôturé', variant: 'default' },
};

export function DashboardPage() {
  const { data: cases, isLoading: casesLoading } = useApiQuery<CaseSummary[]>(['cases'], '/cases');
  const { data: interventions, isLoading: interventionsLoading } = useApiQuery<InterventionSummary[]>(
    ['interventions'],
    '/interventions',
  );
  const { data: reviews, isLoading: reviewsLoading } = useApiQuery<ReviewItem[]>(['reviews'], '/reviews');

  const urgentInterventions = useMemo(
    () => interventions?.filter((intervention) => intervention.priority === 'URGENT').slice(0, 4) ?? [],
    [interventions],
  );

  const backlog = useMemo(
    () =>
      (cases ?? []).filter((item) => ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'WAITING_PARTS'].includes(item.status)).slice(0, 6),
    [cases],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Vue d'ensemble</h1>
        <p className="text-sm text-slate-500">
          Synthèse temps réel des affaires, interventions et validations à effectuer.
        </p>
      </div>

      <Tabs defaultValue="backlog" className="w-full">
        <TabsList>
          <TabsTrigger value="backlog">Backlog affaires</TabsTrigger>
          <TabsTrigger value="urgent">Urgences</TabsTrigger>
          <TabsTrigger value="reviews">Files de validation</TabsTrigger>
        </TabsList>

        <TabsContent value="backlog">
          {casesLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {backlog.map((item) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold">{item.title}</h3>
                        <Badge variant={item.priority === 'URGENT' ? 'destructive' : 'default'}>
                          {item.priority === 'URGENT' ? 'Urgent' : 'Standard'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">{item.client.name}</p>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="font-medium text-slate-700">{item.site.label}</p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{item.site.city}</span>
                        <Badge variant={statusVariant[item.status]?.variant ?? 'outline'}>
                          {statusVariant[item.status]?.label ?? item.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {backlog.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-slate-500">
                    Aucune affaire en attente.
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="urgent">
          {interventionsLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {urgentInterventions.map((intervention) => (
                <motion.div key={intervention.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="border-red-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-red-600">{intervention.title}</h3>
                        <Badge variant="destructive">Urgent</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="text-slate-600">Type: {intervention.type.toLowerCase()}</p>
                      <div className="text-xs text-slate-500">
                        Statut: {intervention.status}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {urgentInterventions.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-slate-500">
                    Aucun ticket urgent à traiter.
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews">
          {reviewsLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(reviews ?? []).map((review) => (
                <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    <CardHeader>
                      <h3 className="text-base font-semibold">{review.label}</h3>
                    </CardHeader>
                    <CardContent className="space-y-1 text-xs text-slate-500">
                      <p>File : {review.queue}</p>
                      <p>
                        Créé le :
                        {new Date(review.createdAt).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {(reviews ?? []).length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-slate-500">
                    Aucune validation en attente.
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
