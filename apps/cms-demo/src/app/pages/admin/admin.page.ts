import { Component, ChangeDetectionStrategy, signal, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CmsPagesManagerComponent } from '@org/cms-editor';

interface LoginResponse { data: { token: string } }

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CmsPagesManagerComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!loggedIn()) {
      <div class="admin-login">
        <div class="admin-login__card">
          <h2>Panel Admin</h2>
          <p class="admin-login__hint">
            Usuario: <code>sandra&#64;errestattoo.com</code><br>
            Contraseña: <code>Sandra2025!</code>
          </p>
          @if (loginError()) {
            <p class="admin-login__error">{{ loginError() }}</p>
          }
          <form (ngSubmit)="login()">
            <label class="cms-field">
              <span>Email</span>
              <input type="email" [(ngModel)]="email" name="email" required />
            </label>
            <label class="cms-field">
              <span>Contraseña</span>
              <input type="password" [(ngModel)]="password" name="password" required />
            </label>
            <button type="submit" class="cms-btn cms-btn--primary" style="margin-top:12px;width:100%">
              Entrar
            </button>
          </form>
        </div>
      </div>
    } @else {
      <div class="admin-shell">
        <div class="admin-shell__header">
          <span class="admin-shell__title">Panel CMS</span>
          <button class="cms-btn cms-btn--secondary" (click)="logout()">Salir</button>
        </div>
        <div class="admin-shell__content">
          <lib-cms-pages-manager />
        </div>
      </div>
    }
  `,
  styles: [`
    .admin-login {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-surface, #f5f5f5);
      padding: 24px;
    }
    .admin-login__card {
      background: #fff;
      border: 1px solid var(--color-border, #ddd);
      border-radius: 8px;
      padding: 32px;
      width: 100%;
      max-width: 380px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .admin-login__card h2 { margin: 0; font-size: 1.4rem; }
    .admin-login__hint { font-size: .8rem; color: var(--color-text-muted, #666); background: var(--color-surface, #f8f8f8); padding: 10px; border-radius: 4px; line-height: 1.8; }
    .admin-login__error { color: #e53e3e; font-size: .875rem; }
    form { display: flex; flex-direction: column; gap: 12px; }
    .admin-shell { min-height: 100vh; display: flex; flex-direction: column; }
    .admin-shell__header {
      background: var(--color-primary, #1e1e1e);
      color: #fff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .admin-shell__title { font-weight: 700; }
    .admin-shell__content { padding: 24px; max-width: 1600px; margin: 0 auto; width: 100%; }
  `],
})
export class AdminPage implements OnInit {
  private http = inject(HttpClient);

  readonly loggedIn   = signal(false);
  readonly loginError = signal<string | null>(null);

  email    = 'sandra@errestattoo.com';
  password = 'Sandra2025!';

  ngOnInit(): void {
    if (localStorage.getItem('auth_token')) this.loggedIn.set(true);
  }

  login(): void {
    this.loginError.set(null);
    this.http.post<LoginResponse>('/api/auth/login', { email: this.email, password: this.password })
      .subscribe({
        next: res => {
          localStorage.setItem('auth_token', res.data.token);
          this.loggedIn.set(true);
        },
        error: () => this.loginError.set('Credenciales incorrectas'),
      });
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    this.loggedIn.set(false);
  }
}
