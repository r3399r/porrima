import { createRouter, createWebHistory } from 'vue-router';
import DatetimeViewVue from '@/views/DatetimeView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/datetime',
      name: 'datetime',
      component: DatetimeViewVue,
    },
  ],
});

export default router;
