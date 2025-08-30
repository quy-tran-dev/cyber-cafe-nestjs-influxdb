export interface Machine {
  id: string;
  zone: string;
  status: 'idle' | 'running' | 'stopped' | 'playing' | 'downloading';
  game?: string;
  file?: string;
}
