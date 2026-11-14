import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UndoToastHostComponent } from '@shared/ui/undo-toast/undo-toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, UndoToastHostComponent],
  template: `
    <router-outlet></router-outlet>
    <app-undo-toast-host />
  `,
})
export class AppComponent {}
