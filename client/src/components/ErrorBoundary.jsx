import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '48px', textAlign: 'center',
          background: '#FDFAF6', borderRadius: '12px',
          border: '1px solid #E2D9C8', margin: '24px'
        }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#2C2416', marginBottom: '8px' }}>
            Something went wrong loading this page
          </div>
          <div style={{ fontSize: '13px', color: '#9B8B70', marginBottom: '16px' }}>
            {this.state.error?.message || 'Unknown error'}
          </div>
          <button
            className="btn-primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
export default ErrorBoundary;
