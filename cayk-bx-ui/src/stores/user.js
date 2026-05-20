import { defineStore } from 'pinia'

const ROLE_KEY = 'cayk_role'

const roleLabelMap = {
  customer: '客户',
  inkasso: '长安银科',
  clerk: '跟单员'
}

const roleUserMap = {
  customer: { name: '深圳XX国际贸易有限公司', avatarText: '深', companyName: '深圳XX国际贸易有限公司', userId: 'C20260001' },
  inkasso: { name: '张经理', avatarText: '张', companyName: '长安银科', userId: 'M20260001' },
  clerk: { name: '李跟单', avatarText: '跟', companyName: '长安银科', userId: 'S20260001' }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    role: localStorage.getItem(ROLE_KEY) || 'customer'
  }),
  getters: {
    roleLabel(state) {
      return roleLabelMap[state.role] || '长安银科'
    },
    userName(state) {
      return roleUserMap[state.role]?.name || '张经理'
    },
    avatarText(state) {
      return roleUserMap[state.role]?.avatarText || '张'
    },
    companyName(state) {
      return roleUserMap[state.role]?.companyName || ''
    },
    userId(state) {
      return roleUserMap[state.role]?.userId || ''
    }
  },
  actions: {
    setRole(role) {
      this.role = role
      localStorage.setItem(ROLE_KEY, role)
    }
  }
})