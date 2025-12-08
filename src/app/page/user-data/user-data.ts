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
  cpfCnpj = ''; // agora representa apenas CPF (apenas dígitos)
  telefone = '';
  dataNascimento = '';
  email = '';

  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private api: AncoraApi
  ) {}

  onNomeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // permite letras (inclui acentos) e espaços somente
    this.nome = input.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '');
  }

  onNomeKeyDown(event: KeyboardEvent): void {
    const k = event.key;
    const allowedControl = ['Backspace','Tab','ArrowLeft','ArrowRight','Delete','Home','End'];
    if (allowedControl.includes(k)) return;
    // allow copy/paste/select all with Ctrl/Cmd
    if ((event.ctrlKey || event.metaKey) && ['a','c','v','x'].includes(k.toLowerCase())) return;
    // allow letters (inclui acentos) and space
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]$/.test(k)) {
      event.preventDefault();
    }
  }

  onNomePaste(event: ClipboardEvent): void {
    const paste = event.clipboardData?.getData('text') || '';
    // keep only letters (incl. accents) and spaces
    const cleaned = paste.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '');
    if (!cleaned) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    const target = event.target as HTMLInputElement;
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? start;
    const before = target.value.slice(0, start);
    const after = target.value.slice(end);
    this.nome = (before + cleaned + after).replace(/\s+/g, ' ');
    // update the actual input value and emit input event so ngModel syncs
    target.value = this.nome;
    setTimeout(() => target.dispatchEvent(new Event('input', { bubbles: true })), 0);
  }

  // novo: aceita apenas dígitos e limita a 14 (CPF ou CNPJ)
  onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 14);

    if (digits.length <= 11) {
      this.cpfCnpj = this.applyMaskCpf(digits);
    } else {
      this.cpfCnpj = this.applyMaskCnpj(digits);
    }
  }

  // Aplica máscara CPF: 000.000.000-00
  private applyMaskCpf(digits: string): string {
    if (!digits) return '';
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  // Aplica máscara CNPJ: 00.000.000/0000-00
  private applyMaskCnpj(digits: string): string {
    if (!digits) return '';
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }

  // Validador de CPF (algoritmo)
  private isValidCpf(cpf: string): boolean {
    const s = cpf.replace(/\D/g, '');
    if (s.length !== 11) return false;
    if (/^(\d)\1+$/.test(s)) return false;
    const nums = s.split('').map(Number);
    // primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += nums[i] * (10 - i);
    let rev = 11 - (sum % 11);
    const dv1 = rev >= 10 ? 0 : rev;
    if (dv1 !== nums[9]) return false;
    // segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) sum += nums[i] * (11 - i);
    rev = 11 - (sum % 11);
    const dv2 = rev >= 10 ? 0 : rev;
    return dv2 === nums[10];
  }

  // Validador de CNPJ (algoritmo)
  private isValidCnpj(cnpj: string): boolean {
    const s = cnpj.replace(/\D/g, '');
    if (s.length !== 14) return false;
    if (/^(\d)\1+$/.test(s)) return false;
    const nums = s.split('').map(Number);
    const weights1 = [5,4,3,2,9,8,7,6,5,4,3,2];
    const weights2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += nums[i] * weights1[i];
    let rev = sum % 11;
    let dv1 = rev < 2 ? 0 : 11 - rev;
    if (dv1 !== nums[12]) return false;
    sum = 0;
    for (let i = 0; i < 13; i++) sum += nums[i] * weights2[i];
    rev = sum % 11;
    let dv2 = rev < 2 ? 0 : 11 - rev;
    return dv2 === nums[13];
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.nome.trim()) {
      this.errorMessage = 'Informe o nome.';
      return;
    }

    if (!this.email || !this.email.toLowerCase().endsWith('@gmail.com')) {
      this.errorMessage = 'Informe um email @gmail.com válido.';
      return;
    }

    // CPF ou CNPJ obrigatório: remove máscara e extrai apenas dígitos
    const digits = (this.cpfCnpj || '').replace(/\D/g, '');
    if (!digits) {
      this.errorMessage = 'Informe CPF ou CNPJ.';
      return;
    }

    let cpf: string | null = null;
    let cnpj: string | null = null;

    if (digits.length === 11) {
      if (!this.isValidCpf(digits)) {
        this.errorMessage = 'CPF inválido.';
        return;
      }
      cpf = digits;
    } else if (digits.length === 14) {
      if (!this.isValidCnpj(digits)) {
        this.errorMessage = 'CNPJ inválido.';
        return;
      }
      cnpj = digits;
    } else {
      this.errorMessage = 'Informe CPF (11 dígitos) ou CNPJ (14 dígitos).';
      return;
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

  onCpfKeyDown(event: KeyboardEvent): void {
    const k = event.key;
    const allowed = ['Backspace','Tab','ArrowLeft','ArrowRight','Delete','Home','End'];
    if (allowed.includes(k)) return;
    // allow copy/paste/select all with Ctrl/Cmd
    if ((event.ctrlKey || event.metaKey) && ['a','c','v','x'].includes(k.toLowerCase())) return;
    // block anything that is not a single digit
    if (!/^\d$/.test(k)) {
      event.preventDefault();
    }
  }

  onCpfPaste(event: ClipboardEvent): void {
    const paste = event.clipboardData?.getData('text') || '';
    const digits = paste.replace(/\D/g, '');
    if (!digits) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    const max = 14;
    const target = event.target as HTMLInputElement;
    const before = target.value.replace(/\D/g, '').slice(0, target.selectionStart ?? target.value.length);
    const after = target.value.replace(/\D/g, '').slice(target.selectionEnd ?? target.value.length);
    const allowedInsert = digits.slice(0, Math.max(0, max - (before + after).length));
    const combined = (before + allowedInsert + after).slice(0, max);

    if (combined.length <= 11) {
      this.cpfCnpj = this.applyMaskCpf(combined);
    } else {
      this.cpfCnpj = this.applyMaskCnpj(combined);
    }

    setTimeout(() => {
      target.dispatchEvent(new Event('input', { bubbles: true }));
    }, 0);
  }

  // aceita apenas dígitos no telefone (DDD + número), sem formatação
  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 11);
    this.telefone = digits;
  }

  onPhoneKeyDown(event: KeyboardEvent): void {
    const k = event.key;
    const allowed = ['Backspace','Tab','ArrowLeft','ArrowRight','Delete','Home','End'];
    if (allowed.includes(k)) return;
    if ((event.ctrlKey || event.metaKey) && ['a','c','v','x'].includes(k.toLowerCase())) return;
    if (!/^\d$/.test(k)) {
      event.preventDefault();
    }
  }

  onPhonePaste(event: ClipboardEvent): void {
    const paste = event.clipboardData?.getData('text') || '';
    const digits = paste.replace(/\D/g, '');
    if (!digits) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    const max = 11;
    const target = event.target as HTMLInputElement;
    const before = target.value.slice(0, target.selectionStart ?? target.value.length);
    const after = target.value.slice(target.selectionEnd ?? target.value.length);
    const allowedInsert = digits.slice(0, Math.max(0, max - (before + after).length));
    this.telefone = (before + allowedInsert + after).slice(0, max);
    setTimeout(() => {
      target.dispatchEvent(new Event('input', { bubbles: true }));
    }, 0);
  }
}
