<template>
  <t-layout class="main-layout">
    <t-aside width="220px" class="layout-aside">
      <div class="logo">
        <t-icon name="insurance" size="32px" />
        <span class="logo-text">长安银科保险</span>
      </div>
      <t-menu
        v-model:value="currentMenu"
        theme="light"
        expand-level="one"
        :style="{ border: 'none' }"
        @change="handleMenuChange"
      >
        <template v-for="item in menuItems" :key="item.key">
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
          <t-dropdown :options="userMenuOptions" @click="handleUserMenuClick">
            <div class="user-info">
              <t-avatar size="small">张</t-avatar>
              <span class="user-name">张经理</span>
              <t-icon name="chevron-down" size="16px" />
            </div>
          </t-dropdown>
        </div>
      </t-header>

      <t-content class="layout-content">
        <router-view />
      </t-content>
    </t-layout>
  </t-layout>
</template>

<script setup>
import { ref, computed, watch, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from 'tdesign-vue-next'

const router = useRouter()
const route = useRoute()

const currentMenu = ref('insurance-purchase')
const notificationCount = ref(5)

const menuItems = [
  { 
    key: 'insurance', 
    title: '保险购买', 
    icon: 'document', 
    children: [
      { key: 'insurance-purchase', title: '投保信息管理', path: '/insurance/purchase' },
      { key: 'insurance-apply', title: '投保流程管理', path: '/insurance/apply' },
      { key: 'insurance-report', title: '投保数据报表', path: '/insurance/report' }
    ]
  },
  { 
    key: 'policy', 
    title: '保单管理', 
    icon: 'file', 
    children: [
      { key: 'policy-list', title: '保单信息管理', path: '/policy/list' },
      { key: 'policy-trade', title: '贸易信息管理', path: '/policy/trade' },
      { key: 'policy-limit', title: '信用限额管理', path: '/policy/limit' },
      { key: 'policy-shipment', title: '出运申报管理', path: '/policy/shipment' },
      { key: 'policy-process', title: '流程管理', path: '/policy/process' },
      { key: 'policy-subsidy', title: '保费补贴管理', path: '/policy/subsidy' },
      { key: 'policy-performance', title: '保单履约报表', path: '/policy/performance' }
    ]
  },
  { 
    key: 'claim', 
    title: '保险理赔', 
    icon: 'first-aid-kit', 
    children: [
      { key: 'claim-list', title: '理赔信息管理', path: '/claim/list' },
      { key: 'claim-process', title: '理赔流程管理', path: '/claim/process' },
      { key: 'claim-report', title: '理赔报表管理', path: '/claim/report' }
    ]
  },
  { 
    key: 'clerk', 
    title: '跟单员管理', 
    icon: 'person', 
    children: [
      { key: 'clerk-list', title: '跟单员信息', path: '/clerk/list' },
      { key: 'clerk-permission', title: '权限管理', path: '/clerk/permission' },
      { key: 'clerk-task', title: '业务管理', path: '/clerk/task' },
      { key: 'clerk-performance', title: '考核管理', path: '/clerk/performance' }
    ]
  },
  { 
    key: 'stats', 
    title: '数据统计', 
    icon: 'chart', 
    children: [
      { key: 'stats-business', title: '业务数据统计', path: '/stats/business' },
      { key: 'stats-risk', title: '风险数据分析', path: '/stats/risk' }
    ]
  }
]

const menuConfig = {
  'insurance-purchase': { parent: '保险购买', current: '投保信息管理' },
  'insurance-apply': { parent: '保险购买', current: '投保流程管理' },
  'insurance-report': { parent: '保险购买', current: '投保数据报表' },
  'policy-list': { parent: '保单管理', current: '保单信息管理' },
  'policy-trade': { parent: '保单管理', current: '贸易信息管理' },
  'policy-limit': { parent: '保单管理', current: '信用限额管理' },
  'policy-shipment': { parent: '保单管理', current: '出运申报管理' },
  'policy-process': { parent: '保单管理', current: '流程管理' },
  'policy-subsidy': { parent: '保单管理', current: '保费补贴管理' },
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
  { content: '个人中心', value: 'profile' },
  { content: '修改密码', value: 'password' },
  { content: '退出登录', value: 'logout' }
]

const breadcrumbItems = computed(() => {
  const key = route.meta?.menuKey || currentMenu.value
  const config = menuConfig[key]
  return config ? [config.parent, config.current] : ['首页']
})

const renderIcon = (iconName) => {
  return () => h(Icon, { name: iconName, size: '18px' })
}

const findPathByMenuKey = (key) => {
  for (const item of menuItems) {
    if (item.key === key && item.path) return item.path
    if (item.children) {
      const child = item.children.find(c => c.key === key)
      if (child?.path) return child.path
    }
  }
  return ''
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

watch(() => route.path, (newPath) => {
  for (const item of menuItems) {
    if (item.children) {
      const child = item.children.find(c => c.path === newPath)
      if (child) {
        currentMenu.value = child.key
        return
      }
    } else {
      if (item.path === newPath) {
        currentMenu.value = item.key
        return
      }
    }
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.main-layout {
  height: 100vh;
  display: flex;
}

.layout-aside {
  background: #fff;
  border-right: 1px solid #e7e7e7;
  display: flex;
  flex-direction: column;

  :deep(.t-menu) {
    border: none;
  }
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid #e7e7e7;
  color: #0052D9;
  background: linear-gradient(135deg, #0052D9 0%, #3680eb 100%);

  .logo-text {
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    letter-spacing: 1px;
  }
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
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

.layout-content {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}
</style>
