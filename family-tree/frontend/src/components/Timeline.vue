<script setup lang="ts">
import type { FamilyStory } from '@/api/family'
import { useRouter } from 'vue-router'

const router = useRouter()
defineProps<{
  stories: FamilyStory[]
}>()

function goToMember(memberId: number) {
  router.push(`/member/${memberId}`)
}
</script>

<template>
  <div class="timeline" v-if="stories.length > 0">
    <div v-for="s in stories" :key="s.id" class="timeline-item">
      <div class="timeline-year">
        {{ s.storyYear || '?' }}年
        <template v-if="s.storyMonth">{{ s.storyMonth }}月</template>
      </div>
      <div class="timeline-title">{{ s.title }}</div>
      <div class="timeline-content">
        <p v-if="s.content">{{ s.content }}</p>
        <p style="margin-top:4px;font-size:12px;color:var(--primary)">
          <a href="#" @click.prevent="goToMember(s.memberId)">查看人物详情 →</a>
        </p>
      </div>
    </div>
  </div>
  <div v-else class="empty-state">
    <h3>暂无事迹</h3>
    <p>还没有已审核的生平事迹</p>
  </div>
</template>
