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

@Component({
	selector: 'os-application-explorer',
	templateUrl: 'component.html',
	styleUrls: ['../component.css', 'component.css'],
	standalone: true,
	imports: [CommonModule, OsApplicationWindow, OsMenuComponent, OsDesktopIcon, CdkDrag, OsTaskbarIcon]
})
export class OsApplicationExplorer extends OsApplication {
	static component = OsApplicationExplorer;

	public override leftClickMenuModel: OsMenuModel | null = new OsMenuModel(0, 0, false, [], 'bottom-left');
	public override rightClickMenuModel: OsMenuModel | null = new OsMenuModel(0, 0, false, [], 'bottom-left');

	constructor() {
		super();
		this.title.set('Explorer');
		this.icon.set('/explorer.svg');

		const icon1 = new OsDesktopIconModel();
		icon1.icon.set('/explorer.svg');
		icon1.label.set('Explorer');
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
}