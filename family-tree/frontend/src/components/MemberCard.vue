<script setup lang="ts">
import type { FamilyMember } from '@/api/family'
import { useRouter } from 'vue-router'

const props = defineProps<{
  member: FamilyMember
}>()

const router = useRouter()

function goToDetail() {
  router.push(`/member/${props.member.id}`)
}
</script>

<template>
  <div class="card member-card" @click="goToDetail">
    <div class="member-avatar">
      <img v-if="member.avatarUrl" :src="member.avatarUrl" class="avatar-img" alt="" />
      <span v-else>{{ member.name.charAt(0) }}</span>
    </div>
    <div class="member-info">
      <h3>{{ member.name }}</h3>
      <p>
        {{ member.gender === 1 ? '男' : member.gender === 2 ? '女' : '未知' }}
        <template v-if="member.birthYear"> · {{ member.birthYear }}年生</template>
        <template v-if="member.generation"> · 第{{ member.generation }}代</template>
      </p>
    </div>
  </div>
</template>

<style scoped>
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
