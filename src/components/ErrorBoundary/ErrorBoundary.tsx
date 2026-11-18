import { Component, ErrorInfo, ReactNode } from 'react';
import { reportError } from '../../utils/errorReport';
import './errorBoundary.css';

/* When a page breaks while it draws, the customer used to get a blank white screen. Now they get a
   short message with a way out, and the error is reported (utils/errorReport).
   - `page`: around one page inside the signed-in shell, so the menu and the bottom bar keep working;
     its `resetKey` (the address) clears the error as soon as the customer moves to another page.
   - otherwise: around the whole app, the last net, on a full screen. */

type Props = { children: ReactNode, page?: boolean, resetKey?: string };
type State = { failed: boolean };

class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const firstComponent = (info.componentStack || '').trim().split('\n')[0]?.trim() || '';
    reportError(error, true, `${this.props.page ? 'page' : 'app'} ${firstComponent}`);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className={`eb ${this.props.page ? 'eb--page' : 'eb--app'}`} dir="rtl" lang="ar" role="alert">
        <div className="eb__box">
          <span className="eb__icon" aria-hidden>!</span>
          <h1>تعذّر عرض هذه الصفحة</h1>
          <p>حدث خطأ أثناء فتحها، ووصلنا تنبيه به. أعد المحاولة، وإن تكرر ارجع للرئيسية.</p>
          <div className="eb__actions">
            <button type="button" className="eb__btn eb__btn--primary" onClick={() => window.location.reload()}>إعادة المحاولة</button>
            <a className="eb__btn" href="/home">الصفحة الرئيسية</a>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
