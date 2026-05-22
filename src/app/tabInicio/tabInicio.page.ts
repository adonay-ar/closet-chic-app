import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  IonBadge,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bagCheckOutline, calendarOutline, cardOutline, cubeOutline } from 'ionicons/icons';
import { ClosetDataService, PedidoDia } from '../services/closet-data.service';

@Component({
  selector: 'app-tabInicio',
  templateUrl: 'tabInicio.page.html',
  styleUrls: ['tabInicio.page.scss'],
  imports: [CommonModule, IonBadge, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonTitle, IonToolbar],
})
export class TabInicioPage {
  resumen: PedidoDia[] = [];
  totalPedidos = 0;
  totalPagados = 0;
  totalEntregados = 0;
  totalPendientes = 0;
  maxPedidos = 1;

  constructor(private readonly dataService: ClosetDataService) {
    addIcons({ bagCheckOutline, calendarOutline, cardOutline, cubeOutline });
  }

  ionViewWillEnter(): void {
    void this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    this.resumen = await this.dataService.getResumenPorDia();
    this.totalPedidos = this.resumen.reduce((total, dia) => total + dia.total, 0);
    this.totalPagados = this.resumen.reduce((total, dia) => total + dia.pagados, 0);
    this.totalEntregados = this.resumen.reduce((total, dia) => total + dia.entregados, 0);
    this.totalPendientes = this.resumen.reduce((total, dia) => total + dia.pendientes, 0);
    this.maxPedidos = Math.max(1, ...this.resumen.map((dia) => dia.total));
  }

  barWidth(dia: PedidoDia): string {
    return `${Math.max(8, (dia.total / this.maxPedidos) * 100)}%`;
  }
}
