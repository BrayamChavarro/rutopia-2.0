import { auth, googleProvider } from '/src/firebase.js'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth'
import i18n from '/src/i18n.js'

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const googleBtn = document.getElementById('google-signin');

showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden-form');
    registerForm.classList.remove('hidden-form');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden-form');
    loginForm.classList.remove('hidden-form');
});

// Email/Password submit handlers
loginForm?.querySelector('form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = '/home.html';
    } catch (err) {
        alert(err.message || 'No se pudo iniciar sesión');
    }
});

registerForm?.querySelector('form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        window.location.href = '/home.html';
    } catch (err) {
        alert(err.message || 'No se pudo crear la cuenta');
    }
});

googleBtn?.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, googleProvider);
        window.location.href = '/home.html';
    } catch (err) {
        if (err && (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request')) {
            try { await signInWithRedirect(auth, googleProvider); } catch (e2) { alert(e2.message || 'Error Google'); }
        } else {
            alert(err.message || 'Error Google');
        }
    }
});

// If already logged in, skip to home
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = '/home.html';
    }
});

getRedirectResult(auth).catch(()=>{})

// Simple i18n apply on static HTML login/register
function applyTranslations() {
    const set = (id, key) => {
        const el = document.getElementById(id);
        if (el) el.textContent = i18n.t(key);
    };
    set('t-login-title', 'login.title');
    set('t-login-subtitle', 'login.subtitle');
    set('t-login-email', 'login.emailLabel');
    set('t-login-password', 'login.passwordLabel');
    set('t-login-forgot', 'login.forgot');
    set('t-login-signin', 'login.signIn');
    set('t-login-or', 'login.or');
    set('t-login-google', 'login.continueWithGoogle');
    set('t-login-noaccount', 'login.noAccount');
    set('t-login-register', 'login.registerLink');
    set('t-reg-title', 'register.title');
    set('t-reg-subtitle', 'register.subtitle');
    set('t-reg-name', 'register.nameLabel');
    set('t-reg-email', 'login.emailLabel');
    set('t-reg-password', 'login.passwordLabel');
    set('t-reg-create', 'register.createAccount');
    set('t-reg-have', 'register.haveAccount');
    set('t-reg-login', 'register.loginLink');
}

// Cambiar idioma dinámicamente (opcional: agrega botones en el HTML para cambiar idioma)
window.setLanguage = function(lang) {
    i18n.changeLanguage(lang).then(applyTranslations);
    localStorage.setItem('lang', lang);
};

// Aplica traducciones al cargar
applyTranslations();

// Si quieres que cambie automáticamente al cambiar idioma en otro lado:
i18n.on('languageChanged', applyTranslations);
