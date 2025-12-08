import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AncoraApi } from '../../services/ancora-api';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forms-data',
  imports: [RouterLink, NgIf, FormsModule],
  templateUrl: './forms-data.html',
  styleUrl: './forms-data.css',
})
export class FormsData {
tema = '';
  descricao = '';

  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private api: AncoraApi
  ) {}

  onSubmit(): void {
    this.errorMessage = '';

    const idUsuario = this.api.currentUserId;
    if (!idUsuario) {
      this.errorMessage = 'Usuário não encontrado. Volte para a etapa anterior.';
      this.router.navigate(['/user-data']);
      return;
    }

    this.loading = true;

    this.api.saveFormsData({
      idUsuario,
      tema: this.tema || null,
      descricao: this.descricao || null,
      documentos: []
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.api.currentOcorrenciaId = res.idOcorrencia;
        this.router.navigate(['/payment-page']);
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.errorMessage = 'Erro ao salvar dados da ocorrência.';
      }
    });
  }
}
