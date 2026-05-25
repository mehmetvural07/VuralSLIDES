const I18n = {
  locale: 'tr',
  fallback: 'en',
  strings: {},
  loaded: false,

  async init(locale) {
    this.locale = locale || 'tr';
    await this.load(this.locale);
    this.apply();
  },

  async load(locale) {
    try {
      const resp = await fetch(`js/locales/${locale}.json`);
      this.strings = await resp.json();
      this.loaded = true;
    } catch {
      if (locale !== this.fallback) {
        await this.load(this.fallback);
      } else {
        this.strings = {};
        this.loaded = true;
      }
    }
  },

  t(key, ...args) {
    let s = this.strings[key];
    if (s === undefined) s = key;
    if (args.length > 0) {
      args.forEach((arg, i) => { s = s.replace(`{${i}}`, arg); });
    }
    return s;
  },

  apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      el.textContent = this.t(key);
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      const parts = el.dataset.i18nAttr.split(',');
      parts.forEach(p => {
        const [attr, key] = p.trim().split(':');
        if (attr && key) el.setAttribute(attr, this.t(key));
      });
    });
    if (window.lucide) lucide.createIcons();
  },

  async setLocale(locale) {
    this.locale = locale;
    await this.load(locale);
    document.documentElement.lang = locale;
    this.apply();
  }
};

window.I18n = I18n;
