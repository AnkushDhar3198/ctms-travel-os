import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'employee',
    loadChildren: () => import('./features/employee/employee.module').then(m => m.EmployeeModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['EMPLOYEE'] }
  },
  {
    path: 'manager',
    loadChildren: () => import('./features/manager/manager.module').then(m => m.ManagerModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['MANAGER'] }
  },
  {
    path: 'travel-desk',
    loadChildren: () => import('./features/travel-desk/travel-desk.module').then(m => m.TravelDeskModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['TRAVEL_DESK'] }
  },
  {
    path: 'finance',
    loadChildren: () => import('./features/finance/finance.module').then(m => m.FinanceModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['FINANCE'] }
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
  { path: '**', redirectTo: '/auth' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
