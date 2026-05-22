
import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { homeOutline, peopleOutline, cartOutline, addOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { inject, EnvironmentInjector } from '@angular/core';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {

  public environmentInjector = inject(EnvironmentInjector);

  constructor() {

    addIcons({ homeOutline, peopleOutline, cartOutline, addOutline });

  }
}
