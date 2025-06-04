import { Component, Input, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'os-taskbar',
	templateUrl: 'component.html',
	styleUrls: ['component.css'],
	standalone: true,
	imports: [CommonModule]
})
export class OsTaskbar {
	@Input() taskbarIcons: { taskbarIconTemplate: TemplateRef<any> }[] = [];
}