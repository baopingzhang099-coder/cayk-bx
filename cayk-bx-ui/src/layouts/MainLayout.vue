<template>
  <t-layout class="main-layout">
    <t-aside width="260px" class="layout-aside">
      <div class="logo">
        <t-avatar size="40px" class="logo-avatar">C</t-avatar>
        <div class="logo-texts">
          <div class="logo-title">长安银科</div>
          <div class="logo-subtitle">Chang'an Inkasso</div>
        </div>
      </div>
      <t-menu
        v-model:value="currentMenu"
        theme="light"
        expand-level="one"
        :style="{ border: 'none' }"
        @change="handleMenuChange"
      >
        <template v-for="item in filteredMenuItems" :key="item.key">
          <t-submenu
            v-if="item.children && item.children.length > 0"
            :value="item.key"
            :title="item.title"
            :icon="renderIcon(item.icon)"
          >
            <t-menu-item
              v-for="child in item.children"
              :key="child.key"
              :value="child.key"
            >
              {{ child.title }}
            </t-menu-item>
          </t-submenu>
          <t-menu-item
            v-else
            :value="item.key"
            :icon="renderIcon(item.icon)"
          >
            <template #title>{{ item.title }}</template>
          </t-menu-item>
        </template>
      </t-menu>
    </t-aside>

    <t-layout class="layout-main">
      <t-header class="layout-header">
        <div class="header-left">
          <t-breadcrumb>
            <t-breadcrumb-item v-for="item in breadcrumbItems" :key="item">
              {{ item }}
            </t-breadcrumb-item>
          </t-breadcrumb>
        </div>
        <div class="header-right">
          <t-tooltip content="通知">
            <t-badge :count="notificationCount" :max-count="99" :offset="[-2, 2]">
              <t-icon name="notification" size="20px" class="header-icon" />
            </t-badge>
          </t-tooltip>
          
          <div class="role-switch">
            <t-radio-group v-model="currentRole" direction="horizontal" button-style="solid">
              <t-radio value="customer">
                <template #icon>
                  <t-icon name="user" size="16px" />
                </template>
                客户
              </t-radio>
              <t-radio value="inkasso">
                <template #icon>
                  <t-icon name="building" size="16px" />
                </template>
                长安银科
              </t-radio>
              <t-radio value="clerk">
                <template #icon>
                  <t-icon name="user-check" size="16px" />
                </template>
                跟单员
              </t-radio>
            </t-radio-group>
          </div>

          <t-dropdown :options="userMenuOptions" @click="handleUserMenuClick">
            <div class="user-info">
              <t-avatar size="small">{{ userStore.avatarText }}</t-avatar>
              <span class="user-name">{{ userStore.userName }}</span>
              <t-icon name="chevron-down" size="16px" />
            </div>
          </t-dropdown>
        </div>
      </t-header>

      <t-content class="layout-content">
        <div class="content-topbar"></div>
        <router-view />
      </t-content>
    </t-layout>
  </t-layout>
</template>

