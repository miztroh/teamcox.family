import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { ThemeService } from './theme/theme.service';

export const appConfig: ApplicationConfig = {
	providers: [
		provideZoneChangeDetection({ eventCoalescing: true }),
		ThemeService
	]
};
