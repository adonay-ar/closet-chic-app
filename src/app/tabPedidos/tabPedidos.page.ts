import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { CheckboxCustomEvent } from '@ionic/angular';
import {
  AlertController,
  IonBadge,
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  bagCheckOutline,
  cardOutline,
  closeOutline,
  createOutline,
  saveOutline,
  trashOutline,
} from 'ionicons/icons';
import { Cliente, ClosetDataService, Pedido } from '../services/closet-data.service';

@Component({
  selector: 'app-tabPedidos',
  templateUrl: 'tabPedidos.page.html',
  styleUrls: ['tabPedidos.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonBadge,
    IonButton,
    IonButtons,
    IonCheckbox,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonTitle,
    IonToolbar,
  ],
})
export class TabPedidosPage {
  clientes: Cliente[] = [];
  pedidos: Pedido[] = [];
  filtroFecha = '';
  formVisible = false;
  guardando = false;
  totalPagadoMonto = 0;
  totalPendientePagoMonto = 0;
  tiendas = ['TEMU', 'SHEIN', 'Amazon', 'Otra'];
  pedidoForm: Pedido = this.emptyPedido();

  constructor(
    private readonly dataService: ClosetDataService,
    private readonly alertController: AlertController,
  ) {
    addIcons({
      addOutline,
      bagCheckOutline,
      cardOutline,
      closeOutline,
      createOutline,
      saveOutline,
      trashOutline,
    });
  }

  ionViewWillEnter(): void {
    void this.loadData();
  }

  async loadData(): Promise<void> {
    this.clientes = await this.dataService.getClientes();
    this.pedidos = await this.dataService.getPedidos(this.filtroFecha || undefined);
    this.calcularTotales();
  }

  async filtrarPorFecha(): Promise<void> {
    await this.loadData();
  }

  async limpiarFiltro(): Promise<void> {
    this.filtroFecha = '';
    await this.loadData();
  }

  nuevoPedido(): void {
    this.pedidoForm = this.emptyPedido();
    if (this.clientes.length === 1 && this.clientes[0].id) {
      this.pedidoForm.clienteId = this.clientes[0].id;
    }
    this.formVisible = true;
  }

  editarPedido(pedido: Pedido): void {
    this.pedidoForm = { ...pedido };
    this.formVisible = true;
  }

  cancelar(): void {
    this.pedidoForm = this.emptyPedido();
    this.formVisible = false;
  }

  async guardarPedido(): Promise<void> {
    if (!this.pedidoForm.clienteId || !this.pedidoForm.descripcion.trim()) {
      await this.showAlert('Faltan datos', 'Selecciona un cliente y escribe la descripcion del pedido.');
      return;
    }

    this.guardando = true;
    await this.dataService.savePedido(this.pedidoForm);
    await this.loadData();
    this.guardando = false;
    this.cancelar();
  }

  async confirmarCambioEstado(pedido: Pedido, campo: 'pagado' | 'entregado', event: CheckboxCustomEvent): Promise<void> {
    if (!pedido.id) {
      return;
    }

    const nuevoValor = event.detail.checked;
    const valorAnterior = pedido[campo];
    const accion = nuevoValor ? 'marcar' : 'quitar';
    const etiqueta = campo === 'pagado' ? 'pago' : 'entrega';
    const alert = await this.alertController.create({
      header: campo === 'pagado' ? 'Confirmar pago' : 'Confirmar entrega',
      message: `Deseas ${accion} el estado de ${etiqueta} para este pedido?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            pedido[campo] = valorAnterior;
            this.pedidos = [...this.pedidos];
          },
        },
        {
          text: 'Confirmar',
          handler: () => {
            pedido[campo] = nuevoValor;
            void this.guardarEstadoPedido(pedido);
          },
        },
      ],
    });
    await alert.present();
  }

  async guardarEstadoPedido(pedido: Pedido): Promise<void> {
    if (!pedido.id) {
      return;
    }

    await this.dataService.updatePedidoEstado(pedido.id, {
      pagado: pedido.pagado,
      entregado: pedido.entregado,
    });
    await this.loadData();
  }

  async eliminarPedido(pedido: Pedido): Promise<void> {
    if (!pedido.id) {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Eliminar pedido',
      message: `Eliminar el pedido de ${pedido.clienteNombre ?? 'este cliente'}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            void this.confirmarEliminar(pedido.id as number);
          },
        },
      ],
    });
    await alert.present();
  }

  trackPedido(_index: number, pedido: Pedido): number {
    return pedido.id ?? _index;
  }

  private calcularTotales(): void {
    this.totalPagadoMonto = this.pedidos
      .filter((pedido) => pedido.pagado)
      .reduce((total, pedido) => total + pedido.monto, 0);
    this.totalPendientePagoMonto = this.pedidos
      .filter((pedido) => !pedido.pagado)
      .reduce((total, pedido) => total + pedido.monto, 0);
  }

  private async confirmarEliminar(id: number): Promise<void> {
    await this.dataService.deletePedido(id);
    await this.loadData();
  }

  private emptyPedido(): Pedido {
    return {
      clienteId: 0,
      tienda: 'TEMU',
      descripcion: '',
      codigo: '',
      fechaPedido: new Date().toISOString().slice(0, 10),
      monto: 0,
      pagado: false,
      entregado: false,
      notas: '',
    };
  }

  private async showAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
