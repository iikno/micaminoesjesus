import { Link } from 'react-router-dom';
import { useLang, useMeta } from '../i18n';

// Shared loading / error / not-found block for pages that read from the API.
export function Loading() {
  const { t } = useLang();
  return <div className="pub-state" role="status"><p>{t('state.loading')}</p></div>;
}

export function Failed({ onRetry, notFound }) {
  const { t, to } = useLang();
  useMeta(null, { title: notFound ? t('state.notfound') : t('state.error') });
  return (
    <div className="pub-state" role="alert">
      <p>{notFound ? t('state.notfound') : t('state.error')}</p>
      {notFound ? <Link className="btn" to={to('/')}>{t('state.back')}</Link> : <button type="button" className="btn" onClick={onRetry}>{t('state.retry')}</button>}
    </div>
  );
}

// Renders children(data) once loaded.
export function Async({ state, children }) {
  if (state.loading) return <Loading />;
  if (state.error) return <Failed onRetry={state.retry} notFound={state.error.status === 404} />;
  return children(state.data);
}
