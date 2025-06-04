import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OsApplicationWindow } from '../window';
import { OsApplication } from '../';
import { OsMenuComponent } from '../../menu';
import { OsDesktopIcon } from '../../desktop/icon';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { OsTaskbarIcon } from '../../taskbar/icon';
import { OsMenuModel } from '../../menu';
import { OsDesktopIconModel } from '../../desktop/icon';
import { OsApplicationWindowModel } from '../window';

@Component({
	selector: 'os-application-blog',
	templateUrl: 'component.html',
	styleUrls: ['../component.css', 'component.css'],
	standalone: true,
	imports: [CommonModule, OsApplicationWindow, OsMenuComponent, OsDesktopIcon, CdkDrag, OsTaskbarIcon]
})
export class OsApplicationBlog extends OsApplication {
	static component = OsApplicationBlog;

	public override leftClickMenuModel: OsMenuModel | null = new OsMenuModel(0, 0, false, [], 'bottom-left');
	public override rightClickMenuModel: OsMenuModel | null = new OsMenuModel(0, 0, false, [], 'bottom-left');

	constructor() {
		super();
		this.title.set('i ❤ technology');
		this.icon.set('/blog.svg');

		const icon1 = new OsDesktopIconModel();
		icon1.icon.set('/blog.svg');
		icon1.label.set('i ❤ technology');
		this.desktopIcons.set([...this.desktopIcons(), icon1]);

		effect(
			() => {
				this.leftClickMenuModel?.items.set(
					this.windows().map(
						(win) => (
							{
								label: win.title(),
								icon: win.icon(),
								action: () => this.onWindowMenuItemClick(win)
							}
						)
					)
				);
			}
		);

		// Update menu items when theme changes
		effect(() => {
			const theme = this.themeService.activeTheme();
			this.rightClickMenuModel?.items.set([
				{ label: 'Minimize All', action: () => this.minimizeAll(), icon: `/minimize-${theme}.svg` },
				{ label: 'Restore All', action: () => this.restoreAll(), icon: `/restore-${theme}.svg` },
				{ label: 'Close All', action: () => this.closeAll(), icon: `/close-${theme}.svg` }
			]);
		});
	}

	onDesktopIconDblClick() {
		this.createWindow();
	}

	override createWindow(): OsApplicationWindowModel {
		const existing = this.windows()[0];

		if (existing) {
			existing.active.set(true);
			return existing;
		}

		return super.createWindow();
	}
}