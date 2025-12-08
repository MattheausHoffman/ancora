import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AncoraApi } from '../../services/ancora-api';

@Component({
  selector: 'app-payment-page',
  imports: [RouterLink, NgIf],
  templateUrl: './payment-page.html',
  styleUrl: './payment-page.css',
})
export class PaymentPage {
  valor = 25; // valor fixo
  pagamentoOk = false;
  errorMessage = '';
  loading = false;

  constructor(
    private router: Router,
    private api: AncoraApi
  ) {}

  confirmarPagamento(): void {
    this.errorMessage = '';

    const idOcorrencia = this.api.currentOcorrenciaId;
    if (!idOcorrencia) {
      this.errorMessage = 'Ocorrência não encontrada. Volte para a etapa anterior.';
      this.router.navigate(['/forms-data']);
      return;
    }

    this.loading = true;

    this.api.savePayment({
      idOcorrencia,
      valor: this.valor,
      formaPagamento: 'PIX',
      pago: true
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.pagamentoOk = res.paid === true;
        if (this.pagamentoOk) {
          setTimeout(() => {
            this.router.navigate(['/landing-page']);
          }, 2000);
        }
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.errorMessage = 'Erro ao registrar pagamento.';
      }
    });
  }
}