<script setup>
import { ref, computed, watch, watchEffect, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from 'tdesign-vue-next'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const currentMenu = ref('insurance-purchase')
const notificationCount = ref(5)
const currentRole = ref(userStore.role)

const allMenuItems = [
  { key: 'insurance',
    title: '保险购买',
    icon: 'document-popular',
    roles: ['customer', 'inkasso', 'clerk'],
    children: [
      { key: 'insurance-purchase', title: '投保信息管理', path: '/insurance/purchase', roles: ['customer', 'inkasso', 'clerk'], icon: 'clipboard' },
      { key: 'insurance-purchase-process', title: '投保流程管理', path: '/insurance/purchase-process', roles: ['customer', 'inkasso', 'clerk'], icon: 'fork' },
      { key: 'insurance-report', title: '投保数据报表', path: '/insurance/report', roles: ['customer', 'inkasso', 'clerk'], icon: 'chart' },
    ]
  },
  { 
    key: 'policy', 
    title: '保单管理', 
    icon: 'file', 
    children: [
      { key: 'policy-list', title: '保单信息管理', path: '/policy/list', roles: ['customer', 'inkasso', 'clerk'], icon: 'file' },
      { key: 'policy-trade', title: '贸易信息管理', path: '/policy/trade', roles: ['inkasso'], icon: 'truck' },
      { key: 'policy-limit', title: '信用限额管理', path: '/policy/limit', roles: ['customer', 'inkasso', 'clerk'], icon: 'credit-card' },
      { key: 'policy-shipment', title: '出运申报管理', path: '/policy/shipment', roles: ['customer', 'inkasso', 'clerk'], icon: 'airplane' },
      { key: 'policy-process', title: '保单流程管理', path: '/policy/process', roles: ['customer', 'inkasso', 'clerk'], icon: 'fork' },
      { key: 'policy-performance', title: '保单履约报表', path: '/policy/performance', roles: ['inkasso'], icon: 'chart' }
    ]
  },
  { 
    key: 'claim', 
    title: '保险理赔', 
    icon: 'error-circle', 
    children: [
      { key: 'claim-list', title: '理赔信息管理', path: '/claim/list', roles: ['customer', 'inkasso', 'clerk'], icon: 'first-aid-kit' },
      { key: 'claim-process', title: '理赔流程管理', path: '/claim/process', roles: ['customer', 'inkasso', 'clerk'], icon: 'route' },
      { key: 'claim-report', title: '理赔报表管理', path: '/claim/report', roles: ['inkasso'], icon: 'chart' }
    ]
  },
  { 
    key: 'clerk', 
    title: '跟单员管理', 
    icon: 'user', 
    roles: ['inkasso'],
    children: [
      { key: 'clerk-list', title: '跟单员信息', path: '/clerk/list', roles: ['inkasso'], icon: 'user' },
      { key: 'clerk-permission', title: '权限管理', path: '/clerk/permission', roles: ['inkasso'], icon: 'lock-on' },
      { key: 'clerk-task', title: '业务管理', path: '/clerk/task', roles: ['inkasso', 'clerk'], icon: 'task' },
      { key: 'clerk-performance', title: '考核管理', path: '/clerk/performance', roles: ['inkasso', 'clerk'], icon: 'trophy' }
    ]
  },
  { 
    key: 'stats', 
    title: '数据统计', 
    icon: 'chart', 
    roles: ['inkasso', 'clerk'],
    children: [
      { key: 'stats-business', title: '业务数据统计', path: '/stats/business', roles: ['inkasso', 'clerk'], icon: 'chart' },
      { key: 'stats-risk', title: '风险数据分析', path: '/stats/risk', roles: ['inkasso'], icon: 'warning' }
    ]
  }
]

const filteredMenuItems = computed(() => {
  const role = userStore.role
  return allMenuItems
    .filter(m => !m.roles || m.roles.includes(role))
    .map((m) => {
      if (!m.children) return m
      const children = m.children.filter(c => !c.roles || c.roles.includes(role))
      return { ...m, children }
    })
    .filter(m => !m.children || m.children.length > 0)
})

const menuConfig = {
  'insurance-questionnaire': { parent: '保险购买', current: '客户投保问卷' },
  'insurance-purchase': { parent: '保险购买', current: '投保信息管理' },
  'insurance-purchase-process': { parent: '保险购买', current: '投保流程管理' },
  'insurance-report': { parent: '保险购买', current: '投保数据报表' },
  'policy-list': { parent: '保单管理', current: '保单信息管理' },
  'policy-trade': { parent: '保单管理', current: '贸易信息管理' },
  'policy-limit': { parent: '保单管理', current: '信用限额管理' },
  'policy-shipment': { parent: '保单管理', current: '出运申报管理' },
  'policy-process': { parent: '保单管理', current: '保单流程管理' },
  'policy-performance': { parent: '保单管理', current: '保单履约报表' },
  'claim-list': { parent: '保险理赔', current: '理赔信息管理' },
  'claim-process': { parent: '保险理赔', current: '理赔流程管理' },
  'claim-report': { parent: '保险理赔', current: '理赔报表管理' },
  'clerk-list': { parent: '跟单员管理', current: '跟单员信息' },
  'clerk-permission': { parent: '跟单员管理', current: '权限管理' },
  'clerk-task': { parent: '跟单员管理', current: '业务管理' },
  'clerk-performance': { parent: '跟单员管理', current: '考核管理' },
  'stats-business': { parent: '数据统计', current: '业务数据统计' },
  'stats-risk': { parent: '数据统计', current: '风险数据分析' }
}

const userMenuOptions = [
  { content: '个人设置', value: 'settings' },
  { content: '帮助中心', value: 'help' },
  { content: '退出登录', value: 'logout' }
]

const breadcrumbItems = computed(() => {
  const key = route.meta?.menuKey || currentMenu.value
  const config = menuConfig[key]
  if (!config) return ['首页']
  const title = route.meta?.title
  if (title && title !== config.current) return [config.parent, config.current, title]
  return [config.parent, config.current]
})

const renderIcon = (iconName) => {
  return () => h(Icon, { name: iconName, size: '18px' })
}

const findPathByMenuKey = (key) => {
  for (const item of allMenuItems) {
    if (item.key === key && item.path) return item.path
    if (item.children) {
      const child = item.children.find(c => c.key === key)
      if (child?.path) return child.path
    }
  }
  return ''
}

const getDefaultPathByRole = (role) => {
  if (role === 'customer') return '/insurance/purchase'
  return '/policy/list'
}

const handleMenuChange = (value) => {
  const path = findPathByMenuKey(value)
  if (path && path !== route.path) router.push(path)
}

const handleUserMenuClick = (data) => {
  if (data.value === 'logout') {
    console.log('logout')
  }
}

const handleRoleChange = (role) => {
  if (role === userStore.role) return
  userStore.setRole(role)
  const target = getDefaultPathByRole(role)
  if (route.path !== target) router.push(target)
}

watch(currentRole, handleRoleChange)

watchEffect(() => {
  const menuKey = route.meta?.menuKey
  if (menuKey) currentMenu.value = menuKey
})

watch(() => userStore.role, (role) => {
  currentRole.value = role
  const roles = route.meta?.roles
  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(role)) {
    router.push(getDefaultPathByRole(role))
  }
})
</script>

