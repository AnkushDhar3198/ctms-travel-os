import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { EmployeeDashboardComponent } from './dashboard/employee-dashboard.component';
import { TripTimelineComponent } from './trip-timeline/trip-timeline.component';

const routes: Routes = [
  { path: '', component: EmployeeDashboardComponent }
];

@NgModule({
  declarations: [
    EmployeeDashboardComponent,
    TripTimelineComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
  ]
})
export class EmployeeModule {}
