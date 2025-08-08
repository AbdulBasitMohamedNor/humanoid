import { Component, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { StoreService } from '../services/store.service';
import confetti from 'canvas-confetti';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'humanmeter',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatCheckboxModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatProgressBarModule,
  ],
  templateUrl: './humanmeter.component.html',
  styleUrl: './humanmeter.component.scss'
})
export class HumanmeterComponent {
  store = inject(StoreService);
  private announcer = inject(LiveAnnouncer);
  percent = computed(() => this.store.percent());

  private lastPct = -1;
  constructor() {
    effect(() => {
      const p = this.percent();
      if (p === 100 && this.lastPct !== 100) this.burst();
      if (p !== this.lastPct) {
        this.announcer.announce(`Progress ${p} percent`);
      }
      this.lastPct = p;
    });
  }

  toggle(id: string) {
    this.store.toggle(id);
    this.beep( this.store.prefs().mute ? 0 : 1 );
  }
  reset() { this.store.resetDay(true); }
  setMute(val: boolean) { this.store.setPref({ mute: val }); }
  setColorBlind(val: boolean) { this.store.setPref({ colorBlind: val }); }

  encouragement() {
    const p = this.percent();
    if (p === 0) return 'Start now';
    if (p < 25) return 'Good start keep going';
    if (p < 50) return 'Nice work may Allah bless you';
    if (p < 75) return 'Mashallah you are on the path of khayr';
    if (p < 100) return 'Almost there stay patient';
    return 'You are from the people of Jannah inshaAllah';
  }

  private burst() {
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.7 } });
  }

  private beep(intensity = 1) {
    if (!intensity) return;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = 880;
    g.gain.value = 0.03;
    o.connect(g).connect(ctx.destination);
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, 120);
  }
}
