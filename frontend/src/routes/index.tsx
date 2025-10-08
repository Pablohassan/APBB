import { RouteObject } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import { CasesPage } from '../pages/CasesPage';
import { InterventionsPage } from '../pages/InterventionsPage';
import { ReviewQueuesPage } from '../pages/ReviewQueuesPage';
import { TechnicianMobilePage } from '../pages/TechnicianMobilePage';

export const AppRoutes: RouteObject[] = [
  {
    path: '/',
    element: <DashboardPage />,
  },
  {
    path: '/cases',
    element: <CasesPage />,
  },
  {
    path: '/interventions',
    element: <InterventionsPage />,
  },
  {
    path: '/reviews',
    element: <ReviewQueuesPage />,
  },
  {
    path: '/technician',
    element: <TechnicianMobilePage />,
  },
];
