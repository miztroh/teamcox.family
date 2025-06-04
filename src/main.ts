import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './config';
import { OsDesktop } from './desktop';

bootstrapApplication(OsDesktop, appConfig).catch((err) => console.error(err));