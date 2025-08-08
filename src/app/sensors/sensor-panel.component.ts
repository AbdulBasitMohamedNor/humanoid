import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SensorsService, SensorKey } from './sensors.service';

@Component({
  selector: 'app-sensor-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sensor-panel.component.html',
  styleUrls: ['./sensor-panel.component.scss']
})
export class SensorPanelComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) k!: SensorKey;

  odrOptions = [1, 10, 12.5, 25, 50, 100];
  fsOptions = [2, 4, 8, 16, 50, 100, 245, 500, 1000, 1260];

  constructor(public s: SensorsService) {}
}
