import { Component } from '@angular/core';
import { SensorsComponent } from './sensors/sensors.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SensorsComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  title = 'humanmeter';
}
