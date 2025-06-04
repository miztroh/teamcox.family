import { Component, Input, HostBinding, HostListener, ElementRef, inject, AfterViewInit, WritableSignal, signal, Renderer2, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { ThemeService } from '../../theme/theme.service';

export interface OsDesktopIconPosition {
	x: number;
	y: number;
}

export class OsDesktopIconModel {
	public readonly icon: WritableSignal<string> = signal('');
	public readonly label: WritableSignal<string> = signal('');
	public readonly position: WritableSignal<OsDesktopIconPosition> = signal({ x: 0, y: 0 });
	public readonly active: WritableSignal<boolean> = signal(false);
	public readonly lastActivated: WritableSignal<number> = signal(Date.now());
	public readonly component: WritableSignal<OsDesktopIcon | undefined> = signal(undefined);
};

@Component({
	selector: 'os-desktop-icon',
	standalone: true,
	imports: [CommonModule],
	templateUrl: 'component.html',
	styleUrls: ['component.css'],
	hostDirectives: [
		{
			directive: CdkDrag,
			outputs: ['cdkDragEnded']
		}
	]
})
export class OsDesktopIcon implements AfterViewInit {
	@Input() dragBoundary?: HTMLElement;
	@Input() model!: OsDesktopIconModel;

	@HostBinding('attr.tabindex') tabindex = 0;
	@HostBinding('attr.active')
	get activeAttr() {
		return this.model.active() ? '' : null;
	}

	public readonly elementRef = inject(ElementRef);
	private readonly renderer = inject(Renderer2);
	private readonly drag = inject(CdkDrag, { self: true });
	public readonly cdr = inject(ChangeDetectorRef);
	public readonly themeService = inject(ThemeService);

	@HostListener('cdkDragEnded')
	onDragEnded() {
		this.elementRef.nativeElement.dispatchEvent(
			new CustomEvent(
				'desktop-icon-drag-end',
				{
					bubbles: true,
					detail: this
				}
			)
		);
	}

	@HostListener('mousedown', ['$event'])
	onClick(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.model.active.set(true);
	}

	@HostListener('contextmenu', ['$event'])
	onContextMenu(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.elementRef.nativeElement.dispatchEvent(new CustomEvent('desktop-icon-context-menu', { bubbles: true, detail: this }));
	}

	ngAfterViewInit(): void {
		// Set this component in the model
		if (this.model.component() !== this) {
			this.model.component.set(this);
		}

		const hostElement = this.elementRef.nativeElement;
		if (this.dragBoundary) this.drag.boundaryElement = this.dragBoundary;
		const position = this.model.position();
		this.renderer.setStyle(hostElement, 'top', `${position.y}px`);
		this.renderer.setStyle(hostElement, 'left', `${position.x}px`);
	}

	constructor() {
		// Add drag end handler
		this.drag.ended.subscribe(() => {
			const el = this.elementRef.nativeElement;
			const parentRect = el.offsetParent
				? (el.offsetParent as HTMLElement).getBoundingClientRect()
				: { left: 0, top: 0 };
			const clientRect = el.getBoundingClientRect();

			const position = {
				x: clientRect.left - parentRect.left,
				y: clientRect.top - parentRect.top
			};

			if (JSON.stringify(position) !== JSON.stringify(this.model.position())) {
				this.model.position.set(position);
			}

			// Reset CDK drag position
			this.drag.reset();
		});

		// Add a single effect to apply styles based on rect changes
		effect(() => {
			const { x, y } = this.model.position();
			const host = this.elementRef.nativeElement;
			this.renderer.setStyle(host, 'top', `${y}px`);
			this.renderer.setStyle(host, 'left', `${x}px`);
		});

		// Active
		effect(
			() => {
				const active = this.model.active();

				if (active) {
					this.elementRef.nativeElement.dispatchEvent(
						new CustomEvent(
							'desktop-icon-activate',
							{
								bubbles: true,
								detail: this
							}
						)
					);
				}
			}
		);
	}
}