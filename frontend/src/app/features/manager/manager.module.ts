import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ManagerDashboardComponent } from './dashboard/manager-dashboard.component';

const routes: Routes = [
  { path: '', component: ManagerDashboardComponent }
];

@NgModule({
  declarations: [ManagerDashboardComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)]
})
export class ManagerModule {}
