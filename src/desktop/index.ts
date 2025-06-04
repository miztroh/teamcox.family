import { Component, ViewChild, ViewContainerRef, AfterViewInit, Type, ChangeDetectorRef, ElementRef, WritableSignal, signal, inject, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OsApplication } from '../application';
import { OsMenuComponent } from '../menu';
import { OsTaskbar } from '../taskbar';
import { OsApplicationWindow } from '../application/window';
import { OsMenuModel } from '../menu';
import { OsDesktopIcon } from './icon';
import { ThemeService } from '../theme/theme.service';

//import { OsApplicationExplorer } from '../application/explorer';
import { OsApplicationBlog } from '../application/blog';

@Component({
	selector: 'os-desktop',
	templateUrl: 'component.html',
	styleUrl: 'component.css',
	standalone: true,
	imports: [CommonModule, OsTaskbar, OsMenuComponent]
})
export class OsDesktop implements AfterViewInit {
	@ViewChild('appsContainerView', { read: ViewContainerRef }) appsContainerView!: ViewContainerRef;
	@ViewChild(OsMenuComponent) menuComponent?: OsMenuComponent;
	@ViewChild('windows') windowsRef!: ElementRef;
	@ViewChild('icons') iconsRef!: ElementRef;
	@ViewChild('apps') appsRef!: ElementRef;

	appTypes: Type<OsApplication>[] = [
		//OsApplicationExplorer,
		OsApplicationBlog
	];

	appRefs: OsApplication[] = [];

	public readonly rightClickMenuModel: OsMenuModel = new OsMenuModel(0, 0, false, [], 'top-left');
	public readonly themeService = inject(ThemeService);
	private readonly renderer = inject(Renderer2);

	alignToGrid = false;

	constructor(private cdr: ChangeDetectorRef) { }

	ngAfterViewInit() {
		this.appsContainerView.clear();
		this.appRefs = [];

		for (const AppType of this.appTypes) {
			const componentRef = this.appsContainerView.createComponent(AppType);
			this.appRefs.push(componentRef.instance);
		}

		this.cdr.detectChanges();
	}

	get taskbarIcons() {
		return this.appRefs.map(app => ({ taskbarIconTemplate: app.taskbarIconTemplate }));
	}

	onRightClick(event: MouseEvent) {
		event.preventDefault();

		for (const app of this.appRefs) {
			if (app.leftClickMenuModel?.visible()) app.leftClickMenuModel.visible.set(false);
			if (app.rightClickMenuModel?.visible()) app.rightClickMenuModel.visible.set(false);
		}

		const desktop = document.getElementById('desktop');
		let x = event.clientX;
		let y = event.clientY;
		let menuWidth = 220;
		let menuHeight = 180;
		// If we can measure the menu, use its real size
		const menuEl = document.querySelector('.context-menu') as HTMLElement;
		if (menuEl) {
			menuWidth = menuEl.offsetWidth || menuWidth;
			menuHeight = menuEl.offsetHeight || menuHeight;
		}
		if (desktop) {
			const rect = desktop.getBoundingClientRect();
			// Clamp right edge
			if (x + menuWidth > rect.right) {
				x = rect.right - menuWidth;
			}
			// Clamp left edge
			if (x < rect.left) {
				x = rect.left;
			}
			// Clamp bottom edge
			if (y + menuHeight > rect.bottom) {
				y = rect.bottom - menuHeight;
			}
			// Clamp top edge
			if (y < rect.top) {
				y = rect.top;
			}
		}

		this.rightClickMenuModel.x.set(x);
		this.rightClickMenuModel.y.set(y);
		this.rightClickMenuModel.visible.set(true);
		this.updateMenuItems();
		this.cdr.detectChanges();

		for (const app of this.appRefs) {
			app.windows().forEach(win => win.active.set(false));
		}
	}

	onLeftClick(event: MouseEvent) {
		this.rightClickMenuModel.visible.set(false);

		for (const app of this.appRefs) {
			if (app.leftClickMenuModel?.visible()) app.leftClickMenuModel.visible.set(false);
			if (app.rightClickMenuModel?.visible()) app.rightClickMenuModel.visible.set(false);
			app.windows().forEach(win => win.active.set(false));
		}
	}

