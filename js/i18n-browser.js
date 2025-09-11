// i18n para navegador (sin React)
class I18nBrowser {
    constructor() {
        this.currentLanguage = localStorage.getItem('i18nextLng') || 'es';
        this.translations = {};
        this.loadTranslations();
    }
  
    async loadTranslations() {
        try {
            // Cargar traducciones español
            const esResponse = await fetch('./locales/es/translation.json');
            const esTranslations = await esResponse.json();
            
            // Cargar traducciones inglés
            const enResponse = await fetch('./locales/en/translation.json');
            const enTranslations = await enResponse.json();
            
            this.translations = {
                es: esTranslations,
                en: enTranslations
            };
            
            console.log('Traducciones cargadas:', this.translations);
            this.translatePage();
        } catch (error) {
            console.error('Error cargando traducciones:', error);
        }
    }

    t(key, defaultValue = key) {
        const keys = key.split('.');
        let translation = this.translations[this.currentLanguage];
        
        for (const k of keys) {
            if (translation && translation[k]) {
                translation = translation[k];
            } else {
                return defaultValue;
            }
        }
        
        return translation || defaultValue;
    }

    changeLanguage(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('i18nextLng', lang);
        this.translatePage();
    }

    translatePage() {
        // Traducir elementos con atributo data-i18n
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            // Si el elemento es un input placeholder
            if (element.hasAttribute('placeholder')) {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        // Traducir elementos con atributo data-i18n-html (para contenido HTML)
        const htmlElements = document.querySelectorAll('[data-i18n-html]');
        htmlElements.forEach(element => {
            const key = element.getAttribute('data-i18n-html');
            const translation = this.t(key);
            element.innerHTML = translation;
        });

        // Actualizar el selector de idioma
        this.updateLanguageSelector();
    }

    updateLanguageSelector() {
        const languageSelector = document.getElementById('languageSelector');
        if (languageSelector) {
            languageSelector.value = this.currentLanguage;
        }
    }

    createLanguageSelector() {
        return `
            <div class="language-selector">
                <select id="languageSelector" class="px-3 py-1 border border-gray-300 rounded-lg text-sm">
                    <option value="es">🇪🇸 Español</option>
                    <option value="en">🇺🇸 English</option>
                </select>
            </div>
        `;
    }

    initLanguageSelector() {
        const selector = document.getElementById('languageSelector');
        if (selector) {
            selector.addEventListener('change', (e) => {
                this.changeLanguage(e.target.value);
            });
            selector.value = this.currentLanguage;
        }
    }
}

// Instancia global
const i18n = new I18nBrowser();

// Función helper global para traducir
function t(key, defaultValue) {
    return i18n.t(key, defaultValue);
}

// Función para cambiar idioma
function changeLanguage(lang) {
    i18n.changeLanguage(lang);
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { I18nBrowser, i18n, t, changeLanguage };
}
