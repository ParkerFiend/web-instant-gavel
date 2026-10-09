import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('../views/Home.vue') },
  { path: '/venue', name: 'venue', component: () => import('../views/VenueSelect.vue') },
  { path: '/prepare', name: 'prepare', component: () => import('../views/Preparation.vue') },
  { path: '/bidding', name: 'bidding', component: () => import('../views/BiddingRoom.vue') },
  { path: '/settlement/:id?', name: 'settlement', component: () => import('../views/Settlement.vue') },
  { path: '/book', name: 'book', component: () => import('../views/CollectionBook.vue') },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export function nav(name: string): void {
  router.push({ name })
}