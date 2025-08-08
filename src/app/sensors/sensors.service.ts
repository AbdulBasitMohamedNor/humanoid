import { Injectable, signal } from '@angular/core';

export type SensorKey = 'accel' | 'gyro' | 'mag' | 'press' | 'humid' | 'temp';

export interface SensorConfig {
  enabled: boolean;
  address: string;
  odr: number; // Output Data Rate
  fs: number;  // Full Scale
}

export interface SensorReading {
  value: number;
  unit: string;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class SensorsService {
  // configs with sensible defaults
  configs = signal<Record<SensorKey, SensorConfig>>({
    accel: { enabled: false, address: '0x6A', odr: 12.5, fs: 2 },
    gyro:  { enabled: false, address: '0x6A', odr: 12.5, fs: 245 },
    mag:   { enabled: false, address: '0x1E', odr: 10, fs: 50 },
    press: { enabled: false, address: '0x5C', odr: 1, fs: 1260 },
    humid: { enabled: false, address: '0x5F', odr: 1, fs: 100 },
    temp:  { enabled: false, address: '0x5F', odr: 1, fs: 120 }
  } as any);

  readings = signal<Record<SensorKey, SensorReading>>({
    accel: { value: 0, unit: 'm/s²', timestamp: Date.now() },
    gyro:  { value: 0, unit: '°/s', timestamp: Date.now() },
    mag:   { value: 0, unit: 'µT', timestamp: Date.now() },
    press: { value: 1013.25, unit: 'hPa', timestamp: Date.now() },
    humid: { value: 45, unit: '%', timestamp: Date.now() },
    temp:  { value: 22, unit: '°C', timestamp: Date.now() },
  } as any);

  private timers = new Map<SensorKey, any>();
  logs = signal<string[]>([]);

  private log(msg: string) {
    const next = [new Date().toLocaleTimeString() + ' ' + msg, ...this.logs()].slice(0, 200);
    this.logs.set(next);
  }

  setConfig(key: SensorKey, patch: Partial<SensorConfig>) {
    const nextCfg = { ...this.configs()[key], ...patch } as SensorConfig;
    const cfgs = { ...this.configs() } as Record<SensorKey, SensorConfig>;
    cfgs[key] = nextCfg;
    this.configs.set(cfgs as any);
    if (patch.enabled !== undefined) {
      patch.enabled ? this.start(key) : this.stop(key);
    }
    this.log(`Config ${key}: ${JSON.stringify(nextCfg)}`);
  }

  enableAll() {
  (Object.keys(this.configs()) as SensorKey[]).forEach(k => this.setConfig(k, { enabled: true }));
  this.log('Enabled all sensors');
  }
  disableAll() {
  (Object.keys(this.configs()) as SensorKey[]).forEach(k => this.setConfig(k, { enabled: false }));
  this.log('Disabled all sensors');
  }

  private start(key: SensorKey) {
    this.stop(key);
    const odr = Math.max(1, this.configs()[key].odr);
    const interval = Math.max(50, Math.min(1000, Math.round(1000 / odr)));
    const t = setInterval(() => this.tick(key), interval);
    this.timers.set(key, t);
  this.log(`Started ${key} @${odr}Hz`);
  }
  private stop(key: SensorKey) {
    const t = this.timers.get(key);
    if (t) { clearInterval(t); this.timers.delete(key); }
  this.log(`Stopped ${key}`);
  }

  private tick(key: SensorKey) {
    // Simulate readings based on sensor type
    const r = this.readings();
    const now = Date.now();
    const jitter = (min: number, max: number) => min + Math.random() * (max - min);
    switch (key) {
      case 'accel': r.accel = { value: jitter(0, 9.8), unit: 'm/s²', timestamp: now }; break;
      case 'gyro':  r.gyro  = { value: jitter(0, 360), unit: '°/s', timestamp: now }; break;
      case 'mag':   r.mag   = { value: jitter(10, 60), unit: 'µT', timestamp: now }; break;
      case 'press': r.press = { value: jitter(980, 1030), unit: 'hPa', timestamp: now }; break;
      case 'humid': r.humid = { value: jitter(20, 70), unit: '%', timestamp: now }; break;
      case 'temp':  r.temp  = { value: jitter(18, 28), unit: '°C', timestamp: now }; break;
    }
  this.readings.set({ ...r });
  }
}
