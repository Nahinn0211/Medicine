import { createApp } from 'vue';
import App from '@/App.vue';
import router from '@/router/index.js';
import $ from 'jquery';
import { createPinia } from 'pinia'

window.$ = $;

if (window.location.pathname.startsWith('/admin')) {
    import('@admin/main.js');
  }else{
    import('@user/main.js');
  }

const app = createApp(App);
const pinia = createPinia(); 
app.use(pinia);
app.use(router);
app.mount('#app');