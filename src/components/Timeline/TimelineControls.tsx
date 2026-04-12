import { useTranslation } from 'react-i18next'

interface TimelineControlsProps {
  playing: boolean
  onPlay: () => void
  onPause: () => void
  onStep: () => void
  onReset: () => void
  speed: number
  onSpeedChange: (speed: number) => void
  tick?: number
}

export default function TimelineControls({
  playing,
  onPlay,
  onPause,
  onStep,
  onReset,
  speed,
  onSpeedChange,
  tick,
}: TimelineControlsProps) {
  const { t } = useTranslation()

  return (
    <div className="controls-row">
      <div className="control-group">
        {playing ? (
          <button className="btn btn-icon" onClick={onPause} title={t('controls.pause')}>
            &#9646;&#9646;
          </button>
        ) : (
          <button className="btn btn-icon" onClick={onPlay} title={t('controls.play')}>
            &#9654;
          </button>
        )}
        <button className="btn btn-icon" onClick={onStep} title={t('controls.step')}>
          &#9197;
        </button>
        <button className="btn" onClick={onReset}>
          {t('controls.reset')}
        </button>
      </div>

      <div className="control-group">
        <label>{t('controls.speed')}:</label>
        <input
          type="range"
          min={0.25}
          max={4}
          step={0.25}
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
        />
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 36 }}>
          {speed}x
        </span>
      </div>

      {tick !== undefined && (
        <div className="control-group">
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Tick: {tick}
          </span>
        </div>
      )}
    </div>
  )
}
