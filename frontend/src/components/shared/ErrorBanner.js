export const ErrorBanner = ({ message, onRetry }) => (
  <div
    className="bg-red-50 border border-red-200 rounded-lg p-4 my-4"
    style={{
      backgroundColor: '#FEF2F2',
      border: '1px solid #FECACA',
      borderRadius: '0.5rem',
      padding: '1rem',
      margin: '1rem 0',
    }}
  >
    <p style={{ color: '#B91C1C', fontWeight: 500 }}>⚠ {message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        style={{
          marginTop: '0.5rem',
          color: '#B91C1C',
          textDecoration: 'underline',
          fontSize: '0.875rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    )}
  </div>
);

ErrorBanner.displayName = 'ErrorBanner';
