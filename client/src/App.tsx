import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import './i18n/config'; // Initialize i18n
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/custom.css';

function App() {
  return <RouterProvider router={router} />;
}

export default App;
