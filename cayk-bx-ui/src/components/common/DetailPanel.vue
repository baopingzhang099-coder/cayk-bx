<template>
  <div class="detail-panel">
    <div v-if="title" class="panel-header">
      <div class="panel-title">{{ title }}</div>
    </div>
    <div class="panel-body">
      <t-description
        :columns="processedColumns"
        :data="data"
        :item-class="itemClass"
        layout="vertical"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  columns: { type: Array, default: () => [] },
  data: { type: Object, default: () => ({}) },
  itemClass: { type: String, default: 'detail-item' }
})

const processedColumns = computed(() => {
  return props.columns.map(col => {
    if (col.formatter && typeof col.formatter === 'function') {
      return {
        ...col,
        content: (row, column) => col.formatter(row[col.key])
      }
    }
    return col
  })
})
</script>

<style lang="scss" scoped>
.detail-panel {
  background: #fff;
  border-radius: 4px;
}

.panel-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e7e7e7;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.panel-body {
  padding: 24px;
}

:deep(.detail-item) {
  .t-description__label {
    color: #999;
    font-size: 14px;
  }
  .t-description__content {
    color: #333;
    font-size: 14px;
  }
}
</style>
