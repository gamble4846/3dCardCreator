import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideNzIcons } from 'ng-zorro-antd/icon';

import {
  HomeOutline,
  UserOutline,
  SettingOutline,
  UploadOutline,
  DownloadOutline,
  EyeOutline,
  EyeInvisibleOutline,
  FullscreenOutline,
  ReloadOutline,
  CreditCardOutline,
  VideoCameraOutline,
  CameraOutline,
  SyncOutline,
  FileOutline,
  InfoCircleOutline
} from '@ant-design/icons-angular/icons';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(),

    provideNzIcons([
      HomeOutline,
      UserOutline,
      SettingOutline,
      UploadOutline,
      DownloadOutline,
      EyeOutline,
      EyeInvisibleOutline,
      FullscreenOutline,
      ReloadOutline,
      CreditCardOutline,
      VideoCameraOutline,
      CameraOutline,
      SyncOutline,
      FileOutline,
      InfoCircleOutline
    ])
  ]
};
