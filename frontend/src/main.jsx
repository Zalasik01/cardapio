import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { PrimeReactProvider } from 'primereact/api'
import App from './App.jsx'
import CentralMensagens from './components/CentralMensagens'
import { store } from './store'
import { ativarSelecaoAoFocar } from './selecionarAoFocar'
import './primereact-locale'
import './styles/camadas.css'
import 'primereact/resources/themes/lara-light-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './styles/main.scss'

ativarSelecaoAoFocar()

// sem StrictMode: em desenvolvimento ele executa cada useEffect duas vezes (montar, desmontar, montar), duplicando as requisicoes
ReactDOM.createRoot(document.getElementById('root')).render(
  <PrimeReactProvider value={{ locale: 'pt-BR' }}>
    <Provider store={store}>
      <App />
      <CentralMensagens />
    </Provider>
  </PrimeReactProvider>
)
