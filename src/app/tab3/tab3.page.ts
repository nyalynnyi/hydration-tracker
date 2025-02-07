import { Component } from '@angular/core';
import { ThemeService } from '../theme.service';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AppStorageService } from '../app-storage.service';
import { WEIGHT, ACTIVE_MINUTES, WATER_GOAL } from '../app.constants';


@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page {

  constructor(private themeService: ThemeService, private alertController: AlertController,
    private appStorage: AppStorageService) {}
  
    async showInputPrompt() {
      const alert = await this.alertController.create({
        header: 'Enter Your Details',
        inputs: [
          { name: 'weightKg', type: 'number', placeholder: 'Weight (kg)' },
          { name: 'activityMinutes', type: 'number', placeholder: 'Daily activity (minutes)' },
          { name: 'hydrationGoal', type: 'number', placeholder: 'Water Goal (ml)' }
        ],
        buttons: [
          {
            text: 'OK',
            handler: (data) => {
              this.saveUserData(data);
            },
          },
        ],
      });
  
      await alert.present();
    }
  
    saveUserData(data: any) {
      const { weightKg, activityMinutes, hydrationGoal } = data;
  
      // Save the data to localStorage
      localStorage.setItem(WEIGHT, String(weightKg));
      localStorage.setItem(ACTIVE_MINUTES, String(activityMinutes));
      localStorage.setItem(WATER_GOAL, String(hydrationGoal));
  
      // Update the values in the AppStorageService
      this.appStorage.set(WEIGHT, weightKg);
      this.appStorage.set(ACTIVE_MINUTES, activityMinutes);
      this.appStorage.set(WATER_GOAL, hydrationGoal);
    }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  

}
