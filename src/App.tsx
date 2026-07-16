import { Check, Code2, Download, Gem, RotateCcw, Share2 } from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  cuts,
  decodeConfig,
  defaultConfig,
  encodeConfig,
  metals,
  ringPrice,
  stones,
  type RingConfig,
} from './config'

const RingScene = lazy(() =>
  import('./RingScene').then((module) => ({ default: module.RingScene })),
)

type OptionProps = {
  active: boolean
  label: string
  swatch?: string
  onClick: () => void
}

function Option({ active, label, swatch, onClick }: OptionProps) {
  return (
    <button
      type="button"
      className={`option ${active ? 'active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {swatch && <span className="swatch" style={{ background: swatch }} />}
      <strong>{label}</strong>
      {active && <Check size={15} strokeWidth={1.8} />}
    </button>
  )
}

function initialConfig() {
  const shared = decodeConfig(new URLSearchParams(window.location.search).get('ring'))
  if (shared) return shared

  try {
    const saved = localStorage.getItem('atelier-ring')
    return saved ? ({ ...defaultConfig, ...JSON.parse(saved) } as RingConfig) : defaultConfig
  } catch {
    return defaultConfig
  }
}

export default function App() {
  const [config, setConfig] = useState<RingConfig>(initialConfig)
  const [notice, setNotice] = useState('')
  const price = useMemo(() => ringPrice(config), [config])
  const update = <K extends keyof RingConfig>(key: K, value: RingConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    localStorage.setItem('atelier-ring', JSON.stringify(config))
  }, [config])

  const flash = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 2200)
  }

  const share = async () => {
    const url = new URL(window.location.href)
    url.searchParams.set('ring', encodeConfig(config))
    window.history.replaceState({}, '', url)
    await navigator.clipboard.writeText(url.toString())
    flash('Lien copié')
  }

  const download = () => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'ma-bague-atelier-aurelia.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    flash('Image enregistrée')
  }

  return (
    <main>
      <header>
        <a className="brand" href="/" aria-label="Atelier Aurelia, accueil">
          <span className="brand-mark">A</span>
          <span>ATELIER AURELIA</span>
        </a>
        <div className="header-meta">
          <span>PIÈCE N° 0427</span>
          <a
            href="https://github.com/alkhastvatsaev/atelier-aurelia-ring"
            target="_blank"
            rel="noreferrer"
            aria-label="Code source sur GitHub"
          >
            <Code2 size={18} />
          </a>
        </div>
      </header>

      <section className="workspace">
        <div className="viewer">
          <div className="eyebrow"><span /> VOTRE CRÉATION, EN TEMPS RÉEL</div>
          <div className="scene">
            <Suspense fallback={<div className="scene-loader">FAÇONNAGE EN COURS…</div>}>
              <RingScene config={config} />
            </Suspense>
          </div>
          <div className="viewer-tools">
            <span className="drag-hint">GLISSEZ POUR FAIRE TOURNER · PINCEZ POUR ZOOMER</span>
            <div>
              <button type="button" className="icon-button" onClick={download} aria-label="Télécharger une image">
                <Download size={18} />
              </button>
              <button type="button" className="icon-button" onClick={share} aria-label="Partager la configuration">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>

        <aside className="configurator">
          <div className="title-block">
            <p>COLLECTION SIGNATURE</p>
            <h1>Composez<br />votre éternité.</h1>
            <span>Chaque détail est une promesse. Façonnez une pièce qui ne ressemble qu’à vous.</span>
          </div>

          <section className="control-group">
            <div className="section-title"><span>01</span><h2>Le métal</h2></div>
            <div className="option-grid">
              {Object.entries(metals).map(([id, metal]) => (
                <Option
                  key={id}
                  active={config.metal === id}
                  label={metal.label}
                  swatch={metal.color}
                  onClick={() => update('metal', id as RingConfig['metal'])}
                />
              ))}
            </div>
          </section>

          <section className="control-group">
            <div className="section-title"><span>02</span><h2>La pierre</h2></div>
            <div className="option-grid">
              {Object.entries(stones).map(([id, stone]) => (
                <Option
                  key={id}
                  active={config.stone === id}
                  label={stone.label}
                  swatch={stone.color}
                  onClick={() => update('stone', id as RingConfig['stone'])}
                />
              ))}
            </div>
            <label className="field-label">Taille de la pierre <b>{config.carats.toFixed(1)} ct</b></label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={config.carats}
              onChange={(event) => update('carats', Number(event.target.value))}
              aria-label="Poids de la pierre en carats"
            />
            <div className="cuts">
              {Object.entries(cuts).map(([id, cut]) => (
                <button
                  type="button"
                  key={id}
                  className={config.cut === id ? 'active' : ''}
                  onClick={() => update('cut', id as RingConfig['cut'])}
                >
                  <Gem size={16} /><span>{cut.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="control-group">
            <div className="section-title"><span>03</span><h2>Votre secret</h2></div>
            <label className="engraving">
              <input
                value={config.engraving}
                onChange={(event) => update('engraving', event.target.value.slice(0, 24))}
                placeholder="Votre gravure"
                aria-label="Texte de la gravure"
              />
              <span>{config.engraving.length}/24</span>
            </label>
            <div className="size-row">
              <label htmlFor="size">Taille de l’anneau</label>
              <select id="size" value={config.size} onChange={(event) => update('size', Number(event.target.value))}>
                {[48, 50, 52, 54, 56, 58, 60, 62].map((size) => <option key={size}>{size}</option>)}
              </select>
            </div>
          </section>

          <div className="summary">
            <div><span>Estimation</span><strong>{price.toLocaleString('fr-FR')} €</strong></div>
            <p>Fabriquée à la main sous 4 à 6 semaines · Livraison assurée offerte</p>
            <button type="button" className="primary" onClick={() => flash('Votre création est réservée')}>
              RÉSERVER CETTE CRÉATION <span>↗</span>
            </button>
            <button type="button" className="reset" onClick={() => setConfig(defaultConfig)}>
              <RotateCcw size={13} /> Recommencer
            </button>
          </div>
        </aside>
      </section>

      <div className={`toast ${notice ? 'visible' : ''}`} role="status">{notice}</div>
    </main>
  )
}
