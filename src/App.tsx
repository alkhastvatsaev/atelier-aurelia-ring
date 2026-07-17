import {
  ArrowUpRight,
  Check,
  Code2,
  Download,
  Info,
  RotateCcw,
  Share2,
  X,
} from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  cuts,
  decodeConfig,
  defaultConfig,
  encodeConfig,
  migrateConfig,
  metals,
  ringPrice,
  ringStyles,
  stones,
  type RingConfig,
} from './config'
import { buildRingDesign } from './geometry/buildDesign'

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
    return saved ? migrateConfig(JSON.parse(saved)) : defaultConfig
  } catch {
    return defaultConfig
  }
}

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export default function App() {
  const [config, setConfig] = useState<RingConfig>(initialConfig)
  const [webglAvailable] = useState(canUseWebGL)
  const [notice, setNotice] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const price = useMemo(() => ringPrice(config), [config])
  const design = useMemo(() => buildRingDesign(config), [config])
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
          <div className="scene">
            {webglAvailable ? (
              <Suspense fallback={<div className="scene-loader">AURELIA</div>}>
                <RingScene config={config} />
              </Suspense>
            ) : (
              <div
                className={`static-ring ${config.style}`}
                role="img"
                aria-label={`Aperçu simplifié — ${ringStyles[config.style].label}`}
              >
                <span style={{ borderColor: metals[config.metal].color }}>
                  <i
                    style={{
                      background: stones[config.stone].color,
                      borderColor: metals[config.metal].color,
                    }}
                  />
                  <b style={{ background: stones[config.stone].color, borderColor: metals[config.metal].color }} />
                  <em style={{ background: stones[config.stone].color, borderColor: metals[config.metal].color }} />
                </span>
              </div>
            )}
          </div>
          <div className="viewer-tools">
            <span className="drag-hint">VUE 3D</span>
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
          <h1 className="sr-only">Créez votre bague</h1>

          <section className="control-group style-group">
            <div className="section-title">
              <h2>Architecture</h2>
              <button
                type="button"
                className={`compliance ${design.report.status}`}
                onClick={() => setReportOpen(true)}
              >
                <span />
                {design.report.status === 'conform'
                  ? 'Conforme'
                  : design.report.status === 'review'
                    ? 'À vérifier'
                    : 'Impossible'}
                <Info size={12} />
              </button>
            </div>
            <div className="style-grid">
              {Object.entries(ringStyles).map(([id, style]) => (
                <button
                  type="button"
                  key={id}
                  className={config.style === id ? 'active' : ''}
                  onClick={() => update('style', id as RingConfig['style'])}
                  aria-pressed={config.style === id}
                >
                  <span className={`style-silhouette ${id}`} aria-hidden="true">
                    <i />
                  </span>
                  <span>{style.shortLabel}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="control-group">
            <div className="section-title"><h2>Métal</h2></div>
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
            <div className="section-title"><h2>Pierre</h2></div>
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
            <label className="field-label">Carats <b>{config.carats.toFixed(1)} ct</b></label>
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
                  <span className={`cut-shape ${id}`} aria-hidden="true" />
                  <span>{cut.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="control-group">
            <div className="section-title"><h2>Gravure</h2></div>
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
              <label htmlFor="size">Taille</label>
              <select id="size" value={config.size} onChange={(event) => update('size', Number(event.target.value))}>
                {[48, 50, 52, 54, 56, 58, 60, 62].map((size) => <option key={size}>{size}</option>)}
              </select>
            </div>
          </section>

          <div className="summary">
            <div><span>Total</span><strong>{price.toLocaleString('fr-FR')} €</strong></div>
            <button
              type="button"
              className="primary"
              disabled={design.report.status === 'impossible'}
              onClick={() => flash('Votre création est réservée')}
            >
              CONTINUER <ArrowUpRight size={16} />
            </button>
            <button
              type="button"
              className="reset"
              onClick={() => setConfig(defaultConfig)}
              aria-label="Réinitialiser la bague"
              title="Réinitialiser"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </aside>
      </section>

      <div
        className={`report-backdrop ${reportOpen ? 'visible' : ''}`}
        onClick={() => setReportOpen(false)}
        aria-hidden={!reportOpen}
      />
      <aside className={`technical-report ${reportOpen ? 'open' : ''}`} aria-hidden={!reportOpen}>
        <div className="report-header">
          <div>
            <span>PRÉ-CAO · MM</span>
            <h2>Contrôle de fabrication</h2>
          </div>
          <button type="button" onClick={() => setReportOpen(false)} aria-label="Fermer le rapport">
            <X size={18} />
          </button>
        </div>
        <div className="report-metrics">
          <div><span>Taille intérieure</span><b>{(design.layout.shank.innerRadiusMm * 2).toFixed(2)} mm</b></div>
          <div><span>Corps fini</span><b>{design.layout.shank.radialThicknessMm.toFixed(2)} mm</b></div>
          <div><span>Retrait fonte</span><b>{(design.layout.process.linearShrinkage * 100).toFixed(1)} %</b></div>
          <div><span>Surcote finition</span><b>{design.layout.process.finishingAllowanceMm.toFixed(2)} mm</b></div>
          <div><span>Facettage</span><b>{cuts[config.cut].facets} facettes</b></div>
          <div><span>Assises métal</span><b>{design.layout.seats.length} booléennes</b></div>
        </div>
        <div className="report-results">
          {design.report.results.length === 0 ? (
            <p className="report-empty">Aucune non-conformité calculée.</p>
          ) : (
            design.report.results.map((result, index) => (
              <a
                key={`${result.code}-${index}`}
                className={`report-item ${result.severity}`}
                href={result.source}
                target="_blank"
                rel="noreferrer"
              >
                <span>{result.code}</span>
                <strong>{result.title}</strong>
                <p>{result.message}</p>
                {result.measured !== undefined && (
                  <small>
                    Mesuré {result.measured.toFixed(2)} {result.unit === 'degrees' ? '°' : result.unit === 'mm' ? 'mm' : ''}
                  </small>
                )}
              </a>
            ))
          )}
        </div>
        <p className="report-disclaimer">
          Contrôle géométrique indicatif. Validation finale obligatoire par le joaillier, le sertisseur et le fondeur.
        </p>
      </aside>

      <div className={`toast ${notice ? 'visible' : ''}`} role="status">{notice}</div>
    </main>
  )
}
