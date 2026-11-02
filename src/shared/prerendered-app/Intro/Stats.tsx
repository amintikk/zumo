import { h, Component } from 'preact';
import * as style from './style.css';
import { S, lang } from 'shared/strings';
import { fetchStats, PublicStats } from 'shared/stats';

const locales = { es: 'es-ES', en: 'en-GB' };
const units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB'];

function number(value: number, digits = 0): string {
  return new Intl.NumberFormat(locales[lang], {
    maximumFractionDigits: digits,
  }).format(value);
}

/** 1 234 567 890 bytes -> ["1,2", "GB"] */
function bytes(value: number): [string, string] {
  let i = 0;
  while (value >= 1000 && i < units.length - 1) {
    value /= 1000;
    i++;
  }
  return [number(value, value < 10 && i > 0 ? 1 : 0), units[i]];
}

const reducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches;

interface State {
  stats?: PublicStats;
  /** 0 → 1 while the numbers count up */
  progress: number;
}

/** "zumo en cifras": anonymous global counters, shown once they load */
export default class Stats extends Component<{}, State> {
  state: State = { progress: 0 };
  private frame = 0;

  async componentDidMount() {
    const stats = await fetchStats();
    if (!stats || !stats.images) return;
    this.setState({ stats });
    if (reducedMotion()) return this.setState({ progress: 1 });

    const start = performance.now();
    const duration = 1400;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out-expo: fast start, soft landing
      this.setState({ progress: t === 1 ? 1 : 1 - Math.pow(2, -10 * t) });
      if (t < 1) this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.frame);
  }

  render(_: {}, { stats, progress }: State) {
    if (!stats) return null;
    const p = progress;
    const [saved, savedUnit] = bytes(stats.bytesSaved * p);

    const items: [string, string, string][] = [
      [number(Math.round(stats.images * p)), '', S.stats.images],
      [saved, savedUnit, S.stats.saved],
      [
        number(Math.round(stats.averageReduction * p)),
        '%',
        S.stats.reduction,
      ],
      [stats.favouriteFormat || '—', '', S.stats.favourite],
    ];

    return (
      <section class={`${style.stats} glass`} aria-label="zumo">
        <dl class={style.statsGrid}>
          {items.map(([value, unit, label]) => (
            <div class={style.stat}>
              <dt>{label}</dt>
              <dd>
                {value}
                {unit && <span class={style.statUnit}>{unit}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    );
  }
}
