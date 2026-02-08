import { createRouter, createWebHashHistory } from 'vue-router'

const Package2dView = () => import('./components/Package2dView.vue')
const Package3dView = () => import('./components/Package3dView.vue')

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/view/2d/:pkgId/:version?',
      component: Package2dView
    },
    {
      path: '/view/3d/:pkgId/:version?',
      component: Package3dView
    },
    {
      path: '/',
      component: { render() { return null } }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})
