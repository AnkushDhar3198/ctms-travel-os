import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TravelDeskDashboardComponent } from './dashboard/travel-desk-dashboard.component';

const routes: Routes = [{ path: '', component: TravelDeskDashboardComponent }];

@NgModule({
  declarations: [TravelDeskDashboardComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)]
})
export class TravelDeskModule {}
