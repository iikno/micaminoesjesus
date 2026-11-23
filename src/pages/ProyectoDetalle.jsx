import { Link, useParams } from 'react-router-dom';
import { Async } from '../components/Status';
import { useLang, useMeta } from '../i18n';
import { pageTitle } from '../i18n/meta';
import { useData } from '../lib/api';
import { adaptRetreat, useCatalog } from '../lib/catalog';

// Íconos de la ficha técnica, tomados de la referencia de diseño (tmp.html).
const FICHA_ICONS = {
  clock: (
    <path
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  ),
  people: (
    <path
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  ),
  building: (
    <path
      d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  ),
};

function FichaIcon({ name }) {
  const path = FICHA_ICONS[name];
  if (!path) return null;
  return (
    <svg className="detalle-ficha__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {path}
    </svg>
  );
}

function Detalle({ retiro, c }) {
  const { t, to } = useLang();
  useMeta(null, { title: pageTitle(`${retiro.title} · XP Lev`), desc: (retiro.conceptoCentral ?? retiro.subtitle ?? '').slice(0, 160) });
  const { DEREJ, SEASONS } = c;

  const hasBasadoEn = !!retiro.basadoEn;
  const hasConcepto = !!retiro.conceptoCentral;
  const hasImage = !!retiro.image;
  const hasChips = !!(retiro.chips && retiro.chips.length);
  const hasBloques = !!(retiro.bloques && retiro.bloques.length);
  const hasTemas = !!(retiro.temas && retiro.temas.length);
  const temasCount = retiro.temas ? retiro.temas.length : 0;
  const tipoKey = retiro.tipo && t(`det.article.${retiro.tipo}`) !== `det.article.${retiro.tipo}` ? retiro.tipo : 'default';
  const pedagogiaTitulo = t('det.ped.title', { n: t(`det.num.${temasCount}`) === `det.num.${temasCount}` ? temasCount : t(`det.num.${temasCount}`), article: t(`det.article.${tipoKey}`) });
  const hasFichaTecnica = !!(retiro.fichaTecnica && retiro.fichaTecnica.length);
  const isPending = retiro.estado === 'proximamente';
  const derejInfo = retiro.derej ? DEREJ[retiro.derej] : null;
  const hasSecondarySeasons = !!(retiro.seasonSecondary && retiro.seasonSecondary.length);
  const tipoLabel = retiro.tipo ? t(`tipo.${retiro.tipo}`) : null;
  const tagLabel = tipoLabel && tipoLabel !== `tipo.${retiro.tipo}` ? tipoLabel : t('det.project');
  const audience = derejInfo?.audience;

  const routeItems = derejInfo?.esquema === 'secuencial' ? c.byDerej(retiro.derej) : null;
  const showRoute = !!(routeItems && routeItems.length);
  const routeColor = derejInfo?.color || 'var(--color-red)';
  const ctaKey = retiro.tipo && t(`det.cta.${retiro.tipo}`) !== `det.cta.${retiro.tipo}` ? retiro.tipo : 'default';
  const ctaPhrase = t(`det.cta.${ctaKey}`);

  return (
    <>
      <section className="page-head">
        <div className="wrap detalle-header">
          <div className="detalle-tag">{tagLabel} · XP Lev</div>
          {derejInfo && (
            <div className="detalle-sequence">
              {derejInfo.name} · {derejInfo.subtitle}
              {retiro.paso && derejInfo.pasoTotal ? ` — ${t('det.step', { n: retiro.paso, total: derejInfo.pasoTotal })}` : ''}
              {retiro.paso && !derejInfo.pasoTotal ? ` — ${t('det.suggested', { n: retiro.paso })}` : ''}
              {retiro.sequenceTheme ? ` · ${retiro.sequenceTheme}` : ''}
            </div>
          )}
          <h1 className="d">{retiro.title}</h1>
          {isPending && (
            <div style={{ marginTop: 10 }}>
              <span className="badge-estado badge-estado--proximamente">{t('det.pending')}</span>
            </div>
          )}
          <div className="detalle-pills">
            {retiro.season && (
              <span className={`badge-season badge-season--${retiro.season}`}>
                {SEASONS[retiro.season].name}
              </span>
            )}
            {hasSecondarySeasons &&
              retiro.seasonSecondary.map((s) => (
                <span key={s} className={`badge-season badge-season--secondary badge-season--${s}`}>
                  {SEASONS[s].name}
                </span>
              ))}
            {tagLabel !== t('det.project') && (
              <span className="detalle-pill detalle-pill--tipo">{tagLabel}</span>
            )}
            {audience && <span className="detalle-pill">{audience}</span>}
          </div>
          {hasBasadoEn && <p className="detalle-basado">{t('det.basedOn', { text: retiro.basadoEn })}</p>}
          {hasConcepto && <p className="detalle-concepto">{retiro.conceptoCentral}</p>}
        </div>
      </section>

      <section className="detalle-sec">
        <div className="wrap detalle-image-wrap">
          {hasImage ? (
            <img src={retiro.image} alt={retiro.imageAlt || t('det.photo', { title: retiro.title })} className="detalle-image" />
          ) : (
            <div className="detalle-image detalle-image--placeholder">
              {t('det.noimage', { code: retiro.codigo || retiro.id, title: retiro.title })}
            </div>
          )}
        </div>
      </section>

      <section className="detalle-sec">
        <div className="wrap detalle-body">
          {hasChips && (
            <div style={{ marginBottom: 28 }}>
              <div className="detalle-chips-label">{retiro.chipsLabel}</div>
              <div className="detalle-chips">
                {retiro.chips.map((chip) => (
                  <span className="detalle-chip" key={chip}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!hasBloques && !hasTemas && (
            <p className="detalle-preparacion">{t('det.prep')}</p>
          )}

          {hasBloques && (
            <div className="detalle-modules">
              {retiro.bloques.map((bloque) => (
                <div className="detalle-bloque detalle-bloque--card" key={bloque.title}>
                  <h3>{bloque.title}</h3>
                  <p>{bloque.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {showRoute && (
        <section className="detalle-sec">
          <div className="wrap detalle-route">
            <div className="detalle-route__header">
              <div>
                <span className="detalle-route__eyebrow">
                  {t('det.route.eyebrow')}
                </span>
                <h2 className="detalle-route__title">
                  {derejInfo.name}: {derejInfo.subtitle}
                </h2>
              </div>
              <p className="detalle-route__desc">
                {t('det.route.desc', { n: derejInfo.pasoTotal, audience: (audience || '').toLowerCase() })}
              </p>
            </div>
            <div className="detalle-route__grid">
              {routeItems.map((item) => {
                const stepPending = item.estado === 'proximamente';
                const isCurrent = item.id === retiro.id;
                const clickable = !stepPending && !isCurrent;
                const Tag = clickable ? Link : 'div';
                return (
                  <Tag
                    key={item.id}
                    className={`detalle-route__step${isCurrent ? ' is-current' : ''}${stepPending ? ' is-pending' : ''}`}
                    style={isCurrent ? { borderColor: routeColor } : undefined}
                    to={clickable ? to(`/proyectos/${item.id}`) : undefined}
                  >
                    <div className="detalle-route__step-top">
                      <span
                        className="detalle-route__num"
                        style={isCurrent ? { background: routeColor, color: '#fff' } : undefined}
                      >
                        {item.paso}
                      </span>
                      {isCurrent && <span className="detalle-route__current-tag">{t('det.route.current')}</span>}
                    </div>
                    <p className="detalle-route__step-title">{item.title}</p>
                    {item.conceptoCentral && <p className="detalle-route__step-desc">{item.conceptoCentral}</p>}
                  </Tag>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {hasTemas && (
        <section className="detalle-sec">
          <div className="wrap detalle-pedagogia">
            <div className="detalle-pedagogia__header">
              <span className="detalle-pedagogia__eyebrow">{t('det.ped.eyebrow')}</span>
              <h2 className="detalle-pedagogia__title">{pedagogiaTitulo}</h2>
              <p className="detalle-pedagogia__desc">
                {t('det.ped.desc')}
              </p>
            </div>
            <div className="detalle-pedagogia__grid">
              {retiro.temas.map((tema, i) => (
                <div className="detalle-pedagogia__card" key={tema.titulo}>
                  <div className="detalle-pedagogia__card-top">
                    <span className="detalle-pedagogia__badge">T{i + 1}</span>
                    <span className="detalle-pedagogia__label">{t('det.ped.topic', { i: i + 1, n: temasCount })}</span>
                  </div>
                  <h3 className="detalle-pedagogia__card-title">{tema.titulo}</h3>
                  {tema.resumen ? (
                    <>
                      <p>{tema.resumen}</p>
                      {!!(tema.puntos && tema.puntos.length) && (
                        <ul className="detalle-pedagogia__points">
                          {tema.puntos.map((punto) => (
                            <li key={punto}>{punto}</li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <>
                      {tema.evocacion && <p><em>{t('det.ped.evo')}</em> {tema.evocacion}</p>}
                      {tema.actividadIntroductoria && <p><em>{t('det.ped.act')}</em> {tema.actividadIntroductoria}</p>}
                      {tema.contenido && <p>{tema.contenido}</p>}
                      {tema.actividadesAdicionales && <p><em>{t('det.ped.act2')}</em> {tema.actividadesAdicionales}</p>}
                      {!!(tema.simbolos && tema.simbolos.length) && (
                        <p><em>{t('det.ped.sym')}</em> {tema.simbolos.join(' · ')}</p>
                      )}
                      {tema.reflexion && <p className="detalle-reflexion">{tema.reflexion}</p>}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasFichaTecnica && (
        <section className="detalle-sec">
          <div className="wrap detalle-ficha">
            <div className="detalle-ficha__header">
              <span className="detalle-ficha__eyebrow">{t('det.ficha.eyebrow')}</span>
              <h2 className="detalle-ficha__title">{t('det.ficha.title')}</h2>
            </div>
            <div className="detalle-ficha__grid">
              {retiro.fichaTecnica.map((item) => (
                <div className="detalle-ficha__card" key={item.label}>
                  <FichaIcon name={item.icon} />
                  <div className="detalle-ficha__label">{item.label}</div>
                  <div className="detalle-ficha__value">{item.value}</div>
                  {item.desc && <p className="detalle-ficha__desc">{item.desc}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="band contact">
        <div className="wrap">
          <h2 className="d sec-title">{t('det.cta.h', { what: ctaPhrase })}</h2>
          <div className="row">
            <Link className="btn" to={to('/contacto')}>{t('det.cta.contact')}</Link>
            <Link className="btn btn--ghost" to={to('/proyectos/xp-lev')}>{t('det.cta.catalog')}</Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default function ProyectoDetalle() {
  const { id } = useParams();
  const { lang } = useLang();
  const detail = useData(`/api/public/retreats/${encodeURIComponent(id)}?lang=${lang}`);
  const cat = useCatalog();
  const state = { data: detail.data && cat.data ? { retiro: adaptRetreat(detail.data), c: cat.data } : null, loading: detail.loading || cat.loading, error: detail.error || cat.error, retry: () => { detail.retry(); cat.retry(); } };
  return <Async state={state}>{({ retiro, c }) => <Detalle retiro={retiro} c={c} />}</Async>;
}
