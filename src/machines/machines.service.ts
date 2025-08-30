import { Injectable } from '@nestjs/common';
import { Machine } from './machine.entity';
import { seedMachines } from './seed';

@Injectable()
export class MachinesService {
  private machines: Machine[] = [];

  constructor() {
    this.machines = seedMachines();
  }

  getAll() {
    return this.machines;
  }

  getById(id: string) {
    return this.machines.find((m) => m.id === id);
  }

  startMachine(id: string) {
    const machine = this.getById(id);
    if (machine) {
      machine.status = 'running';
    }
    return { id, message: `Machine ${id} started` };
  }

  stopMachine(id: string) {
    const machine = this.getById(id);
    if (machine) {
      machine.status = 'stopped';
    }
    return { id, message: `Machine ${id} stopped` };
  }

  playGame(id: string, game: string) {
    const machine = this.getById(id);
    if (machine) {
      machine.status = 'playing';
      machine.game = game;
    }
    return { id, message: `Machine ${id} is playing ${game}` };
  }

  download(id: string, file: string) {
    const machine = this.getById(id);
    if (machine) {
      machine.status = 'downloading';
      machine.file = file;
    }
    return { id, message: `Machine ${id} downloading ${file}` };
  }
}
