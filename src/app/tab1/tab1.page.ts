import { Component, OnInit } from '@angular/core';
import { Chart, ArcElement, Tooltip, Legend, DoughnutController } from 'chart.js';
import { AlertController } from '@ionic/angular';
import { AppStorageService } from '../app-storage.service';
import { DRINK_HISTORY, WEIGHT, ACTIVE_MINUTES } from '../app.constants';

Chart.register(ArcElement, Tooltip, Legend, DoughnutController);

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page  {
  hydrationChart: any;
  currentHydration: number = 0; 
  hydrationGoal: number = 0;
  idealWaterIntake: number = 0; 
  drinkArray: Array<{ amount: number, timestamp: Date }> = [];
  weightKg: number = 0;
  activityMinutes: number = 0;
  maxHydration = 7000;

  constructor(private alertController: AlertController,
    private appStorage: AppStorageService) {}

  async showInputPrompt() {
    const alert = await this.alertController.create({
      header: 'How much liquid (ml)?',
      inputs: [
        {
          name: 'amount',
          type: 'number',
          placeholder: 'Enter amount',
          min: 0,  
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'OK',
          handler: (data) => {
            const amount = parseInt(data.amount, 10);
            if (isNaN(amount) || amount <= 0) {
              return false;  
            }
            this.addWater(amount);  
            return true;
          },
        },
      ],
    });
  
    await alert.present();
  }

  async ionViewDidEnter() {
    this.createHydrationChart();
    this.loadUserData();
    const data = await this.appStorage.get(DRINK_HISTORY);
    if (data) {
      this.drinkArray = JSON.parse(data);
      this.calculateTodaysHydration();
    }
  }
  
  createHydrationChart(): void {
    const ctx = document.getElementById('hydrationChart') as HTMLCanvasElement | null;

    if (!ctx) {
      console.error('Canvas element with id "hydrationChart" not found.');
      return;
    }

    this.hydrationChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Випито', 'Залишок'],
        datasets: [
          {
            data: [this.currentHydration, this.hydrationGoal - this.currentHydration],
            backgroundColor: ['#4A90E2', '#E5E5E5'],
            hoverBackgroundColor: ['#357ABD', '#CFCFCF'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
          },
        },
        cutout: '70%',
      },
    });
  }

  async calculateAmount() {
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
            this.weightKg = Number(data.weightKg);
            this.activityMinutes = Number(data.activityMinutes);
            this.hydrationGoal = Number(data.hydrationGoal);
            localStorage.setItem(WEIGHT, String(this.weightKg));
            localStorage.setItem(ACTIVE_MINUTES, String(this.activityMinutes));
            localStorage.setItem('hydrationGoal', String(this.hydrationGoal));
            this.updateIdealWaterIntake();
          },
        },
      ],
    });

    await alert.present();
  }

  async loadUserData() {
    const storedWeight = localStorage.getItem(WEIGHT);
    const storedActivity = localStorage.getItem(ACTIVE_MINUTES);
    const storedGoal = localStorage.getItem('hydrationGoal');

    if (storedWeight && storedActivity && storedGoal) {
      this.weightKg = Number(storedWeight);
      this.activityMinutes = Number(storedActivity);
      this.hydrationGoal = Number(storedGoal);
      this.updateIdealWaterIntake();
    } else {
      await this.calculateAmount();
    }
  }

  calculateIdealWaterIntake(weightKg: number, activityMinutes: number): number {
    const baseWaterIntakeMl = weightKg * 35;
    const activityWaterIntakeMl = (activityMinutes / 30) * 355;
    return Math.round(baseWaterIntakeMl + activityWaterIntakeMl);
  }

  updateIdealWaterIntake(): void {
    this.idealWaterIntake = this.calculateIdealWaterIntake(this.weightKg, this.activityMinutes);
  }

  updateChart(newValue: number): void {
    if (!this.hydrationChart) {
      console.error('Hydration chart is not initialized.');
      return;
    }

    const remaining = this.hydrationGoal - newValue;
    this.hydrationChart.data.datasets[0].data = [newValue, remaining > 0 ? remaining : 0];
    this.hydrationChart.update();
  }

  addWater(amount: number): void {
    const totalHydration = this.currentHydration + amount;
  
    if (totalHydration > this.maxHydration) {
      this.showMaxHydrationAlert();
      return;
    }
  
    this.currentHydration = totalHydration;
  
    const remaining = this.hydrationGoal - this.currentHydration;
    this.hydrationChart.data.datasets[0].data = [
      this.currentHydration,
      remaining > 0 ? remaining : 0
    ];
    this.hydrationChart.update();
  
    const newDrink = { amount: amount, timestamp: new Date() };
    this.drinkArray.unshift(newDrink);
  
    this.appStorage.set(DRINK_HISTORY, JSON.stringify(this.drinkArray));
  }
  
  async showMaxHydrationAlert() {
    const alert = await this.alertController.create({
      header: 'Warning',
      message: 'You have reached the maximum daily limit of 7 liters!',
      buttons: ['OK']
    });
  
    await alert.present();
  }
  
  

  goalWater(amount: number): void {
    this.currentHydration = Math.min(this.currentHydration + amount, this.hydrationGoal);
    this.updateChart(this.currentHydration);
  
    const newDrink = { amount: amount, timestamp: new Date() };
    this.drinkArray.unshift(newDrink);
  
    this.appStorage.set(DRINK_HISTORY, JSON.stringify(this.drinkArray));
  }

  calculateTodaysHydration(): void {
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));

    this.currentHydration = this.drinkArray
      .filter(drink => new Date(drink.timestamp) >= todayStart)
      .reduce((sum, drink) => sum + drink.amount, 0);

    this.updateChart(this.currentHydration);
  }
  deleteDrink(index: number): void {
    const deletedDrink = this.drinkArray.splice(index, 1); // Видаляємо елемент
    this.appStorage.set(DRINK_HISTORY, JSON.stringify(this.drinkArray)); // Оновлюємо збережену історію
    this.calculateTodaysHydration(); // Оновлюємо гідратацію після видалення
  }
  
}
