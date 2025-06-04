import { Injectable, signal, effect, computed } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
	providedIn: 'root'
})
export class ThemeService {
	// Theme state using signals for reactivity
	private _currentTheme = signal<Theme>('light');
	private _systemTheme = signal<Theme>('light');
	private _useSystemTheme = signal(true);

	// Exposed computed signal for the active theme
	public readonly activeTheme = computed(() =>
		this._useSystemTheme() ? this._systemTheme() : this._currentTheme()
	);

	constructor() {
		// Initialize theme based on system preference
		this.detectSystemTheme();

		// Set up a media query listener to detect theme changes
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQuery.addEventListener('change', (e) => {
			this._systemTheme.set(e.matches ? 'dark' : 'light');
		});

		// Set up an effect to apply the theme when it changes
		effect(() => {
			this.applyTheme(this.activeTheme());
		});
	}

	// Detect the system theme
	private detectSystemTheme(): void {
		this._systemTheme.set(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
	}

	// Manually set the theme
	setTheme(theme: Theme): void {
		this._currentTheme.set(theme);
	}

	// Toggle between using system theme and manual theme
	toggleUseSystemTheme(useSystem: boolean): void {
		this._useSystemTheme.set(useSystem);
	}

	// Apply the theme to the document
	private applyTheme(theme: Theme): void {
		document.documentElement.setAttribute('data-theme', theme);

		// Add or remove dark mode class to body
		if (theme === 'dark') {
			document.body.classList.add('dark-theme');
		} else {
			document.body.classList.remove('dark-theme');
		}
	}
} 