import { Component, Input, ElementRef, Renderer2, AfterViewInit, HostBinding, inject, signal, WritableSignal, effect, computed, Signal, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ThemeService } from '../../theme/theme.service';

export class OsApplicationWindowModel {
	public readonly id: string;
	public readonly title: WritableSignal<string> = signal('');
	public readonly type: WritableSignal<string> = signal('Window');
	public readonly minimized: WritableSignal<boolean> = signal(false);
	public readonly maximized: WritableSignal<boolean> = signal(false);
	public readonly active: WritableSignal<boolean> = signal(true);
	public readonly minimizing: WritableSignal<boolean> = signal(false);
	public readonly maximizing: WritableSignal<boolean> = signal(false);
	public readonly restoringUp: WritableSignal<boolean> = signal(false);
	public readonly restoringDown: WritableSignal<boolean> = signal(false);
	public readonly lastActivated: WritableSignal<number> = signal(Date.now());

	public readonly rect: WritableSignal<{ current: OsApplicationWindowRect, previous: OsApplicationWindowRect | undefined }> = signal(
		{
			current: {
				top: 50,
				left: 50,
				width: 800,
				height: 600
			},
			previous: undefined
		}
	);

	public readonly icon: WritableSignal<string> = signal('');
	public readonly closed: WritableSignal<boolean> = signal(false);
	public readonly resizing: WritableSignal<boolean> = signal(false);
	public readonly dragDisabled: Signal<boolean> = computed(() => this.maximized() || this.minimized());
	public readonly component: WritableSignal<OsApplicationWindow | undefined> = signal(undefined);

	public readonly lastUpdated: Signal<Date> = computed(() => {
		this.title();
		this.type();
		this.minimized();
		this.maximized();
		this.active();
		this.minimizing();
		this.maximizing();
		this.restoringUp();
		this.restoringDown();
		this.rect();
		this.icon();
		this.closed();
		this.resizing();
		this.lastActivated();
		return new Date();
	});

	constructor() {
		this.id = crypto.randomUUID();
	}
}

export interface OsApplicationWindowRect {
	top: number;
	left: number;
	width: number;
	height: number;
};

@Component({
	selector: 'os-window',
	templateUrl: 'component.html',
	styleUrl: 'component.css',
	standalone: true,
	imports: [CdkDragHandle],
	host: {
		'(click)': 'onClick($event)',
		'(contextmenu)': 'onContextMenu($event)',
		'(mousedown)': 'onMouseDown($event)'
	},
	hostDirectives: [
		{
			directive: CdkDrag,
			inputs: [
				'cdkDragDisabled: dragDisabled',
				'cdkDragConstrainPosition: false'
			]
		}
	]
})
export class OsApplicationWindow implements AfterViewInit, OnChanges {
	@Input() dragBoundary?: HTMLElement;
	@Input() model!: OsApplicationWindowModel;

	public readonly elementRef = inject(ElementRef);
	private readonly renderer = inject(Renderer2);
	private readonly drag = inject(CdkDrag);
	public readonly cdr = inject(ChangeDetectorRef);
	public readonly themeService = inject(ThemeService);

	private resizeStartX = 0;
	private resizeStartY = 0;
	private resizeStartWidth = 0;
	private resizeStartHeight = 0;

	@HostBinding('attr.id')
	get idAttr() {
		return this.model.id;
	}

	@HostBinding('attr.active')
	get activeAttr() {
		return this.model.active() ? '' : null;
	}

	@HostBinding('attr.resizing')
	get resizingAttr() {
		return this.model.resizing() ? '' : null;
	}

	@HostBinding('attr.minimizing')
	get minimizingAttr() {
		return this.model.minimizing() ? '' : null;
	}

	@HostBinding('attr.minimized')
	get minimizedAttr() {
		return this.model.minimized() ? '' : null;
	}

	@HostBinding('attr.maximizing')
	get maximizingAttr() {
		return this.model.maximizing() ? '' : null;
	}

	@HostBinding('attr.maximized')
	get maximizedAttr() {
		return this.model.maximized() ? '' : null;
	}

	@HostBinding('attr.restoring-up')
	get restoringUpAttr() {
		return this.model.restoringUp() ? '' : null;
	}

	@HostBinding('attr.restoring-down')
	get restoringDownAttr() {
		return this.model.restoringDown() ? '' : null;
	}

