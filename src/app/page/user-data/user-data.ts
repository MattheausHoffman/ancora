import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-data',
  imports: [],
  templateUrl: './user-data.html',
  styleUrl: './user-data.css',
})
export class UserData {
  constructor(private router: Router) {}

  onSubmit(event: Event): void {
    event.preventDefault();
    // aqui poderia validar os dados; por enquanto só navega
    this.router.navigate(['/forms-data']);
  }
}
