import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/insurance/purchase',
    children: [
      {
        path: '/insurance/purchase',
        name: 'InsurancePurchase',
        component: () => import('@/pages/insurance/InsurancePurchase.vue'),
        meta: { title: '投保信息管理', menuKey: 'insurance-purchase' }
      },
      {
        path: '/insurance/apply',
        name: 'InsuranceApply',
        component: () => import('@/pages/insurance/InsuranceApply.vue'),
        meta: { title: '投保流程管理', menuKey: 'insurance-apply' }
      },
      {
        path: '/insurance/report',
        name: 'InsuranceReport',
        component: () => import('@/pages/insurance/InsuranceReport.vue'),
        meta: { title: '投保数据报表', menuKey: 'insurance-report' }
      },
      {
        path: '/policy/list',
        name: 'PolicyList',
        component: () => import('@/pages/policy/PolicyList.vue'),
        meta: { title: '保单信息管理', menuKey: 'policy-list' }
      },
      {
        path: '/policy/trade',
        name: 'PolicyTrade',
        component: () => import('@/pages/policy/PolicyTrade.vue'),
        meta: { title: '贸易信息管理', menuKey: 'policy-trade' }
      },
      {
        path: '/policy/limit',
        name: 'CreditLimit',
        component: () => import('@/pages/policy/CreditLimit.vue'),
        meta: { title: '信用限额管理', menuKey: 'policy-limit' }
      },
      {
        path: '/policy/shipment',
        name: 'ShipmentDeclare',
        component: () => import('@/pages/policy/ShipmentDeclare.vue'),
        meta: { title: '出运申报管理', menuKey: 'policy-shipment' }
      },
      {
        path: '/policy/process',
        name: 'PolicyProcess',
        component: () => import('@/pages/policy/PolicyProcess.vue'),
        meta: { title: '流程管理', menuKey: 'policy-process' }
      },
      {
        path: '/policy/subsidy',
        name: 'SubsidyManage',
        component: () => import('@/pages/policy/SubsidyManage.vue'),
        meta: { title: '保费补贴管理', menuKey: 'policy-subsidy' }
      },
      {
        path: '/policy/performance',
        name: 'PolicyPerformance',
        component: () => import('@/pages/policy/PolicyPerformance.vue'),
        meta: { title: '保单履约报表', menuKey: 'policy-performance' }
      },
      {
        path: '/claim/list',
        name: 'ClaimList',
        component: () => import('@/pages/claim/ClaimList.vue'),
        meta: { title: '理赔信息管理', menuKey: 'claim-list' }
      },
      {
        path: '/claim/process',
        name: 'ClaimProcess',
        component: () => import('@/pages/claim/ClaimProcess.vue'),
        meta: { title: '理赔流程管理', menuKey: 'claim-process' }
      },
      {
        path: '/claim/report',
        name: 'ClaimReport',
        component: () => import('@/pages/claim/ClaimReport.vue'),
        meta: { title: '理赔报表管理', menuKey: 'claim-report' }
      },
      {
        path: '/clerk/list',
        name: 'ClerkList',
        component: () => import('@/pages/clerk/ClerkList.vue'),
        meta: { title: '跟单员信息', menuKey: 'clerk-list' }
      },
      {
        path: '/clerk/permission',
        name: 'ClerkPermission',
        component: () => import('@/pages/clerk/ClerkPermission.vue'),
        meta: { title: '权限管理', menuKey: 'clerk-permission' }
      },
      {
        path: '/clerk/task',
        name: 'ClerkTask',
        component: () => import('@/pages/clerk/ClerkTask.vue'),
        meta: { title: '业务管理', menuKey: 'clerk-task' }
      },
      {
        path: '/clerk/performance',
        name: 'ClerkPerformance',
        component: () => import('@/pages/clerk/ClerkPerformance.vue'),
        meta: { title: '考核管理', menuKey: 'clerk-performance' }
      },
      {
        path: '/stats/business',
        name: 'BusinessStats',
        component: () => import('@/pages/statistics/BusinessStats.vue'),
        meta: { title: '业务数据统计', menuKey: 'stats-business' }
      },
      {
        path: '/stats/risk',
        name: 'RiskAnalysis',
        component: () => import('@/pages/statistics/RiskAnalysis.vue'),
        meta: { title: '风险数据分析', menuKey: 'stats-risk' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 长安银科保险管理系统` : '长安银科保险管理系统'
  next()
})

export default router
