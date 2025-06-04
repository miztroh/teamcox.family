import { Component, Input, WritableSignal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type OsMenuAnchor = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface OsMenuItem {
	icon?: string;
	label?: string;
	action?: () => void;
	disabled?: boolean;
	divider?: boolean;
	shortcut?: string;
	checked?: boolean;
};

export class OsMenuModel {
	public readonly x: WritableSignal<number> = signal(0);
	public readonly y: WritableSignal<number> = signal(0);
	public readonly visible: WritableSignal<boolean> = signal(false);
	public readonly items: WritableSignal<OsMenuItem[]> = signal([]);
	public readonly anchor: WritableSignal<OsMenuAnchor> = signal('top-left');

	constructor(x: number, y: number, visible: boolean, items: OsMenuItem[], anchor: OsMenuAnchor) {
		this.x.set(x);
		this.y.set(y);
		this.visible.set(visible);
		this.items.set(items);
		this.anchor.set(anchor);
	}
}

@Component({
	selector: 'os-menu',
	templateUrl: 'component.html',
	styleUrls: ['component.css'],
	standalone: true,
	imports: [CommonModule]
})
export class OsMenuComponent {
	@Input() model!: OsMenuModel;
} 