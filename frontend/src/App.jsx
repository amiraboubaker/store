import { useEffect, useRef, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import About from './pages/About'
import Services from './pages/Services'
import Contact from './pages/Contact'

function App() {
  const location = useLocation()
  const audioRef = useRef(null)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    audio.volume = 0.3
    const play = () => audio.play().catch(() => {})
    document.addEventListener('click', play, { once: true })
    return () => document.removeEventListener('click', play, play)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  const toggle = () => {
    audioRef.current.muted = !muted
    setMuted(m => !m)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <audio ref={audioRef} src="/assets/music/music.mp3" loop />
      <button
        onClick={toggle}
        title={muted ? 'Unmute music' : 'Mute music'}
        className="fixed bottom-4 right-4 z-50 bg-white/80 backdrop-blur rounded-full shadow-lg p-2 text-xl hover:scale-110 transition-transform"
      >
        {muted ? '🔇' : '🎵'}
      </button>
      <Header />
      <main className="flex-1">
        <div key={location.pathname} className="animate-fade-in">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/services" element={<Services />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App
