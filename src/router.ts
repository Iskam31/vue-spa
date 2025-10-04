import { createRouter, createWebHistory } from 'vue-router'
import IncomesPage from './pages/incomesPage.vue'
import OrdersPage from './pages/ordersPage.vue'
import SalesPage from './pages/salesPage.vue'
import StocksPage from './pages/stocksPage.vue'
import MainPage from './pages/mainPage.vue'
import MetricPage from './pages/MetricPage.vue'
import ArticleDetailPage from './pages/ArticleDetailPage.vue'

const routes = [
  { path: '/', redirect: '/main' },
  { path: '/main', component: MainPage, meta: { title: 'Главная' } },
  { path: '/metric/:metricType', component: MetricPage, meta: { title: 'Метрика' } },
  { path: '/article/:id', component: ArticleDetailPage, meta: { title: 'Детальная' } },
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
  let title = to.meta.title as string
  if (to.params.metricType) {
    const metricTitles: { [key: string]: string } = {
      sales: 'Продажи',
      revenue: 'Выручка', 
      cancellations: 'Отмены',
      discounts: 'Скидки'
    }
    title = metricTitles[to.params.metricType as string] || 'Метрика'
  } else if (to.params.id) {
    title = `Артикул ${to.params.id}`
  }

  document.title = (to.meta.title as string) || 'Dashboard'
})

export default router