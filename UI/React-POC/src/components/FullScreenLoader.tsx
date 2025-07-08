import React from 'react';
import { Loader } from '@progress/kendo-react-indicators';

interface FullScreenLoaderProps {
  loading: boolean;
}

const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({ loading }) => {
  if (!loading) return null;

  return (
    <div style={styles.backdrop}>
      <Loader type="infinite-spinner" size="large" />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
};

export default FullScreenLoader;
