import { Routes } from '@angular/router';
import { LandingPage } from './page/landing-page/landing-page';
import { GovLogin } from './page/gov-login/gov-login';

export const routes: Routes = [
{
    path: '',
    component: LandingPage
  },
  {
    path: 'gov-login',
    component: GovLogin
  },
  {
    path: '**',
    redirectTo: ''
  }
];
