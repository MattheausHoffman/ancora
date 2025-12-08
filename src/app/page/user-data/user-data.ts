import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AncoraApi } from '../../services/ancora-api';


@Component({
  selector: 'app-user-data',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './user-data.html',
  styleUrl: './user-data.css'
})
export class UserData {

  nome = '';
  cpfCnpj = '';
  dataNascimento = '';
  email = '';

  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private api: AncoraApi
  ) {}

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.nome.trim()) {
      this.errorMessage = 'Informe o nome.';
      return;
    }

    // Decide se é CPF ou CNPJ de forma simples
    const digits = this.cpfCnpj.replace(/\D/g, '');
    let cpf: string | null = null;
    let cnpj: string | null = null;

    if (digits.length <= 11) {
      cpf = this.cpfCnpj || null;
    } else {
      cnpj = this.cpfCnpj || null;
    }

    this.loading = true;

    this.api.saveUserData({
      nome: this.nome,
      cpf,
      cnpj,
      email: this.email || null,
      dataNascimento: this.dataNascimento || null
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.api.currentUserId = res.idUsuario;
        this.router.navigate(['/forms-data']);
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.errorMessage = 'Erro ao salvar dados do usuário.';
      }
    });
  }
}
