<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-dialog" @click.stop>
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true }
})
defineEmits(['close'])
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-dialog {
  background: white;
  border-radius: var(--radius-lg);
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}

.dark-mode .modal-dialog {
  background: #2d3748 !important;
  border: 1px solid #4a5568 !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6) !important;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.dark-mode .modal-header {
  border-bottom: 1px solid #4a5568 !important;
  color: #e2e8f0 !important;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.6rem;
  line-height: 1;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  cursor: pointer;
  color: #666;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.modal-close:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #333;
}

.dark-mode .modal-close {
  color: #e2e8f0 !important;
}

.dark-mode .modal-close:hover {
  background: rgba(255, 255, 255, 0.08) !important;
}

.modal-body {
  padding: 1.5rem;
}

.dark-mode .modal-body {
  color: #e2e8f0 !important;
}

@media (max-width: 768px) {
  .modal-dialog {
    margin: 1rem;
    max-width: calc(100vw - 2rem);
  }
}
</style>
