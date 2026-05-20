<template>
  <div class="detail-panel">
    <div v-if="title" class="panel-header">
      <div class="panel-title">{{ title }}</div>
    </div>
    <div class="panel-body">
      <div v-for="col in columns" :key="col.key" class="detail-item">
        <span class="detail-label">{{ col.label }}</span>
        <span class="detail-value" v-html="getValue(col)"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  columns: { type: Array, default: () => [] },
  data: { type: Object, default: () => ({}) }
})

const getValue = (col) => {
  if (!props.data) return '-'
  const value = props.data[col.key]
  if (col.formatter && typeof col.formatter === 'function') {
    return col.formatter(value, props.data)
  }
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return value
}
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
  padding: 16px 24px;
}

.detail-item {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px dashed #eee;
  
  &:last-child {
    border-bottom: none;
  }
}

.detail-label {
  width: 140px;
  flex-shrink: 0;
  color: #999;
  font-size: 14px;
}

.detail-value {
  flex: 1;
  color: #333;
  font-size: 14px;
  word-break: break-all;
}
</style>
