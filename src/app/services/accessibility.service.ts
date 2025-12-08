import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private highContrastSubject = new BehaviorSubject<boolean>(this.loadHighContrast());
  public highContrast$ = this.highContrastSubject.asObservable();

  private fontSizeSubject = new BehaviorSubject<number>(this.loadFontSize());
  public fontSize$ = this.fontSizeSubject.asObservable();

  constructor() {
    this.applySettings();
  }

  toggleHighContrast(): void {
    const current = this.highContrastSubject.value;
    this.highContrastSubject.next(!current);
    localStorage.setItem('accessibility-highContrast', JSON.stringify(!current));
    this.applySettings();
  }

  increaseFontSize(): void {
    const current = this.fontSizeSubject.value;
    if (current < 150) {
      const newSize = Math.min(current + 10, 150);
      this.fontSizeSubject.next(newSize);
      localStorage.setItem('accessibility-fontSize', JSON.stringify(newSize));
      this.applySettings();
    }
  }

  decreaseFontSize(): void {
    const current = this.fontSizeSubject.value;
    if (current > 100) {
      const newSize = Math.max(current - 10, 100);
      this.fontSizeSubject.next(newSize);
      localStorage.setItem('accessibility-fontSize', JSON.stringify(newSize));
      this.applySettings();
    }
  }

  resetFontSize(): void {
    this.fontSizeSubject.next(100);
    localStorage.setItem('accessibility-fontSize', JSON.stringify(100));
    this.applySettings();
  }

  private loadHighContrast(): boolean {
    const saved = localStorage.getItem('accessibility-highContrast');
    return saved ? JSON.parse(saved) : false;
  }

  private loadFontSize(): number {
    const saved = localStorage.getItem('accessibility-fontSize');
    return saved ? JSON.parse(saved) : 100;
  }

  private applySettings(): void {
    const root = document.documentElement;

    if (this.highContrastSubject.value) {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }

    const fontSize = this.fontSizeSubject.value;
    root.style.fontSize = (fontSize / 100) * 16 + 'px';
  }
}
