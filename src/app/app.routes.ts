import { Routes } from '@angular/router';
import { LandingPage } from './page/landing-page/landing-page';
import { GovLogin } from './page/gov-login/gov-login';
import { UserData } from './page/user-data/user-data';
import { FormsData } from './page/forms-data/forms-data';

export const routes: Routes = [
{
    path: '',
    component: LandingPage,
    data: { hideFooter: false }
  },
  {
    path: 'gov-login',
    component: GovLogin,
    data: { hideFooter: true }
  },
  {
    path: 'user-data',
    component: UserData,
    data: { hideFooter: true }
  },
  {
    path: 'forms-data',
    component: FormsData,
    data: { hideFooter: true }
  },
  {
    path: '**',
    redirectTo: ''
  }
];
