// Shown for the moment a page's file is downloading the first time it is opened. It waits a beat
// before appearing, so on a fast connection nothing flashes.
const PageLoader = ({ fullScreen }: { fullScreen?: boolean }) => (
  <div
    role="status"
    aria-label="جارٍ التحميل"
    style={{
      display: 'grid',
      placeItems: 'center',
      width: '100%',
      minHeight: fullScreen ? '100vh' : '50vh',
      animation: 'page-loader-in 0.2s ease 0.25s both',
    }}
  >
    <style>{`
      @keyframes page-loader-in { from { opacity: 0 } to { opacity: 1 } }
      @keyframes page-loader-spin { to { transform: rotate(360deg) } }
    `}</style>
    <span
      aria-hidden
      style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        border: '3px solid #d7e6dc',
        borderTopColor: '#15803d',
        animation: 'page-loader-spin 0.8s linear infinite',
      }}
    />
  </div>
);

export default PageLoader;