<style lang="scss" scoped>
.main-layout {
  height: 100vh;
  display: flex;
}

.layout-aside {
  background: #eef2f7;
  border-right: 1px solid #d9e2ec;
  display: flex;
  flex-direction: column;

  :deep(.t-menu) {
    border: none;
    background: transparent;
  }

  :deep(.t-menu__item),
  :deep(.t-menu__submenu-title) {
    margin: 4px 12px;
    border-radius: 10px;
    height: 44px;
    color: #334155;
  }

  :deep(.t-menu__item:hover),
  :deep(.t-menu__submenu-title:hover) {
    background: rgba(30, 64, 175, 0.08);
  }

  :deep(.t-menu__item.t-is-active),
  :deep(.t-menu__item--active),
  :deep(.t-menu__submenu-title.t-is-active),
  :deep(.t-menu__submenu-title--active) {
    background: #1f4e79;
    color: #fff;
  }

  :deep(.t-menu__item.t-is-active .t-icon),
  :deep(.t-menu__submenu-title.t-is-active .t-icon) {
    color: #fff;
  }

  :deep(.t-menu__sub .t-menu__item) {
    padding-left: 44px;
  }
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px;
  border-bottom: 1px solid #d9e2ec;
  background: #fff;

  .logo-avatar {
    background: #1f4e79;
    color: #fff;
    font-weight: 700;
  }
}

.logo-texts {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.logo-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: 1px;
}

.logo-subtitle {
  font-size: 14px;
  color: #64748b;
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f6f8fb;
  overflow: hidden;
}

.layout-header {
  background: #fff;
  border-bottom: 1px solid #e7e7e7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;

  :deep(.t-breadcrumb) {
    font-size: 14px;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: #f3f3f3;
    color: #0052D9;
  }
}

.role-switch {
  :deep(.t-radio-group) {
    background: #f8fafc;
    border-radius: 8px;
    padding: 2px;
  }

  :deep(.t-radio__button) {
    border: none;
    background: transparent;
    padding: 6px 16px;
    font-size: 13px;
    color: #64748b;
    border-radius: 6px;
    transition: all 0.2s;

    &:hover {
      background: rgba(0, 82, 217, 0.08);
      color: #0052D9;
    }

    &.t-is-checked {
      background: #0052D9;
      color: #fff;

      :deep(.t-icon) {
        color: #fff;
      }
    }
  }

  :deep(.t-radio__icon) {
    margin-right: 6px;
    color: #64748b;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: #f3f3f3;
  }
}

.user-name {
  color: #333;
  font-size: 14px;
}

.role-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(0, 82, 217, 0.12);
  color: #0052D9;
}

.layout-content {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
  background: #f6f8fb;
}

.content-topbar {
  height: 6px;
  background: #2f7ed8;
  border-radius: 4px;
  margin-bottom: 16px;
}
</style>
