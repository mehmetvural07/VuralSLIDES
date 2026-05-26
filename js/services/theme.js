const ThemeManager = {
  current: 'dark',
  systemDark: false,

  init(theme) {
    this.systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      this.systemDark = e.matches;
      if (this.current === 'system') this.apply();
    });
    this.current = theme || 'dark';
    this.apply();
  },

  apply() {
    const theme = this.current === 'system'
      ? (this.systemDark ? 'dark' : 'light')
      : this.current;
    this._setCSS(theme);
    document.documentElement.setAttribute('data-theme', this.current);
  },

  _setCSS(theme) {
    if (theme === 'light') {
      document.documentElement.style.setProperty('--bg', '#f5f5f5');
      document.documentElement.style.setProperty('--surface', '#ffffff');
      document.documentElement.style.setProperty('--surface2', '#f0f0f0');
      document.documentElement.style.setProperty('--surface3', '#e0e0e0');
      document.documentElement.style.setProperty('--border', '#d0d0d0');
      document.documentElement.style.setProperty('--text', '#222222');
      document.documentElement.style.setProperty('--text2', '#888888');
      document.documentElement.style.setProperty('--bg-app', '#f0f0f0');
      document.documentElement.style.setProperty('--bg-surface', '#ffffff');
      document.documentElement.style.setProperty('--bg-elevated', '#fafafa');
      document.documentElement.style.setProperty('--bg-input', '#f5f5f5');
      document.documentElement.style.setProperty('--border-subtle', '#e0e0e0');
      document.documentElement.style.setProperty('--border-default', '#d0d0d0');
      document.documentElement.style.setProperty('--text-primary', '#222222');
      document.documentElement.style.setProperty('--text-muted', '#888888');
      document.documentElement.style.setProperty('--text-hint', '#aaaaaa');
      document.documentElement.style.setProperty('--bg-primary', '#f0f0f0');
      document.documentElement.style.setProperty('--bg-secondary', '#ffffff');
      document.documentElement.style.setProperty('--bg-tertiary', '#fafafa');
      document.documentElement.style.setProperty('--text-dim', '#aaaaaa');
    } else {
      document.documentElement.style.setProperty('--bg', '#0a0a0a');
      document.documentElement.style.setProperty('--surface', '#141414');
      document.documentElement.style.setProperty('--surface2', '#1e1e1e');
      document.documentElement.style.setProperty('--surface3', '#2a2a2a');
      document.documentElement.style.setProperty('--border', '#2e2e2e');
      document.documentElement.style.setProperty('--text', '#e8e8e8');
      document.documentElement.style.setProperty('--text2', '#888888');
      document.documentElement.style.setProperty('--bg-app', '#111');
      document.documentElement.style.setProperty('--bg-surface', '#161616');
      document.documentElement.style.setProperty('--bg-elevated', '#1a1a1a');
      document.documentElement.style.setProperty('--bg-input', '#1a1a1a');
      document.documentElement.style.setProperty('--border-subtle', '#222');
      document.documentElement.style.setProperty('--border-default', '#2a2a2a');
      document.documentElement.style.setProperty('--text-primary', '#e8e8e8');
      document.documentElement.style.setProperty('--text-muted', '#888');
      document.documentElement.style.setProperty('--text-hint', '#555');
      document.documentElement.style.setProperty('--bg-primary', '#0d0d0d');
      document.documentElement.style.setProperty('--bg-secondary', '#161616');
      document.documentElement.style.setProperty('--bg-tertiary', '#1a1a1a');
      document.documentElement.style.setProperty('--text-dim', '#555');
    }
  },

  setTheme(theme) {
    this.current = theme;
    this.apply();
  },

  getTheme() {
    return this.current;
  }
};

window.ThemeManager = ThemeManager;
