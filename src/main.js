import { createApp } from 'vue'
import { Quasar, Notify, Dialog } from 'quasar'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/dist/quasar.css'
import App from './App.vue'

const app = createApp(App)

app.use(Quasar, {
  plugins: {
    Notify,
    Dialog
  },
  config: {
    brand: {
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#11998e',
      positive: '#38ef7d',
      negative: '#c10015',
      info: '#31ccec',
      warning: '#f2c037'
    }
  }
})

app.mount('#app')
