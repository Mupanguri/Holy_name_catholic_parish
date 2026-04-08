export const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div style={{ textAlign: 'center', padding: '2rem' }}>
    <div
      className="animate-spin w-8 h-8 border-4 border-church-gold border-t-transparent rounded-full mx-auto mb-2"
      style={{
        border: '4px solid #C9A84C',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        width: '2rem',
        height: '2rem',
        animation: 'spin 1s linear infinite',
      }}
    />
    <style>
      {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
    </style>
    <p className="text-gray-500 text-sm">{message}</p>
  </div>
);

LoadingSpinner.displayName = 'LoadingSpinner';
