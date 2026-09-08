import ReactDOM from 'react-dom'
import App from './App'

// CSS is handled by the bundler and has no TypeScript module declarations.
// @ts-expect-error -- side-effect CSS import
import './index.css';

import { Provider } from 'react-redux'
import store from './config/store';

ReactDOM.render(<Provider store={store}><App /></Provider>, document.getElementById('root'))
