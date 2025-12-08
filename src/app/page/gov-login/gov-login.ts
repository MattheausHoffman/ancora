import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-gov-login',
  imports: [RouterLink],
  templateUrl: './gov-login.html',
  styleUrl: './gov-login.css',
})
export class GovLogin {
  constructor(private router: Router) {}

  onContinuar(): void {
    this.router.navigate(['/user-data']);
  }
}
