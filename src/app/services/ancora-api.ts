import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AncoraApi {
  private apiUrl = 'http://localhost:3000/api';

  currentUserId: number | null = null;
  currentOcorrenciaId: number | null = null;

  constructor(private http: HttpClient) {}

  saveUserData(data: {
    nome: string;
    cpf: string | null;
    cnpj: string | null;
    email: string | null;
    dataNascimento: string | null;
  }): Observable<{ idUsuario: number }> {
    return this.http.post<{ idUsuario: number }>(
      `${this.apiUrl}/user-data`,
      data
    );
  }

  saveFormsData(data: {
    idUsuario: number;
    tema: string | null;
    descricao: string | null;
    documentos: any[];
  }): Observable<{ idOcorrencia: number; protocolo: number }> {
    return this.http.post<{ idOcorrencia: number; protocolo: number }>(
      `${this.apiUrl}/forms-data`,
      data
    );
  }

  savePayment(data: {
    idOcorrencia: number;
    valor: number;
    formaPagamento: string;
    pago: boolean;
  }): Observable<{ idPagamento: number; paid: boolean }> {
    return this.http.post<{ idPagamento: number; paid: boolean }>(
      `${this.apiUrl}/payment`,
      data
    );
  }
}
