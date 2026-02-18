class ThemeSwitcher {
    constructor() {
        this.theme = localStorage.getItem('portfolio-theme') || 'dark';
        this.init();
    }

    init() {
        this.applyTheme();
        this.setupToggle();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('portfolio-theme', this.theme);
    }

    setupToggle() {
        const toggleBtn = document.getElementById('theme-toggle');
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', () => {
            this.theme = this.theme === 'dark' ? 'light' : 'dark';
            this.applyTheme();
            this.updateButtonIcon(toggleBtn);
            
            // Track theme change
            if (window.portfolioAnalytics) {
                window.portfolioAnalytics.trackEvent('theme_change', {
                    theme: this.theme
                });
            }
        });

        this.updateButtonIcon(toggleBtn);
    }

    updateButtonIcon(button) {
        button.textContent = this.theme === 'dark' ? '🌙' : '☀️';
        button.title = `Switch to ${this.theme === 'dark' ? 'light' : 'dark'} theme`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.themeSwitcher = new ThemeSwitcher();
});