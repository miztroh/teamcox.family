import { Directive, TemplateRef, ViewChild, signal, WritableSignal, computed, inject, ElementRef } from '@angular/core';
import { OsApplicationWindowModel } from './window';
import { effect } from '@angular/core';
import { OsMenuModel } from '../menu';
import { ThemeService } from '../theme/theme.service';
import { OsDesktopIconModel } from '../desktop/icon';

@Directive()
export abstract class OsApplication {
	@ViewChild('desktopIcon', { static: true }) desktopIconTemplate!: TemplateRef<any>;
	@ViewChild('taskbarIcon', { static: true }) taskbarIconTemplate!: TemplateRef<any>;
	@ViewChild('window', { static: true }) windowTemplate!: TemplateRef<any>;
	@ViewChild('leftClickMenu', { static: true }) leftClickMenuTemplate!: TemplateRef<any>;
	@ViewChild('rightClickMenu', { static: true }) rightClickMenuTemplate!: TemplateRef<any>;

	public readonly title: WritableSignal<string> = signal('');
	public readonly icon: WritableSignal<string> = signal('');
	public readonly windows: WritableSignal<readonly OsApplicationWindowModel[]> = signal([]);
	public readonly activeWindow = computed(() => this.windows().find(w => w.active()));
	public readonly leftClickMenuModel: OsMenuModel | null = null;
	public readonly rightClickMenuModel: OsMenuModel | null = null;
	public readonly desktopIcons: WritableSignal<readonly OsDesktopIconModel[]> = signal([]);

	protected readonly elementRef = inject(ElementRef);
	protected readonly themeService = inject(ThemeService);

	// Create a new window data model
	createWindow(): OsApplicationWindowModel {
		const window = new OsApplicationWindowModel();
		window.title.set(this.title());
		window.icon.set(this.icon());
		this.windows.set([...this.windows(), window]);
		return window;
	}

	// Menu actions
	minimizeAll() {
		for (const window of this.windows()) {
			window.minimizing.set(true);
		}

		this.leftClickMenuModel?.visible.set(false);
		this.rightClickMenuModel?.visible.set(false);
	}

	restoreAll() {
		for (const window of this.windows()) {
			if (window.maximized()) {
				window.restoringDown.set(true);
			} else if (window.minimized()) {
				window.restoringUp.set(true);
			}
		}

		this.leftClickMenuModel?.visible.set(false);
		this.rightClickMenuModel?.visible.set(false);
	}

	closeAll() {
		for (const window of this.windows()) {
			window.closed.set(true);
		}

		this.leftClickMenuModel?.visible.set(false);
		this.rightClickMenuModel?.visible.set(false);
	}

	protected calculateMenuDimensions(items: { label: string; icon?: string; action?: () => void; divider?: boolean }[]): { width: number, height: number } {
		const itemHeight = 36; // Height of each menu item (including padding)
		const menuPadding = 12; // Total vertical padding (6px top + 6px bottom)
		const dividerHeight = 13; // Height of divider (1px + 6px margin top + 6px margin bottom)
		const menuWidth = 220; // Fixed width from menu CSS

		// Calculate total height based on items
		const height = items.reduce((total, item) => {
			return total + (item.divider ? dividerHeight : itemHeight);
		}, menuPadding);

		return { width: menuWidth, height };
	}

	onTaskbarIconLeftClick(event: MouseEvent) {
		event.preventDefault();
		const windows = this.windows();
		this.rightClickMenuModel?.visible.set(false);

		if (windows.length < 1) return;

		if (windows.length < 2) {
			if (windows[0].minimized()) {
				if (!windows[0].restoringUp()) windows[0].restoringUp.set(true);
			} else if (windows[0].minimizing()) {
				if (!windows[0].minimizing()) windows[0].minimizing.set(false);
			} else {
				if (!windows[0].minimizing()) windows[0].minimizing.set(true);
			}

			return;
		}

		const target = event.target as HTMLElement;
		if (!target) return;
		const menuWidth = 220; // Fixed menu width from CSS
		const targetRect = target.getBoundingClientRect();
		const x = (targetRect.left + targetRect.width / 2) - (menuWidth / 2); // Center the menu horizontally
		this.leftClickMenuModel?.x.set(x);
		this.leftClickMenuModel?.y.set(0);
		this.leftClickMenuModel?.visible.set(true);
	}

	onTaskbarIconContextMenu(event: MouseEvent) {
		event.preventDefault();
		const target = event.target as HTMLElement;
		if (!target) return;
		this.leftClickMenuModel?.visible.set(false);
		this.rightClickMenuModel?.visible.set(true);
		const menuWidth = 220; // Fixed menu width from CSS
		const targetRect = target.getBoundingClientRect();
		const x = (targetRect.left + targetRect.width / 2) - (menuWidth / 2); // Center the menu horizontally
		this.rightClickMenuModel?.x.set(x);
		this.rightClickMenuModel?.y.set(0);
	}

	onWindowMenuItemClick(window: OsApplicationWindowModel) {
		if (!window.active()) window.active.set(true);
		this.leftClickMenuModel?.visible.set(false);
		this.rightClickMenuModel?.visible.set(false);
	}

	constructor() {
		// Effect to filter out closed windows
		effect(() => {
			const currentWindows = this.windows();
			const openWindows = currentWindows.filter(win => !win.closed());
			if (openWindows.length !== currentWindows.length) this.windows.set(openWindows);
		});
	}

	// Menu positioning
	protected constrainMenuPosition(x: number, y: number, menuWidth: number, menuHeight: number): { x: number, y: number } {
		const desktop = document.getElementById('desktop');
		if (!desktop) return { x, y };

		const rect = desktop.getBoundingClientRect();

		// Clamp right edge
		if (x + menuWidth > rect.right) {
			x = rect.right - menuWidth;
		}
		// Clamp left edge
		if (x < rect.left) {
			x = rect.left;
		}
		// Clamp bottom edge (so menu never overlaps the taskbar visually)
		const maxBottom = rect.bottom - 13;
		if (y + menuHeight > maxBottom) {
			y = maxBottom - menuHeight;
		}
		// Clamp top edge
		if (y < rect.top) {
			y = rect.top;
		}

		return { x, y };
	}
} 