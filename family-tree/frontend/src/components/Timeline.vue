<script setup lang="ts">
import { computed } from 'vue'
import type { FamilyStory } from '@/api/family'
import { useRouter } from 'vue-router'

const router = useRouter()
const props = withDefaults(defineProps<{
  stories: FamilyStory[]
  showMemberLink?: boolean
}>(), {
  showMemberLink: true
})

function goToMember(memberId: number) {
  router.push(`/member/${memberId}`)
}

function statusLabel(status: number): string {
  if (status === 0) return '待审核'
  if (status === 2) return '已驳回'
  return ''
}

function statusClass(status: number): string {
  if (status === 0) return 'status-pending'
  if (status === 2) return 'status-rejected'
  return ''
}
</script>

<template>
  <div class="timeline" v-if="stories.length > 0">
    <div v-for="s in stories" :key="s.id" class="timeline-item">
      <div class="timeline-year">
        {{ s.storyYear || '?' }}年
        <template v-if="s.storyMonth">{{ s.storyMonth }}月</template>
      </div>
      <div class="timeline-header">
        <span class="timeline-title">{{ s.title }}</span>
        <span v-if="s.status !== 1" :class="['timeline-status', statusClass(s.status)]">
          {{ statusLabel(s.status) }}
        </span>
      </div>
      <div class="timeline-content">
        <p v-if="s.content">{{ s.content }}</p>
        <p v-if="showMemberLink" style="margin-top:4px;font-size:12px;color:var(--primary)">
          <a href="#" @click.prevent="goToMember(s.memberId)">查看人物详情 &rarr;</a>
        </p>
      </div>
    </div>
  </div>
  <div v-else class="empty-state">
    <h3>暂无事迹</h3>
    <p>还没有已审核的生平事迹</p>
  </div>
</template>

<style scoped>
.timeline-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.timeline-status {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
}
.status-pending {
  background: #fef3c7;
  color: #92400e;
}
.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}
</style>
