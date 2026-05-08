<script setup lang="ts">
import type { FamilyStory } from '@/api/family'

defineProps<{
  story: FamilyStory
}>()
</script>

<template>
  <div class="card">
    <div style="display:flex;justify-content:space-between;align-items:start">
      <h3 class="card-title">{{ story.title }}</h3>
      <span v-if="story.status === 0" class="badge badge-pending">待审核</span>
      <span v-else-if="story.status === 1" class="badge badge-approved">已通过</span>
      <span v-else class="badge badge-rejected">已驳回</span>
    </div>
    <p style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">
      <template v-if="story.storyYear">{{ story.storyYear }}年</template>
      <template v-if="story.category"> · {{ story.category }}</template>
      · 提交人: {{ story.submitterName }}
    </p>
    <p v-if="story.content" style="font-size:14px;color:var(--text)">{{ story.content }}</p>
  </div>
</template>
