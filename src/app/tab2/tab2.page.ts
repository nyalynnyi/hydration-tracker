import { Component, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { AppStorageService } from '../app-storage.service';
import { DRINK_HISTORY, WATER_GOAL } from '../app.constants';

Chart.register(...registerables);

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false
})
export class Tab2Page {
  waterConsumptionChart: any;
  drinkArray: Array<{ amount: number, timestamp: Date }> = [];
  selectedMode: 'day' | 'week' | 'month' = 'week';
  totalConsumption: number = 0;
  averageConsumption: number = 0;
  consumptionFrequency: number = 0;
  goalAchievement: number = 0; 
  hydrationGoal: number = 0; 

  constructor(private appStorage: AppStorageService) {}

  async ionViewDidEnter() {
    await this.loadDrinkHistory();
    this.createWaterConsumptionChart();
    console.log(this.hydrationGoal)
  }

  changeMode(mode: 'day' | 'week' | 'month') {
    this.selectedMode = mode;
    this.createWaterConsumptionChart();
  }

  async loadDrinkHistory() {
    const data = await this.appStorage.get(DRINK_HISTORY);
    const storedGoal = localStorage.getItem(WATER_GOAL);
    if (data) {
      this.drinkArray = JSON.parse(data);
      this.calculateWaterStatistics(); // Викликаємо розрахунок статистики
    }
    if(storedGoal){
      this.hydrationGoal = Number(storedGoal);
    }
  }

  calculateWaterStatistics(): void {
    // Загальна кількість випитої води (у мілілітрах)
    this.totalConsumption = this.drinkArray.reduce((sum, drink) => sum + drink.amount, 0);
  
    // Кількість днів для розрахунку середніх значень
    const days = this.drinkArray.length > 0 ? this.getUniqueDays(this.drinkArray) : 1;
  
    // Середня кількість випитої води
    if (this.selectedMode === 'day') {
      // У режимі "день" середня кількість — це загальна кількість за день
      this.averageConsumption = this.totalConsumption ; // Переводимо в літри
    } else {
      // У режимах "тиждень" і "місяць" — середня кількість на день
      this.averageConsumption = (this.totalConsumption / days) ; // Переводимо в літри
    }
  
    // Частота споживання води (кількість разів на день)
    this.consumptionFrequency = this.drinkArray.length / days;
  
    // Відсоток від цілі
    if (this.selectedMode === 'day') {
      // У режимі "день" — відсоток від денної цілі
      this.goalAchievement = (this.hydrationGoal > 0)
        ? Math.min((this.totalConsumption / this.hydrationGoal) * 100, 100)
        : 0;
    } else {
      // У режимах "тиждень" і "місяць" — середній відсоток від денної цілі
      const averageDailyGoal = this.hydrationGoal * days; // Загальна ціль за період
      this.goalAchievement = (this.hydrationGoal > 0)
        ? Math.min((this.totalConsumption / averageDailyGoal) * 100, 100)
        : 0;
    }
  }
  
  getUniqueDays(drinks: Array<{ amount: number, timestamp: Date }>): number {
    const uniqueDays = new Set<string>();
    drinks.forEach(drink => {
      const date = new Date(drink.timestamp).toLocaleDateString();
      uniqueDays.add(date);
    });
    return uniqueDays.size;
  }

  createWaterConsumptionChart(): void {
    const ctx = document.getElementById('waterConsumptionChart') as HTMLCanvasElement | null;
  
    if (!ctx) {
      console.error('Canvas element with id "waterConsumptionChart" not found.');
      return;
    }
  
    if (this.waterConsumptionChart) {
      this.waterConsumptionChart.destroy();
    }
  
    const { labels, data } = this.getChartData();
  
    this.waterConsumptionChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Споживання води (л)',
            data: data,
            borderColor: '#4A90E2',
            backgroundColor: 'rgba(74, 144, 226, 0.2)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Litres',
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            enabled: true,
          },
        },
      },
    });
  }

  getChartData(): { labels: string[], data: number[] } {
    switch (this.selectedMode) {
      case 'day':
        return this.getHourlyData();
      case 'week':
        return this.getLast7DaysData();
      case 'month':
        return this.getLast30DaysData();
      default:
        return this.getLast7DaysData();
    }
  }

  getHourlyData(): { labels: string[], data: number[] } {
    const labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const data = labels.map(hour => {
      const start = new Date();
      start.setHours(Number(hour.split(':')[0]), 0, 0, 0);
      const end = new Date(start);
      end.setHours(start.getHours() + 1);

      return this.drinkArray
        .filter(drink => new Date(drink.timestamp) >= start && new Date(drink.timestamp) < end)
        .reduce((sum, drink) => sum + drink.amount, 0) / 1000;  
    });

    return { labels, data };
  }

  getLast7DaysData(): { labels: string[], data: number[] } {
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString());
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const dailyConsumption = this.drinkArray
        .filter(drink => new Date(drink.timestamp) >= startOfDay && new Date(drink.timestamp) <= endOfDay)
        .reduce((sum, drink) => sum + drink.amount, 0);

      data.push(dailyConsumption / 1000);  
    }
    return { labels, data };
  }

  getLast30DaysData(): { labels: string[], data: number[] } {
    const labels = [];
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString());
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      const dailyConsumption = this.drinkArray
        .filter(drink => new Date(drink.timestamp) >= startOfDay && new Date(drink.timestamp) <= endOfDay)
        .reduce((sum, drink) => sum + drink.amount, 0);

      data.push(dailyConsumption / 1000); 
    }
    return { labels, data };
  }
}
