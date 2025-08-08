import { Injectable, effect, signal } from '@angular/core';

export interface Deed {
  id: string;
  label: string;
  points: number;
  done: boolean;
}

export interface HistoryEntry { date: string; percent: number; }

const STORAGE_KEY = 'hm_deeds';
const HISTORY_KEY = 'hm_history';
const PREFS_KEY = 'hm_prefs';

export interface Prefs { nickname?: string; mute?: boolean; colorBlind?: boolean; }

@Injectable({ providedIn: 'root' })
export class StoreService {
  deeds = signal<Deed[]>([]);
  percent = signal(0);
  prefs = signal<Prefs>({});
  history = signal<HistoryEntry[]>([]);

  private totalPoints = 100;

  constructor() {
    this.load();
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.deeds()));
      localStorage.setItem(PREFS_KEY, JSON.stringify(this.prefs()));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history()));
    });
  }

  initDefault() {
    const base: Deed[] = [
      { id: 'prayer', label: 'Prayers on time', points: 10, done: false },
      { id: 'quran', label: 'Quran reading', points: 10, done: false },
      { id: 'parents', label: 'Kindness to parents', points: 10, done: false },
      { id: 'sadaqah', label: 'Sadaqah', points: 10, done: false },
      { id: 'help', label: 'Helping others', points: 10, done: false },
      { id: 'adhkar', label: 'Morning/Evening adhkar', points: 10, done: false },
      { id: 'truth', label: 'Truthfulness', points: 10, done: false },
      { id: 'patience', label: 'Patience', points: 10, done: false },
      { id: 'gratitude', label: 'Gratitude', points: 10, done: false },
      { id: 'purity', label: 'Purity/Wudu', points: 10, done: false },
    ];
    this.deeds.set(base);
    this.computePercent();
  }

  toggle(id: string) {
    this.deeds.update(list => list.map(d => d.id === id ? { ...d, done: !d.done } : d));
    this.computePercent();
  }

  resetDay(persistHistory = true) {
    if (persistHistory) this.pushTodayToHistory();
    this.deeds.update(list => list.map(d => ({ ...d, done: false })));
    this.computePercent();
  }

  setPref(update: Partial<Prefs>) {
    this.prefs.update(p => ({ ...p, ...update }));
  }

  computePercent() {
    const total = this.deeds().reduce((s, d) => s + d.points, 0) || this.totalPoints;
    const done = this.deeds().reduce((s, d) => s + (d.done ? d.points : 0), 0);
    const pct = Math.max(0, Math.min(100, Math.round((done / total) * 100)));
    this.percent.set(pct);
  }

  private load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const deeds: Deed[] | null = saved ? JSON.parse(saved) : null;
      if (deeds && deeds.length) {
        this.deeds.set(deeds);
      } else {
        this.initDefault();
      }
    } catch { this.initDefault(); }

    try {
      const prefs = localStorage.getItem(PREFS_KEY);
      this.prefs.set(prefs ? JSON.parse(prefs) : {});
    } catch { this.prefs.set({}); }

    try {
      const hist = localStorage.getItem(HISTORY_KEY);
      this.history.set(hist ? JSON.parse(hist) : []);
    } catch { this.history.set([]); }

    this.computePercent();
  }

  private pushTodayToHistory() {
    const today = new Date();
    const entry: HistoryEntry = { date: today.toISOString().slice(0, 10), percent: this.percent() };
    const arr = [entry, ...this.history()].slice(0, 7);
    this.history.set(arr);
  }
}
