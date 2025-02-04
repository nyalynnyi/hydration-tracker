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
export class Tab1Page implements OnInit {
  hydrationChart: any;
  currentHydration: number = 0; 
  hydrationGoal: number = 0;
  idealWaterIntake: number = 0; 
  drinkArray: Array<{ amount: number, timestamp: Date }> = [];
  weightKg: number = 0;
  activityMinutes: number = 0;
  

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


  async ngOnInit(): Promise<void> {
    this.createHydrationChart();
    this.loadUserData();
  
    const history = await this.appStorage.get(DRINK_HISTORY);
    if (history) {
      this.drinkArray = JSON.parse(history);
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
    this.currentHydration = Math.min(this.currentHydration + amount, this.hydrationGoal);
    this.updateChart(this.currentHydration);
  
    const newDrink = { amount: amount, timestamp: new Date() };
    this.drinkArray.unshift(newDrink);
  
    this.appStorage.set(DRINK_HISTORY, JSON.stringify(this.drinkArray));
  }

  goalWater(amount: number): void {
    this.currentHydration = Math.min(this.currentHydration + amount, this.hydrationGoal);
    this.updateChart(this.currentHydration);
  
    const newDrink = { amount: amount, timestamp: new Date() };
    this.drinkArray.unshift(newDrink);
  
    this.appStorage.set(DRINK_HISTORY, JSON.stringify(this.drinkArray));
  }
  
}