	switchTheme() {
		const newTheme = this.themeService.activeTheme() === 'dark' ? 'light' : 'dark';
		this.themeService.toggleUseSystemTheme(false);
		this.themeService.setTheme(newTheme);
		this.updateMenuItems();
	}

	sortIcons() {
		this.rightClickMenuModel.visible.set(false);
	}

	toggleAlignToGrid() {
		this.alignToGrid = !this.alignToGrid;
		this.updateMenuItems();
		this.rightClickMenuModel.visible.set(false);
	}

	updateMenuItems() {
		this.rightClickMenuModel.items.set([
			{ label: this.themeService.activeTheme() === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme', action: () => this.switchTheme(), icon: this.getIcon(this.themeService.activeTheme() === 'dark' ? 'sun' : 'moon') },
			{ divider: true },
			{ label: 'Sort Icons', action: () => this.sortIcons(), icon: this.getIcon('sort') },
			{ label: 'Align to Grid', action: () => this.toggleAlignToGrid(), checked: this.alignToGrid, icon: this.getIcon('grid') }
		]);
	}

	getIcon(name: string): string {
		if (name === 'moon') return '/moon-light.svg';
		if (name === 'sun') return '/sun-dark.svg';
		return `/${name}-${this.themeService.activeTheme()}.svg`;
	}

	onWindowActivate(window: OsApplicationWindow) {
		const allWindows = this.appRefs.flatMap(app => app.windows());

		// Update the activated window's timestamp
		window.model.lastActivated.set(Date.now());

		// Sort windows by last activated (most recent first)
		const sortedWindows = allWindows.sort((a, b) =>
			b.lastActivated() - a.lastActivated()
		);

		// Assign z-index based on activation order
		sortedWindows.forEach((win, index) => {
			const windowComponent = win.component();
			if (windowComponent) {
				// Most recently activated gets highest z-index
				const zIndex = 1000 - index;
				this.renderer.setStyle(windowComponent.elementRef.nativeElement, 'z-index', zIndex.toString());

				// Only the most recently activated is "active"
				win.active.set(index === 0);
			}
		});
	}

	onDesktopIconActivate(icon: OsDesktopIcon) {
		const allIcons = this.appRefs.flatMap(app => app.desktopIcons());

		// Update the activated icon's timestamp
		icon.model.lastActivated.set(Date.now());

		// Sort icons by last activated (most recent first)
		const sortedIcons = allIcons.sort((a, b) =>
			b.lastActivated() - a.lastActivated()
		);

		// Assign z-index based on activation order
		sortedIcons.forEach((iconModel, index) => {
			const iconComponent = iconModel.component();

			if (iconComponent) {
				// Most recently activated gets highest z-index
				const zIndex = 100 - index;
				this.renderer.setStyle(iconComponent.elementRef.nativeElement, 'z-index', zIndex.toString());

				// Only the most recently activated is "active"
				iconModel.active.set(index === 0);
			}
		});
	}

	onTaskbarContextMenu(event: MouseEvent) {
		event.preventDefault();
		if (this.rightClickMenuModel.visible()) this.rightClickMenuModel.visible.set(false);

		for (const app of this.appRefs) {
			app.windows().forEach(win => win.active.set(false));
		}
	}

	onTaskbarClick(event: MouseEvent) {
		event.preventDefault();
		if (this.rightClickMenuModel.visible()) this.rightClickMenuModel.visible.set(false);

		for (const app of this.appRefs) {
			app.windows().forEach(win => win.active.set(false));
		}
	}

	onDesktopIconDragEnd(icon: OsDesktopIcon) {
	}

	onDesktopIconContextMenu(icon: OsDesktopIcon) {
		if (this.rightClickMenuModel.visible()) this.rightClickMenuModel.visible.set(false);

		for (const app of this.appRefs) {
			app.windows().forEach(win => win.active.set(false));
		}
	}
}