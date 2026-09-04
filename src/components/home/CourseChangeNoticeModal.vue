<template>
  <BaseModal v-if="notices.length > 0" title="⚠️ 課程異動通知" @close="$emit('close')">
    <p class="change-notice-intro">
      課程資料更新後，你原本已選的以下 {{ notices.length }} 門課程有異動，已自動從課表移除，請重新搜尋確認後再加入：
    </p>

    <div v-for="notice in notices" :key="notice.courseID" class="change-notice-item">
      <div class="change-notice-title">
        <span class="chip" :class="notice.type === 'removed' ? 'chip-removed' : 'chip-changed'">
          {{ notice.type === 'removed' ? '已停開／下架' : '內容異動' }}
        </span>
        <strong>{{ notice.courseID }} {{ notice.title }}</strong>
      </div>
      <div class="change-notice-diff">
        <div class="change-notice-before">異動前：{{ notice.before }}</div>
        <div v-if="notice.after" class="change-notice-after">異動後：{{ notice.after }}</div>
        <div v-else class="change-notice-after">此課程已從課程資料中移除，可能是停開或課號變動</div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue'

defineProps({
  notices: { type: Array, default: () => [] }
})
defineEmits(['close'])
</script>

<style scoped>
.change-notice-intro {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.change-notice-item {
  padding: 0.8rem;
  margin-bottom: 0.8rem;
  border-radius: var(--radius-sm);
  border: 1px solid #eee;
  background: #fafafa;
}

.dark-mode .change-notice-item {
  border: 1px solid #4a5568 !important;
  background: #333c4d !important;
}

.change-notice-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.chip-removed {
  background: #fdecea !important;
  color: var(--danger-strong) !important;
  border: 1px solid #f5b6ae;
}

.dark-mode .chip-removed {
  background: #5d2a2a !important;
  color: #ffcdd2 !important;
}

.chip-changed {
  background: var(--warning-bg) !important;
  color: var(--warning-text) !important;
  border: 1px solid var(--warning-border);
}

.dark-mode .chip-changed {
  background: #3a2f12 !important;
  color: #f0d78c !important;
}

.change-notice-diff {
  font-size: 0.85rem;
  line-height: 1.6;
  color: #555;
}

.dark-mode .change-notice-diff {
  color: #cbd5e0 !important;
}

.change-notice-before {
  text-decoration: line-through;
  opacity: 0.75;
}

.change-notice-after {
  color: var(--brand-2);
  font-weight: 500;
}

.dark-mode .change-notice-after {
  color: #c9c2f0 !important;
}
</style>
