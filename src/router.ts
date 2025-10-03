import { createRouter, createWebHistory } from 'vue-router'
import IncomesPage from './pages/incomesPage.vue'
import OrdersPage from './pages/ordersPage.vue'
import SalesPage from './pages/salesPage.vue'
import StocksPage from './pages/stocksPage.vue'
import MainPage from './pages/mainPage.vue'

const routes = [
  { path: '/', redirect: '/main' },
  { path: '/main', component: MainPage, meta: { title: 'Главная' } },
  { path: '/incomes', component: IncomesPage, meta: { title: 'Incomes' } },
  { path: '/orders', component: OrdersPage, meta: { title: 'Orders' } },
  { path: '/sales', component: SalesPage, meta: { title: 'Sales' } },
  { path: '/stocks', component: StocksPage, meta: { title: 'Stocks' } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.afterEach((to) => {
  document.title = (to.meta.title as string) || 'Dashboard'
})

export default router