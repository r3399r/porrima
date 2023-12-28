import './assets/style.css';

import { createApp } from 'vue';
import { createVuestic } from 'vuestic-ui';

import App from './App.vue';
import router from './router';

const app = createApp(App);

app.use(createVuestic());
app.use(router);

app.mount('#app');
