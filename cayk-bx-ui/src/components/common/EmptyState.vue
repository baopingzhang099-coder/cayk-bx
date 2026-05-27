<template>
  <div class="empty-state">
    <t-icon :name="iconName" size="64px" class="empty-icon" />
    <div class="empty-title">{{ title }}</div>
    <div v-if="description" class="empty-description">{{ description }}</div>
    <t-button v-if="actionText" theme="primary" @click="handleAction" class="empty-action">
      {{ actionText }}
    </t-button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: { type: String, default: 'empty' },
  title: { type: String, default: '暂无数据' },
  description: { type: String, default: '' },
  actionText: { type: String, default: '' }
})

const emit = defineEmits(['action'])

const iconName = computed(() => {
  const icons = {
    empty: 'no-result',
    error: 'error-circle',
    search: 'search',
    network: 'wifi-off'
  }
  return icons[props.type] || icons.empty
})

const handleAction = () => {
  emit('action')
}
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-icon {
  color: #ccc;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}

.empty-description {
  font-size: 14px;
  color: #999;
  margin-bottom: 16px;
}

.empty-action {
  margin-top: 8px;
}
</style>
