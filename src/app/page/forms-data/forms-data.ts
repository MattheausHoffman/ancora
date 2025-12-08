import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-forms-data',
  imports: [RouterLink],
  templateUrl: './forms-data.html',
  styleUrl: './forms-data.css',
})
export class FormsData {
constructor(private router: Router) {}

  onSubmit(event: Event): void {
    event.preventDefault();
    // aqui você poderia validar / enviar os dados
    this.router.navigate(['/payment-page']);
  }
}
