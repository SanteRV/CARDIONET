import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error) => ReactNode);
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const fb = this.props.fallback;
      const content = typeof fb === 'function' ? fb(this.state.error) : (fb ?? (
        <div className="alert alert-danger m-3">
          <strong>Error al cargar:</strong>
          <pre className="mt-2 mb-0 small">{this.state.error.message}</pre>
        </div>
      ));
      return content;
    }
    return this.props.children;
  }
}
