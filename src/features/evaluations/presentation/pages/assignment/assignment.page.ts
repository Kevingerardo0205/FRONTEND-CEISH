import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-assignment',
  standalone: true,
  template: `
    <div class="redirect-container">
      <p>Redireccionando al panel de asignación directa...</p>
    </div>
  `,
  styles: [`
    .redirect-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-weight: 600;
      color: #64748b;
    }
  `]
})
export class AssignmentPage implements OnInit {
  private router = inject(Router);

  ngOnInit() {
    this.router.navigate(['/dashboard/home'], { queryParams: { tab: 'peers' } });
  }
}
