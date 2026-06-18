import { Component } from 'react';
import { T, FONT, DISPLAY } from '../lib/constants.jsx';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  state = { error: null, info: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorScreen
          error={this.state.error}
          onReset={() => this.setState({ error: null, info: null })}
        />
      );
    }
    return this.props.children;
  }
}

function ErrorScreen({ error, onReset }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: 'radial-gradient(125% 80% at 50% 0%, #FFFEFA 0%, #F5EFE2 100%)',
      padding: 24, fontFamily: FONT,
    }}>
      <div style={{
        background: '#FFFDF8', border: `1px solid ${T.border}`, borderRadius: 20,
        padding: 32, maxWidth: 440, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,.08)', textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, background: T.dangerSoft,
          display: 'grid', placeItems: 'center', margin: '0 auto 18px',
        }}>
          <AlertCircle size={28} color={T.danger} />
        </div>

        <div style={{
          fontFamily: DISPLAY, fontSize: 22, fontWeight: 600,
          color: T.ink, marginBottom: 10,
        }}>
          Algo salió mal
        </div>

        <div style={{ fontSize: 13, color: T.textMed, lineHeight: 1.6, marginBottom: 20 }}>
          La aplicación encontró un error inesperado. Puedes intentar recargar el componente.
        </div>

        {error?.message && (
          <div style={{
            background: T.dangerSoft, border: `1px solid ${T.danger}30`,
            borderRadius: 10, padding: '10px 14px', marginBottom: 20,
            fontSize: 11, color: T.danger, fontFamily: 'monospace',
            textAlign: 'left', wordBreak: 'break-word',
          }}>
            {error.message}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              flex: 1, padding: 12, borderRadius: 10, border: `1px solid ${T.border}`,
              background: T.surface, cursor: 'pointer', fontSize: 13, fontWeight: 700,
              color: T.inkSoft,
            }}
          >
            Recargar página
          </button>
          <button
            onClick={onReset}
            className="press"
            style={{
              flex: 1, padding: 12, borderRadius: 10, border: 'none',
              background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDim})`,
              color: '#FFF', cursor: 'pointer', fontSize: 13, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}
          >
            <RefreshCw size={14} /> Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}
