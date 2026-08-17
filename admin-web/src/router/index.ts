import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import Login from '@/views/Login.vue';
import Layout from '@/components/AppLayout.vue';

const router = createRouter({ history: createWebHistory(), routes: [
  { path: '/login', component: Login, meta: { public: true } },
  { path: '/client/create/:merchantCode', name: 'client-create', component: () => import('@/views/ClientCreate.vue'), meta: { public: true } },
  { path: '/client/order/:token', name: 'client-order', component: () => import('@/views/ClientOrder.vue'), meta: { public: true } },
  { path: '/', component: Layout, children: [
    { path: '', name: 'dashboard', component: () => import('@/views/Dashboard.vue') },
    { path: 'merchants', name: 'merchants', component: () => import('@/views/Merchants.vue'), meta: { superAdmin: true } },
    { path: 'stores', name: 'stores', component: () => import('@/views/Stores.vue') },
    { path: 'employees', name: 'employees', component: () => import('@/views/Employees.vue') },
    { path: 'orders', name: 'orders', component: () => import('@/views/Orders.vue') },
    { path: 'settings', name: 'settings', component: () => import('@/views/Settings.vue') },
  ] },
] });
router.beforeEach(async (to) => {
  if (to.meta.public) return true;
  const auth = useAuthStore();
  if (!auth.isLoggedIn) return '/login';
  if (!auth.profile) { try { await auth.loadProfile(); } catch { return '/login'; } }
  if (to.meta.superAdmin && !auth.isSuperAdmin) return '/';
  if (['MAKEUP','PHOTOGRAPHER'].includes(auth.profile?.role??'') && ['dashboard','stores','employees','settings'].includes(String(to.name))) return '/orders';
  if (!to.meta.superAdmin && auth.isSuperAdmin && ['stores', 'employees', 'orders'].includes(String(to.name))) return '/merchants';
  return true;
});
export default router;
