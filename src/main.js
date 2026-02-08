import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router.js'
import './styles/main.css'

const app = createApp(App)
app.use(router)
app.mount('#app')
