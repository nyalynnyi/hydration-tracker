import { Component, OnInit } from '@angular/core';
import { Chart, ArcElement, Tooltip, Legend, DoughnutController } from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend, DoughnutController);

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit {
  hydrationChart: any;
  currentHydration: number = 0; // Випито води (унції)
  hydrationGoal: number = 64; // Ціль гідратації

  constructor() {}

  ngOnInit(): void {
    this.createHydrationChart();
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
  }
}