	constructor() {
		// Watch lastUpdated for change detection
		effect(() => {
			this.model.lastUpdated();
			this.cdr.detectChanges();
		});

		// Active
		effect(
			() => {
				const active = this.model.active();

				if (active) {
					this.elementRef.nativeElement.dispatchEvent(
						new CustomEvent(
							'window-activate',
							{
								bubbles: true,
								detail: this
							}
						)
					);
				}
			}
		);

		// Minimizing
		effect(
			() => {
				const minimizing = this.model.minimizing();

				if (minimizing) {
					setTimeout(
						() => {
							if (!this.model.minimized()) this.model.minimized.set(true);
						},
						300
					)
				}
			}
		);

		// Minimized
		effect(
			() => {
				const minimized = this.model.minimized();
				if (minimized && this.model.minimizing()) this.model.minimizing.set(false);
				if (!minimized && this.model.restoringUp() && !this.model.maximized()) this.model.restoringUp.set(false);
			}
		);

		// Maximized
		effect(
			() => {
				const maximized = this.model.maximized();
				if (maximized && this.model.maximizing()) this.model.maximizing.set(false);
				if (!maximized && this.model.restoringDown() && !this.model.minimized()) this.model.restoringDown.set(false);
			}
		);

		// Maximizing
		effect(
			() => {
				const maximizing = this.model.maximizing();

				if (maximizing) {
					setTimeout(
						() => {
							if (!this.model.maximized()) this.model.maximized.set(true);
						},
						300
					)
				}
			}
		);

		// Resizing
		effect(
			() => {
				const resizing = this.model.resizing();
				const hostElement = this.elementRef.nativeElement;

				if (resizing) {
					this.resizeStartWidth = hostElement.offsetWidth;
					this.resizeStartHeight = hostElement.offsetHeight;
					document.addEventListener('mousemove', this.onResizeMove);
					document.addEventListener('mouseup', this.onResizeEnd);
				} else {
					document.removeEventListener('mousemove', this.onResizeMove);
					document.removeEventListener('mouseup', this.onResizeEnd);
				}
			}
		);

		// Restoring Up
		effect(
			() => {
				const restoringUp = this.model.restoringUp();

				if (restoringUp) {
					setTimeout(
						() => {
							if (this.model.minimized()) this.model.minimized.set(false);
							if (this.model.restoringUp()) this.model.restoringUp.set(false);
						},
						300
					);
				}
			}
		);

		// Restoring Down
		effect(
			() => {
				const restoringDown = this.model.restoringDown();

				if (restoringDown) {
					setTimeout(
						() => {
							if (this.model.maximized()) this.model.maximized.set(false);
							if (this.model.restoringDown()) this.model.restoringDown.set(false);
						},
						300
					);
				}
			}
		);

		// Add a single effect to apply styles based on rect changes
		effect(() => {
			const { top, left, width, height } = this.model.rect().current;
			const host = this.elementRef.nativeElement;
			this.renderer.setStyle(host, 'top', `${top}px`);
			this.renderer.setStyle(host, 'left', `${left}px`);
			this.renderer.setStyle(host, 'width', `${width}px`);
			this.renderer.setStyle(host, 'height', `${height}px`);
		});

		// Add drag start handler
		this.drag.started.subscribe(() => {
			if (this.model.maximized()) {
				// Remove maximized state
				if (this.model.maximized()) this.model.maximized.set(false);
				// Restore previous size/position
				const prev = this.model.rect().previous;
				if (prev) {
					const rect = {
						current: {
							top: prev.top,
							left: prev.left,
							width: prev.width,
							height: prev.height
						},
						previous: undefined
					};

					if (JSON.stringify(rect) !== JSON.stringify(this.model.rect())) {
						this.model.rect.set(rect);
					}
				}
			}
		});

		// Add drag end handler
		this.drag.ended.subscribe(() => {
			const el = this.elementRef.nativeElement;
			const parentRect = el.offsetParent
				? (el.offsetParent as HTMLElement).getBoundingClientRect()
				: { left: 0, top: 0 };
			const clientRect = el.getBoundingClientRect();

			const left = clientRect.left - parentRect.left;
			const top = clientRect.top - parentRect.top;

			const rect = {
				current: {
					top,
					left,
					width: clientRect.width,
					height: clientRect.height
				},
				previous: this.model.rect().previous
			};

			if (JSON.stringify(rect) !== JSON.stringify(this.model.rect())) {
				this.model.rect.set(rect);
			}

			// Reset CDK drag position
			this.drag.reset();
		});
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['model'] && this.model.component() !== this) this.model.component.set(this);
	}

	ngAfterViewInit(): void {
		const hostElement = this.elementRef.nativeElement;
		if (this.dragBoundary) this.drag.boundaryElement = this.dragBoundary;
		const rect = this.model.rect();
		this.renderer.setStyle(hostElement, 'top', `${rect.current.top}px`);
		this.renderer.setStyle(hostElement, 'left', `${rect.current.left}px`);
		this.drag.disabled = this.model.maximized() || this.model.minimized();
	}

	// Resize handling
	onResizeStart(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.resizeStartX = event.clientX;
		this.resizeStartY = event.clientY;
		const resizing = !this.model.minimized() && !this.model.maximized();
		if (this.model.resizing() !== resizing) this.model.resizing.set(resizing);
	}

	private onResizeMove = (event: MouseEvent) => {
		if (!this.model.resizing()) return;

		event.preventDefault();

		const hostElement = this.elementRef.nativeElement;
		let newWidth = this.resizeStartWidth + (event.clientX - this.resizeStartX);
		let newHeight = this.resizeStartHeight + (event.clientY - this.resizeStartY);

		// Set minimum size
		let width = Math.max(200, newWidth);
		let height = Math.max(150, newHeight);

		if (this.dragBoundary) {
			const boundaryRect = this.dragBoundary.getBoundingClientRect();
			const windowRect = hostElement.getBoundingClientRect();
			const left = windowRect.left;
			const top = windowRect.top;
			const taskbarHeight = 48;

			// Clamp right edge
			const maxWidth = boundaryRect.right - left;
			if (width > maxWidth) {
				width = maxWidth;
				this.resizeStartX = event.clientX;
				this.resizeStartWidth = width;
			}

			// Clamp bottom edge (above taskbar)
			const maxHeight = boundaryRect.bottom - top - taskbarHeight;
			if (height > maxHeight) {
				height = maxHeight;
				this.resizeStartY = event.clientY;
				this.resizeStartHeight = height;
			}
		}

		// Update rect signal instead of setting styles directly
		const rect = {
			current: {
				...this.model.rect().current,
				width,
				height
			},
			previous: this.model.rect().current
		};

		if (JSON.stringify(rect) !== JSON.stringify(this.model.rect())) {
			this.model.rect.set(rect);
		}
	};

	private onResizeEnd = () => {
		if (this.model.resizing()) this.model.resizing.set(false);

		// Remove resizing attribute
		const hostElement = this.elementRef.nativeElement;
		this.renderer.removeAttribute(hostElement, 'resizing');

		document.removeEventListener('mousemove', this.onResizeMove);
		document.removeEventListener('mouseup', this.onResizeEnd);

		// Update stored position and size values
		const clientRect = hostElement.getBoundingClientRect();

		const rect = {
			current: {
				...this.model.rect().current,
				width: clientRect.width,
				height: clientRect.height
			},
			previous: this.model.rect().current
		};

		if (JSON.stringify(rect) !== JSON.stringify(this.model.rect())) {
			this.model.rect.set(rect);
		}
	};

	onClick(event: MouseEvent): void {
		event.preventDefault();
		event.stopPropagation();
		if (!this.model.active()) this.model.active.set(true);
	}

	onMouseDown(event: MouseEvent): void {
		event.preventDefault();
		event.stopPropagation();
		if (!this.model.active()) this.model.active.set(true);
	}

	onContextMenu(event: MouseEvent): void {
		event.preventDefault();
		event.stopPropagation();
		if (!this.model.active()) this.model.active.set(true);
	}

	onCloseClick(event: MouseEvent) {
		event.stopPropagation();
		if (!this.model.closed()) this.model.closed.set(true);
	}

	onMinimizeClick(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		if (!this.model.minimizing() && !this.model.minimized()) { this.model.minimizing.set(true); }
	}

	onMaximizeClick(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		if (!this.model.maximizing() && !this.model.maximized()) this.model.maximizing.set(true);
		if (this.model.maximized() && !this.model.restoringDown()) this.model.restoringDown.set(true);
	}
}