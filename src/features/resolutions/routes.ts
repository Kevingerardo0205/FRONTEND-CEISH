import { Routes } from '@angular/router';
import { AuthGuard } from '@infrastructure/guards/auth.guard';
import { ResolutionGeneratorPage } from './presentation/pages/resolution-generator/resolution-generator.page';

export const RESOLUTION_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'generator',
        component: ResolutionGeneratorPage,
        canActivate: [AuthGuard]
      },
      {
        path: '',
        redirectTo: 'generator',
        pathMatch: 'full'
      }
    ]
  }
];
