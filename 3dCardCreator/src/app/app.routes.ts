import { Routes } from '@angular/router';
import { GlbViewerComponent } from './glb-viewer/glb-viewer.component';
import { CardCreatorComponent } from './card-creator/card-creator.component';

export const routes: Routes = [
  { path: '', redirectTo: '/card-creator', pathMatch: 'full' },
  { path: 'card-creator', component: CardCreatorComponent },
  { path: 'glb-viewer', component: GlbViewerComponent }
];
