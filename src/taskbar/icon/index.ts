import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeHtml } from '@angular/platform-browser';

@Component({
	selector: 'os-taskbar-icon',
	standalone: true,
	imports: [CommonModule],
	templateUrl: 'component.html',
	styleUrls: ['component.css']
})
export class OsTaskbarIcon {
	@Input() icon!: SafeHtml | null;
	@Input() label: string = 'Taskbar Icon';
} 