import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Router } from '@angular/router';
import { NzIconService } from 'ng-zorro-antd/icon';
import { CreditCardOutline, EyeOutline } from '@ant-design/icons-angular/icons';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzLayoutModule,
    NzMenuModule,
    NzIconModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  selectedIndex = 0;

  constructor(
    private router: Router,
    private iconService: NzIconService
  ) {
    // Register icons
    this.iconService.addIcon(CreditCardOutline, EyeOutline);
    
    // Set initial selected index based on current route
    this.router.events.subscribe(() => {
      const url = this.router.url;
      if (url.includes('glb-viewer')) {
        this.selectedIndex = 1;
      } else {
        this.selectedIndex = 0;
      }
    });
  }

  onMenuClick(event: any) {
    const index = event.key;
    this.selectedIndex = index;
    
    if (index === 0) {
      this.router.navigate(['/card-creator']);
    } else if (index === 1) {
      this.router.navigate(['/glb-viewer']);
    }
  }
}
