import { defineStore } from 'pinia'

const ROLE_KEY = 'cayk_role'

const roleLabelMap = {
  customer: '客户',
  inkasso: '长安银科',
  clerk: '跟单员'
}

const roleUserMap = {
  customer: { name: '客户A', avatarText: '客' },
  inkasso: { name: '张经理', avatarText: '张' },
  clerk: { name: '李跟单', avatarText: '跟' }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    role: localStorage.getItem(ROLE_KEY) || 'inkasso'
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
    }
  },
  actions: {
    setRole(role) {
      this.role = role
      localStorage.setItem(ROLE_KEY, role)
    }
  }
})

