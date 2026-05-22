import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, callOutline, closeOutline, createOutline, locationOutline, saveOutline, trashOutline } from 'ionicons/icons';
import { Cliente, ClosetDataService } from '../services/closet-data.service';

@Component({
  selector: 'app-tabClientes',
  templateUrl: 'tabClientes.page.html',
  styleUrls: ['tabClientes.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonBadge,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonTextarea,
    IonTitle,
    IonToolbar,
  ],
})
export class TabClientesPage {
  clientes: Cliente[] = [];
  formVisible = false;
  guardando = false;
  clienteForm: Cliente = this.emptyCliente();

  constructor(
    private readonly dataService: ClosetDataService,
    private readonly alertController: AlertController,
  ) {
    addIcons({ addOutline, callOutline, closeOutline, createOutline, locationOutline, saveOutline, trashOutline });
  }

  ionViewWillEnter(): void {
    void this.loadClientes();
  }

  async loadClientes(): Promise<void> {
    this.clientes = await this.dataService.getClientes();
  }

  nuevoCliente(): void {
    this.clienteForm = this.emptyCliente();
    this.formVisible = true;
  }

  editarCliente(cliente: Cliente): void {
    this.clienteForm = { ...cliente };
    this.formVisible = true;
  }

  cancelar(): void {
    this.clienteForm = this.emptyCliente();
    this.formVisible = false;
  }

  async guardarCliente(): Promise<void> {
    if (!this.clienteForm.nombre.trim()) {
      await this.showAlert('Falta el nombre', 'Ingresa el nombre del cliente para guardarlo.');
      return;
    }

    this.guardando = true;
    await this.dataService.saveCliente(this.clienteForm);
    await this.loadClientes();
    this.guardando = false;
    this.cancelar();
  }

  async eliminarCliente(cliente: Cliente): Promise<void> {
    if (!cliente.id) {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Eliminar cliente',
      message: `Eliminar a ${cliente.nombre}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            void this.confirmarEliminar(cliente.id as number);
          },
        },
      ],
    });
    await alert.present();
  }

  private async confirmarEliminar(id: number): Promise<void> {
    try {
      await this.dataService.deleteCliente(id);
      await this.loadClientes();
    } catch (error) {
      await this.showAlert('No se pudo eliminar', error instanceof Error ? error.message : 'El cliente tiene pedidos asociados.');
    }
  }

  private emptyCliente(): Cliente {
    return {
      nombre: '',
      telefono: '',
      direccion: '',
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
