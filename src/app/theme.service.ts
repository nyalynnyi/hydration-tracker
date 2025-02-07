import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkThemeClass = 'dark-theme';

  constructor() {
    this.loadTheme();
  }

  toggleTheme() {
    const isDark = document.body.classList.toggle(this.darkThemeClass);
    this.setThemeVariables(isDark);
    localStorage.setItem('darkTheme', JSON.stringify(isDark));
  }

  private loadTheme() {
    const isDark = JSON.parse(localStorage.getItem('darkTheme') || 'false');
    document.body.classList.toggle(this.darkThemeClass, isDark);
    this.setThemeVariables(isDark);
  }

  
  private setThemeVariables(isDark: boolean) {
    const root = document.documentElement;
    if (isDark) {
      root.style.setProperty('--ion-background-color', '#1e1e1e');
      root.style.setProperty('--ion-text-color', '#ffffff');
      root.style.setProperty('--ion-card-background', '#2a2a2a');
      root.style.setProperty('--ion-card-title-color', '#ffffff');
      root.style.setProperty('--ion-divider-color', '#545454');
      root.style.setProperty('ion-segment-button-color','#ffffff')
    } else {
      root.style.setProperty('--ion-background-color', '#ffffff');
      root.style.setProperty('--ion-text-color', '#000000');
      root.style.setProperty('--ion-card-background', '#ffffff');
      root.style.setProperty('--ion-card-title-color', '#000000');
      root.style.setProperty('--ion-divider-color', '#ccc');
    }
  }
  
}
