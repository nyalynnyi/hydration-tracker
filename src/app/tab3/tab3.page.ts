import { Component } from '@angular/core';
import { AppStorageService } from '../app-storage.service';
import { DRINK_HISTORY } from '../app.constants';


@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page {

  drinkHistory: { amount: number; timestamp: string }[] = [];

  constructor(private appStorage: AppStorageService) {}

  async ionViewWillEnter() {
    await this.loadDrinkHistory();
  }

  async loadDrinkHistory() {
    const history = await this.appStorage.get(DRINK_HISTORY);
    if (history) {
      this.drinkHistory = JSON.parse(history);
    }
  }

  async deleteDrink(index: number) {
    this.drinkHistory.splice(index, 1); 
    await this.appStorage.set(DRINK_HISTORY, JSON.stringify(this.drinkHistory)); 
  }

}






