import React, { useEffect, useState } from 'react'
import { auth, googleProvider, db } from './firebase'
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { useTranslation } from 'react-i18next'

export default function App() {
  const { t, i18n } = useTranslation()
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [needsProfile, setNeedsProfile] = useState(false)
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [tastes, setTastes] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (!u) {
        setNeedsProfile(false)
        return
      }
      try {
        const ref = doc(db, 'profiles', u.uid)
        const snap = await getDoc(ref)
        if (snap.exists()) {
          window.location.href = '/home.html'
        } else {
          setNeedsProfile(true)
        }
      } catch (err) {
        setNeedsProfile(true)
      }
    })
    // Captura el resultado de signInWithRedirect (si se usó como fallback)
    getRedirectResult(auth).catch((err) => {
      if (err) setError(err.message || 'Error de autenticación (redirect)')
    })
    return () => unsub()
  }, [])

  async function handleGoogle() {
    setError('')
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      if (err && (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request')) {
        try {
          await signInWithRedirect(auth, googleProvider)
        } catch (err2) {
          setError(err2.message || 'No se pudo iniciar sesión con Google (redirect)')
        }
      } else {
        setError(err.message || 'No se pudo iniciar sesión con Google')
      }
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    if (!user) return
    try {
      const interests = tastes
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
      const payload = {
        originCountry: country,
        originCity: city,
        interests,
        tags: interests,
        createdAt: new Date().toISOString(),
      }
      await setDoc(doc(db, 'profiles', user.uid), payload, { merge: true })
      window.location.href = '/home.html'
    } catch (err) {
      setError(err.message || 'No se pudo guardar el perfil')
    }
  }

  if (user && needsProfile) {
    return (
      <div className="page">
        <div className="layout">
          <div className="left">
            <h1 className="headline">Completa tu <span className="highlight">perfil</span></h1>
            <p className="lead">Cuéntanos tu país y ciudad de origen y algunos de tus gustos para personalizar tu experiencia.</p>
          </div>
          <div className="right">
            <div className="card form-container">
              <div className="text-center" style={{marginBottom:'24px'}}>
                <h2 className="headline" style={{fontSize:'2rem', marginBottom:'4px'}}>Información básica</h2>
                <p className="muted">Sesión: {user.email}</p>
              </div>
              {error && <p className="muted" style={{color:'#fca5a5', marginBottom:'16px'}}>{error}</p>}
              <form onSubmit={handleSaveProfile}>
                <div className="field">
                  <label htmlFor="country">País</label>
                  <input id="country" className="input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Ej: México" required />
                </div>
                <div className="field">
                  <label htmlFor="city">Ciudad de origen</label>
                  <input id="city" className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ej: Ciudad de México" required />
                </div>
                <div className="field">
                  <label htmlFor="tastes">Gustos (separados por comas)</label>
                  <input id="tastes" className="input" value={tastes} onChange={(e) => setTastes(e.target.value)} placeholder="Ej: montaña, cultura, gastronomía" />
                </div>
                <button type="submit" className="btn btn-primary">Guardar y continuar</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="layout">
        <div className="left">
          <h1 className="headline">Tu próxima <span className="highlight">aventura</span> te espera.</h1>
          <p className="lead">Rutopia</p>
          <div className="avatars">
            <img src="https://placehold.co/100x100/1f2937/a78bfa?text=R" alt="Imagen 1" className="avatar" />
            <img src="https://placehold.co/100x100/1f2937/a78bfa?text=U" alt="Imagen 2" className="avatar" />
            <img src="https://placehold.co/100x100/1f2937/a78bfa?text=T" alt="Imagen 3" className="avatar" />
          </div>
        </div>

        <div className="right">
          <div className="card form-container">
            <div className="text-center" style={{marginBottom:'24px'}}>
              <h2 className="headline" style={{fontSize:'2rem', marginBottom:'4px'}}>{showRegister ? 'Crea tu cuenta' : 'Bienvenido a Rutopia'}</h2>
              <p className="muted">{showRegister ? 'Regístrate con tu correo' : 'Inicia sesión o continúa con Google'}</p>
            </div>
            {error && <p className="muted" style={{color:'#fca5a5', marginBottom:'16px'}}>{error}</p>}

            {!showRegister && (
              <form onSubmit={async (e)=>{ e.preventDefault(); setError(''); try{ await signInWithEmailAndPassword(auth, email, password) } catch(err){ setError(err.message || 'Error'); } }}>
                <div className="field">
                  <label htmlFor="login-email">Correo electrónico</label>
                  <input id="login-email" className="input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div className="field">
                  <label htmlFor="login-password">Contraseña</label>
                  <input id="login-password" className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="********" required />
                </div>
                <button type="submit" className="btn btn-primary">Iniciar sesión</button>
              </form>
            )}

            {showRegister && (
              <form onSubmit={async (e)=>{ e.preventDefault(); setError(''); try{ await createUserWithEmailAndPassword(auth, email, password) } catch(err){ setError(err.message || 'Error'); } }}>
                <div className="field">
                  <label htmlFor="reg-email">Correo electrónico</label>
                  <input id="reg-email" className="input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div className="field">
                  <label htmlFor="reg-password">Contraseña</label>
                  <input id="reg-password" className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="********" required />
                </div>
                <button type="submit" className="btn btn-primary">Crear Cuenta</button>
              </form>
            )}

            <div className="divider"><span>O</span></div>

            <button type="button" onClick={handleGoogle} className="btn btn-ghost">
              <svg style={{width:20, height:20, marginRight:8}} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/><path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" fillOpacity="0.1" fill="#FFFFFF"/><path d="M24 46c5.9 0 11.2-2 15.1-5.4l-6.4-6.4C30.1 37 27.1 38 24 38c-4.4 0-8.2-2.7-9.8-6.5l-6.7 5.2C10.2 42.6 16.6 46 24 46z" fill="#4CAF50"/><path d="M24 46c5.9 0 11.2-2 15.1-5.4l-6.4-6.4C30.1 37 27.1 38 24 38c-4.4 0-8.2-2.7-9.8-6.5l-6.7 5.2C10.2 42.6 16.6 46 24 46z" fillOpacity="0.1" fill="#FFFFFF"/><path d="M43.6 29.2c2.2-2.8 3.4-6.4 3.4-10.2C47 13.5 42.3 8.2 36.5 5.1l-6.4 6.4C32.1 10.1 34 8 34 8s-4.6 4.3-7.9 8.2c-1.8 2.2-3.2 4.8-4.1 7.6l15.6-1.6z" fill="#1976D2"/></svg>
              Continuar con Google
            </button>
            <p className="text-center" style={{marginTop:'24px'}}>
              <span className="muted">{showRegister ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}</span>{' '}
              <button className="link" onClick={()=>{ setShowRegister(!showRegister); setError('') }}>
                {showRegister ? 'Inicia sesión' : 'Regístrate'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


