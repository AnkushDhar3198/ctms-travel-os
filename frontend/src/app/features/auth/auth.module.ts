import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { LandingComponent } from './landing/landing.component';
import { EmployeeLoginComponent } from './employee-login/employee-login.component';
import { ElevatedLoginComponent } from './elevated-login/elevated-login.component';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'employee-login', component: EmployeeLoginComponent },
  { path: 'elevated-login', component: ElevatedLoginComponent },
];

@NgModule({
  declarations: [
    LandingComponent,
    EmployeeLoginComponent,
    ElevatedLoginComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
  ]
})
export class AuthModule {}
