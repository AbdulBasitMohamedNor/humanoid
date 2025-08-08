import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SensorsService, SensorKey } from './sensors.service';
import { SensorPanelComponent } from './sensor-panel.component';

@Component({
  selector: 'app-sensors',
  standalone: true,
  imports: [CommonModule, SensorPanelComponent],
  templateUrl: './sensors.component.html',
  styleUrls: ['./sensors.component.scss']
})
export class SensorsComponent {
  tab = signal<SensorKey>('accel');
  keys: SensorKey[] = ['accel', 'gyro', 'mag', 'press', 'humid', 'temp'];

  constructor(public sensors: SensorsService) {}

  setTab(k: SensorKey) { this.tab.set(k); }

  label(k: SensorKey) {
    return {
      accel: 'Accelerometer - LSM6DSOX',
      gyro: 'Gyroscope - LSM6DSOX',
      mag: 'Magnetometer - LIS2MDL',
      press: 'Pressure - LPS22HH',
      humid: 'Humidity - HTS221',
      temp: 'Temperature - HTS221'
    }[k];
  }
}
