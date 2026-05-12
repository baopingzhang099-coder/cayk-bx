import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import TDesign from 'tdesign-vue-next'

import 'tdesign-vue-next/dist/tdesign.css'
import './assets/styles/common.scss'

const app = createApp(App)

app.use(createPinia())
app.use(TDesign)
app.use(router)

app.mount('#app')
