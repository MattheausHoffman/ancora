import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-gov-login',
  imports: [],
  templateUrl: './gov-login.html',
  styleUrl: './gov-login.css',
})
export class GovLogin {
  constructor(private router: Router) {}

  onSubmit(event: Event): void {
    event.preventDefault();
    // aqui você poderia validar o CPF, chamar API etc.
    // por enquanto apenas navega para o formulário de usuário
    this.router.navigate(['/user-data']);
  }
}
