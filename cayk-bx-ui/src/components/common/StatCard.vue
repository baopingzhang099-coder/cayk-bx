<template>
  <t-card class="stat-card" :class="{ clickable: onClick }" @click="handleClick">
    <div class="stat-icon" :style="{ backgroundColor: iconBgColor }">
      <t-icon :name="icon" size="24px" :style="{ color: iconColor }" />
    </div>
    <div class="stat-content">
      <div class="stat-title">{{ title }}</div>
      <div class="stat-value">
        <span class="value">{{ displayValue }}</span>
        <span v-if="suffix" class="suffix">{{ suffix }}</span>
      </div>
      <div v-if="trend" class="stat-trend" :class="trendClass">
        <t-icon :name="trend < 0 ? 'trend' : 'trend'" size="14px" />
        <span>{{ Math.abs(trend) }}%</span>
        <span class="trend-text">较上期</span>
      </div>
    </div>
  </t-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  value: { type: [Number, String], default: 0 },
  icon: { type: String, default: 'chart' },
  trend: { type: Number, default: null },
  suffix: { type: String, default: '' },
  color: { type: String, default: 'primary' },
  onClick: { type: Function, default: null }
})

const displayValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString()
  }
  return props.value
})

const iconColor = computed(() => {
  const colors = {
    primary: '#0052D9',
    success: '#00A870',
    warning: '#FFB800',
    danger: '#E34D57'
  }
  return colors[props.color] || colors.primary
})

const iconBgColor = computed(() => {
  return iconColor.value + '15'
})

const trendClass = computed(() => {
  return props.trend >= 0 ? 'trend-up' : 'trend-down'
})

const handleClick = () => {
  props.onClick?.()
}
</script>

<style lang="scss" scoped>
.stat-card {
  &.clickable {
    cursor: pointer;
    transition: box-shadow 0.2s;
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }

  :deep(.t-card__body) {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  display: flex;
  align-items: baseline;
  gap: 4px;

  .value {
    font-size: 24px;
    font-weight: 600;
    color: #333;
  }

  .suffix {
    font-size: 14px;
    color: #666;
  }
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;

  &.trend-up {
    color: #00A870;
  }

  &.trend-down {
    color: #E34D57;
  }

  .trend-text {
    color: #999;
    margin-left: 4px;
  }
}
</style>
