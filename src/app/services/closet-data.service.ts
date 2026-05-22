import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';

export interface Cliente {
  id?: number;
  nombre: string;
  telefono: string;
  direccion: string;
  notas: string;
  createdAt?: string;
}

export interface Pedido {
  id?: number;
  clienteId: number;
  clienteNombre?: string;
  tienda: string;
  descripcion: string;
  codigo: string;
  fechaPedido: string;
  monto: number;
  pagado: boolean;
  entregado: boolean;
  notas: string;
  createdAt?: string;
}

export interface PedidoDia {
  fecha: string;
  total: number;
  pagados: number;
  entregados: number;
  pendientes: number;
}

type SQLitePlugin = {
  createConnection(options: Record<string, unknown>): Promise<unknown>;
  open(options: Record<string, unknown>): Promise<unknown>;
  execute(options: Record<string, unknown>): Promise<unknown>;
  query(options: Record<string, unknown>): Promise<{ values?: Record<string, unknown>[] }>;
  run(options: Record<string, unknown>): Promise<unknown>;
};

const SQLite = registerPlugin<SQLitePlugin>('CapacitorSQLite');

@Injectable({
  providedIn: 'root',
})
export class ClosetDataService {
  private readonly dbName = 'closet_pedidos';
  private readonly clientesKey = 'closet_clientes';
  private readonly pedidosKey = 'closet_pedidos';
  private initialized = false;
  private readonly sqliteEnabled = Capacitor.isNativePlatform();

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.sqliteEnabled) {
      await this.initSQLite();
    } else {
      this.ensureBrowserStore();
    }

    this.initialized = true;
  }

  async getClientes(): Promise<Cliente[]> {
    await this.init();

    if (!this.sqliteEnabled) {
      return this.getBrowserClientes().sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    const result = await SQLite.query({
      database: this.dbName,
      statement: 'SELECT * FROM clientes ORDER BY nombre COLLATE NOCASE ASC;',
      values: [],
    });

    return (result.values ?? []).map((row) => this.mapCliente(row));
  }

  async saveCliente(cliente: Cliente): Promise<void> {
    await this.init();
    const cleanCliente = this.normalizeCliente(cliente);

    if (!this.sqliteEnabled) {
      const clientes = this.getBrowserClientes();
      if (cleanCliente.id) {
        const index = clientes.findIndex((item) => item.id === cleanCliente.id);
        if (index >= 0) {
          clientes[index] = { ...clientes[index], ...cleanCliente };
        }
      } else {
        clientes.push({ ...cleanCliente, id: Date.now(), createdAt: new Date().toISOString() });
      }
      this.setBrowserClientes(clientes);
      return;
    }

    if (cleanCliente.id) {
      await SQLite.run({
        database: this.dbName,
        statement: `
          UPDATE clientes
          SET nombre = ?, telefono = ?, direccion = ?, notas = ?
          WHERE id = ?;
        `,
        values: [cleanCliente.nombre, cleanCliente.telefono, cleanCliente.direccion, cleanCliente.notas, cleanCliente.id],
      });
      return;
    }

    await SQLite.run({
      database: this.dbName,
      statement: `
        INSERT INTO clientes (nombre, telefono, direccion, notas, createdAt)
        VALUES (?, ?, ?, ?, ?);
      `,
      values: [cleanCliente.nombre, cleanCliente.telefono, cleanCliente.direccion, cleanCliente.notas, new Date().toISOString()],
    });
  }

  async deleteCliente(id: number): Promise<void> {
    await this.init();

    if (!this.sqliteEnabled) {
      const pedidos = this.getBrowserPedidos();
      if (pedidos.some((pedido) => pedido.clienteId === id)) {
        throw new Error('No se puede eliminar un cliente con pedidos registrados.');
      }
      this.setBrowserClientes(this.getBrowserClientes().filter((cliente) => cliente.id !== id));
      return;
    }

    await SQLite.run({
      database: this.dbName,
      statement: 'DELETE FROM clientes WHERE id = ?;',
      values: [id],
    });
  }

  async getPedidos(fecha?: string): Promise<Pedido[]> {
    await this.init();

    if (!this.sqliteEnabled) {
      const clientes = this.getBrowserClientes();
      return this.getBrowserPedidos()
        .filter((pedido) => !fecha || pedido.fechaPedido === fecha)
        .map((pedido) => ({
          ...pedido,
          clienteNombre: clientes.find((cliente) => cliente.id === pedido.clienteId)?.nombre ?? 'Cliente eliminado',
        }))
        .sort((a, b) => b.fechaPedido.localeCompare(a.fechaPedido));
    }

    const where = fecha ? 'WHERE p.fechaPedido = ?' : '';
    const result = await SQLite.query({
      database: this.dbName,
      statement: `
        SELECT p.*, c.nombre AS clienteNombre
        FROM pedidos p
        LEFT JOIN clientes c ON c.id = p.clienteId
        ${where}
        ORDER BY p.fechaPedido DESC, p.id DESC;
      `,
      values: fecha ? [fecha] : [],
    });

    return (result.values ?? []).map((row) => this.mapPedido(row));
  }

  async savePedido(pedido: Pedido): Promise<void> {
    await this.init();
    const cleanPedido = this.normalizePedido(pedido);

    if (!this.sqliteEnabled) {
      const pedidos = this.getBrowserPedidos();
      if (cleanPedido.id) {
        const index = pedidos.findIndex((item) => item.id === cleanPedido.id);
        if (index >= 0) {
          pedidos[index] = { ...pedidos[index], ...cleanPedido };
        }
      } else {
        pedidos.push({ ...cleanPedido, id: Date.now(), createdAt: new Date().toISOString() });
      }
      this.setBrowserPedidos(pedidos);
      return;
    }

    const values = [
      cleanPedido.clienteId,
      cleanPedido.tienda,
      cleanPedido.descripcion,
      cleanPedido.codigo,
      cleanPedido.fechaPedido,
      cleanPedido.monto,
      cleanPedido.pagado ? 1 : 0,
      cleanPedido.entregado ? 1 : 0,
      cleanPedido.notas,
    ];

    if (cleanPedido.id) {
      await SQLite.run({
        database: this.dbName,
        statement: `
          UPDATE pedidos
          SET clienteId = ?, tienda = ?, descripcion = ?, codigo = ?, fechaPedido = ?,
              monto = ?, pagado = ?, entregado = ?, notas = ?
          WHERE id = ?;
        `,
        values: [...values, cleanPedido.id],
      });
      return;
    }

    await SQLite.run({
      database: this.dbName,
      statement: `
        INSERT INTO pedidos (
          clienteId, tienda, descripcion, codigo, fechaPedido, monto, pagado, entregado, notas, createdAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      values: [...values, new Date().toISOString()],
    });
  }

  async updatePedidoEstado(id: number, changes: Pick<Pedido, 'pagado' | 'entregado'>): Promise<void> {
    await this.init();

    if (!this.sqliteEnabled) {
      const pedidos = this.getBrowserPedidos().map((pedido) =>
        pedido.id === id ? { ...pedido, pagado: changes.pagado, entregado: changes.entregado } : pedido,
      );
      this.setBrowserPedidos(pedidos);
      return;
    }

    await SQLite.run({
      database: this.dbName,
      statement: 'UPDATE pedidos SET pagado = ?, entregado = ? WHERE id = ?;',
      values: [changes.pagado ? 1 : 0, changes.entregado ? 1 : 0, id],
    });
  }

  async deletePedido(id: number): Promise<void> {
    await this.init();

    if (!this.sqliteEnabled) {
      this.setBrowserPedidos(this.getBrowserPedidos().filter((pedido) => pedido.id !== id));
      return;
    }

    await SQLite.run({
      database: this.dbName,
      statement: 'DELETE FROM pedidos WHERE id = ?;',
      values: [id],
    });
  }

  async getResumenPorDia(): Promise<PedidoDia[]> {
    await this.init();

    if (!this.sqliteEnabled) {
      const grouped = this.getBrowserPedidos().reduce<Record<string, PedidoDia>>((acc, pedido) => {
        acc[pedido.fechaPedido] ??= {
          fecha: pedido.fechaPedido,
          total: 0,
          pagados: 0,
          entregados: 0,
          pendientes: 0,
        };
        acc[pedido.fechaPedido].total += 1;
        acc[pedido.fechaPedido].pagados += pedido.pagado ? 1 : 0;
        acc[pedido.fechaPedido].entregados += pedido.entregado ? 1 : 0;
        acc[pedido.fechaPedido].pendientes += pedido.entregado ? 0 : 1;
        return acc;
      }, {});

      return Object.values(grouped).sort((a, b) => b.fecha.localeCompare(a.fecha));
    }

    const result = await SQLite.query({
      database: this.dbName,
      statement: `
        SELECT
          fechaPedido AS fecha,
          COUNT(*) AS total,
          SUM(CASE WHEN pagado = 1 THEN 1 ELSE 0 END) AS pagados,
          SUM(CASE WHEN entregado = 1 THEN 1 ELSE 0 END) AS entregados,
          SUM(CASE WHEN entregado = 0 THEN 1 ELSE 0 END) AS pendientes
        FROM pedidos
        GROUP BY fechaPedido
        ORDER BY fechaPedido DESC;
      `,
      values: [],
    });

    return (result.values ?? []).map((row) => ({
      fecha: String(row['fecha']),
      total: Number(row['total'] ?? 0),
      pagados: Number(row['pagados'] ?? 0),
      entregados: Number(row['entregados'] ?? 0),
      pendientes: Number(row['pendientes'] ?? 0),
    }));
  }

  private async initSQLite(): Promise<void> {
    try {
      await SQLite.createConnection({
        database: this.dbName,
        encrypted: false,
        mode: 'no-encryption',
        version: 1,
        readonly: false,
      });
    } catch {
      // Reopening an existing connection is expected after app hot reloads.
    }

    await SQLite.open({ database: this.dbName, readonly: false });
    await SQLite.execute({
      database: this.dbName,
      statements: `
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS clientes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          telefono TEXT DEFAULT '',
          direccion TEXT DEFAULT '',
          notas TEXT DEFAULT '',
          createdAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS pedidos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          clienteId INTEGER NOT NULL,
          tienda TEXT NOT NULL,
          descripcion TEXT NOT NULL,
          codigo TEXT DEFAULT '',
          fechaPedido TEXT NOT NULL,
          monto REAL DEFAULT 0,
          pagado INTEGER DEFAULT 0,
          entregado INTEGER DEFAULT 0,
          notas TEXT DEFAULT '',
          createdAt TEXT NOT NULL,
          FOREIGN KEY (clienteId) REFERENCES clientes(id) ON DELETE RESTRICT
        );

        CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fechaPedido);
        CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(clienteId);
      `,
    });
  }

  private ensureBrowserStore(): void {
    if (!localStorage.getItem(this.clientesKey)) {
      localStorage.setItem(this.clientesKey, '[]');
    }
    if (!localStorage.getItem(this.pedidosKey)) {
      localStorage.setItem(this.pedidosKey, '[]');
    }
  }

  private getBrowserClientes(): Cliente[] {
    return JSON.parse(localStorage.getItem(this.clientesKey) ?? '[]') as Cliente[];
  }

  private setBrowserClientes(clientes: Cliente[]): void {
    localStorage.setItem(this.clientesKey, JSON.stringify(clientes));
  }

  private getBrowserPedidos(): Pedido[] {
    return JSON.parse(localStorage.getItem(this.pedidosKey) ?? '[]') as Pedido[];
  }

  private setBrowserPedidos(pedidos: Pedido[]): void {
    localStorage.setItem(this.pedidosKey, JSON.stringify(pedidos));
  }

  private normalizeCliente(cliente: Cliente): Cliente {
    return {
      ...cliente,
      nombre: cliente.nombre.trim(),
      telefono: cliente.telefono.trim(),
      direccion: cliente.direccion.trim(),
      notas: cliente.notas.trim(),
    };
  }

  private normalizePedido(pedido: Pedido): Pedido {
    return {
      ...pedido,
      tienda: pedido.tienda.trim(),
      descripcion: pedido.descripcion.trim(),
      codigo: pedido.codigo.trim(),
      monto: Number(pedido.monto) || 0,
      notas: pedido.notas.trim(),
    };
  }

  private mapCliente(row: Record<string, unknown>): Cliente {
    return {
      id: Number(row['id']),
      nombre: String(row['nombre'] ?? ''),
      telefono: String(row['telefono'] ?? ''),
      direccion: String(row['direccion'] ?? ''),
      notas: String(row['notas'] ?? ''),
      createdAt: String(row['createdAt'] ?? ''),
    };
  }

  private mapPedido(row: Record<string, unknown>): Pedido {
    return {
      id: Number(row['id']),
      clienteId: Number(row['clienteId']),
      clienteNombre: String(row['clienteNombre'] ?? 'Cliente eliminado'),
      tienda: String(row['tienda'] ?? ''),
      descripcion: String(row['descripcion'] ?? ''),
      codigo: String(row['codigo'] ?? ''),
      fechaPedido: String(row['fechaPedido'] ?? ''),
      monto: Number(row['monto'] ?? 0),
      pagado: Number(row['pagado'] ?? 0) === 1,
      entregado: Number(row['entregado'] ?? 0) === 1,
      notas: String(row['notas'] ?? ''),
      createdAt: String(row['createdAt'] ?? ''),
    };
  }
}
