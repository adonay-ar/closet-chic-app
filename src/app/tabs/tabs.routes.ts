import { Routes } from '@angular/router';
import { TabsPage } from '../tabs/tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'tabInicio',
        loadComponent: () =>
          import('../tabInicio/tabInicio.page').then((m) => m.TabInicioPage),
      },
      {
        path: 'tabClientes',
        loadComponent: () =>
          import('../tabClientes/tabClientes.page').then((m) => m.TabClientesPage),
      },
      {
        path: 'tabPedidos',
        loadComponent: () =>
          import('../tabPedidos/tabPedidos.page').then((m) => m.TabPedidosPage),
      },
      {
        path: '',
        redirectTo: '/tabs/tabInicio',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/tabInicio',
    pathMatch: 'full',
  },
];
