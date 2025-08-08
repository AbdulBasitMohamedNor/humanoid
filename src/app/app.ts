import { Component, signal } from '@angular/core';
import { HumanmeterComponent } from './humanmeter/humanmeter.component';
import { A11yModule, LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'app-root',
  imports: [HumanmeterComponent, A11yModule],
  providers: [LiveAnnouncer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('humanmeter');
}
