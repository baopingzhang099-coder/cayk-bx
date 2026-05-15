import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/insurance/purchase',
    children: [
      {
        path: '/insurance/purchase/new',
        name: 'InsurancePurchaseCreate',
        component: () => import('@/pages/insurance/InsurancePurchaseFormPage.vue'),
        meta: { title: '新增投保', menuKey: 'insurance-purchase', roles: ['customer', 'inkasso', 'clerk'] }
      },
      {
        path: '/insurance/purchase/:id/edit',
        name: 'InsurancePurchaseEdit',
        component: () => import('@/pages/insurance/InsurancePurchaseFormPage.vue'),
        meta: { title: '编辑投保', menuKey: 'insurance-purchase', roles: ['customer', 'inkasso', 'clerk'] }
      },
      {
        path: '/insurance/purchase/:id',
        name: 'InsurancePurchaseDetail',
        component: () => import('@/pages/insurance/InsurancePurchaseFormPage.vue'),
        meta: { title: '投保详情', menuKey: 'insurance-purchase', roles: ['customer', 'inkasso', 'clerk'] }
      },
      {
        path: '/insurance/questionnaire',
        name: 'InsuranceQuestionnaire',
        component: () => import('@/pages/insurance/InsuranceQuestionnaire.vue'),
        meta: { title: '客户投保需求问卷', menuKey: 'insurance-questionnaire', roles: ['customer', 'inkasso', 'clerk'] }
      },
      {
        path: '/insurance/purchase',
        name: 'InsurancePurchase',
        component: () => import('@/pages/insurance/InsurancePurchase.vue'),
        meta: { title: '投保信息管理', menuKey: 'insurance-purchase', roles: ['customer', 'inkasso', 'clerk'] }
      },
      {
        path: '/insurance/apply',
        name: 'InsuranceApply',
        component: () => import('@/pages/insurance/InsuranceApply.vue'),
        meta: { title: '投保流程管理', menuKey: 'insurance-apply', roles: ['inkasso', 'clerk'] }
      },
      {
        path: '/insurance/report',
        name: 'InsuranceReport',
        component: () => import('@/pages/insurance/InsuranceReport.vue'),
        meta: { title: '投保数据报表', menuKey: 'insurance-report', roles: ['inkasso'] }
      },
      {
        path: '/policy/list',
        name: 'PolicyList',
        component: () => import('@/pages/policy/PolicyList.vue'),
        meta: { title: '保单信息管理', menuKey: 'policy-list', roles: ['customer', 'inkasso', 'clerk'] }
      },
      {
        path: '/policy/trade',
        name: 'PolicyTrade',
        component: () => import('@/pages/policy/PolicyTrade.vue'),
        meta: { title: '贸易信息管理', menuKey: 'policy-trade', roles: ['inkasso', 'clerk'] }
      },
      {
        path: '/policy/limit',
        name: 'CreditLimit',
        component: () => import('@/pages/policy/CreditLimit.vue'),
        meta: { title: '信用限额管理', menuKey: 'policy-limit', roles: ['inkasso', 'clerk'] }
      },
      {
        path: '/policy/shipment',
        name: 'ShipmentDeclare',
        component: () => import('@/pages/policy/ShipmentDeclare.vue'),
        meta: { title: '出运申报管理', menuKey: 'policy-shipment', roles: ['customer', 'inkasso', 'clerk'] }
      },
      {
        path: '/policy/process',
        name: 'PolicyProcess',
        component: () => import('@/pages/policy/PolicyProcess.vue'),
        meta: { title: '流程管理', menuKey: 'policy-process', roles: ['inkasso', 'clerk'] }
      },
      {
        path: '/policy/subsidy',
        name: 'SubsidyManage',
        component: () => import('@/pages/policy/SubsidyManage.vue'),
        meta: { title: '保费补贴管理', menuKey: 'policy-subsidy', roles: ['inkasso'] }
      },
      {
        path: '/policy/performance',
        name: 'PolicyPerformance',
        component: () => import('@/pages/policy/PolicyPerformance.vue'),
        meta: { title: '保单履约报表', menuKey: 'policy-performance', roles: ['inkasso'] }
      },
      {
        path: '/claim/list',
        name: 'ClaimList',
        component: () => import('@/pages/claim/ClaimList.vue'),
        meta: { title: '理赔信息管理', menuKey: 'claim-list', roles: ['customer', 'inkasso', 'clerk'] }
      },
      {
        path: '/claim/process',
        name: 'ClaimProcess',
        component: () => import('@/pages/claim/ClaimProcess.vue'),
        meta: { title: '理赔流程管理', menuKey: 'claim-process', roles: ['inkasso', 'clerk'] }
      },
      {
        path: '/claim/report',
        name: 'ClaimReport',
        component: () => import('@/pages/claim/ClaimReport.vue'),
        meta: { title: '理赔报表管理', menuKey: 'claim-report', roles: ['inkasso'] }
      },
      {
        path: '/clerk/list',
        name: 'ClerkList',
        component: () => import('@/pages/clerk/ClerkList.vue'),
        meta: { title: '跟单员信息', menuKey: 'clerk-list', roles: ['inkasso'] }
      },
      {
        path: '/clerk/permission',
        name: 'ClerkPermission',
        component: () => import('@/pages/clerk/ClerkPermission.vue'),
        meta: { title: '权限管理', menuKey: 'clerk-permission', roles: ['inkasso'] }
      },
      {
        path: '/clerk/task',
        name: 'ClerkTask',
        component: () => import('@/pages/clerk/ClerkTask.vue'),
        meta: { title: '业务管理', menuKey: 'clerk-task', roles: ['inkasso', 'clerk'] }
      },
      {
        path: '/clerk/performance',
        name: 'ClerkPerformance',
        component: () => import('@/pages/clerk/ClerkPerformance.vue'),
        meta: { title: '考核管理', menuKey: 'clerk-performance', roles: ['inkasso', 'clerk'] }
      },
      {
        path: '/stats/business',
        name: 'BusinessStats',
        component: () => import('@/pages/statistics/BusinessStats.vue'),
        meta: { title: '业务数据统计', menuKey: 'stats-business', roles: ['inkasso', 'clerk'] }
      },
      {
        path: '/stats/risk',
        name: 'RiskAnalysis',
        component: () => import('@/pages/statistics/RiskAnalysis.vue'),
        meta: { title: '风险数据分析', menuKey: 'stats-risk', roles: ['inkasso'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const role = userStore.role
  document.title = to.meta.title ? `${to.meta.title} - 长安银科保险管理系统` : '长安银科保险管理系统'
  const roles = to.meta?.roles
  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(role)) {
    const fallback = role === 'customer'
      ? '/insurance/purchase'
      : role === 'clerk'
        ? '/insurance/apply'
        : '/insurance/purchase'
    next(fallback)
    return
  }
  next()
})

export default router
