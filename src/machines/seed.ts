import { Machine } from './machine.entity';

export function seedMachines(): Machine[] {
  const zones = ['A', 'B', 'C', 'D'];
  const machines: Machine[] = [];

  zones.forEach((zone, zIndex) => {
    for (let i = 1; i <= 5; i++) {
      machines.push({
        id: `${zone}${i}`,
        zone,
        status: 'idle',
      });
    }
  });

  return machines;
}
