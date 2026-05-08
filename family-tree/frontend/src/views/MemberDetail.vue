<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Timeline from '@/components/Timeline.vue'
import MemberCard from '@/components/MemberCard.vue'
import { getMemberDetail } from '@/api/family'
import type { FamilyMember, FamilyRelationship, FamilyStory } from '@/api/family'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const member = ref<FamilyMember | null>(null)
const relationships = ref<FamilyRelationship[]>([])
const stories = ref<FamilyStory[]>([])

const parentRelationships = computed(() =>
  relationships.value.filter(r => r.relationType === 'parent-child')
)

const spouseRelationships = computed(() =>
  relationships.value.filter(r => r.relationType === 'spouse')
)

function getRelativeMemberId(rel: FamilyRelationship): number {
  return rel.memberAId === member.value?.id ? rel.memberBId : rel.memberAId
}

async function loadData() {
  const id = Number(route.params.id)
  if (!id) {
    router.push('/')
    return
  }

  loading.value = true
  try {
    const res = await getMemberDetail(id)
    member.value = res.data.data?.member || null
    relationships.value = res.data.data?.relationships || []
    stories.value = res.data.data?.stories || []
  } catch (e) {
    console.error('加载成员详情失败:', e)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <nav class="navbar">
    <div class="container">
      <router-link to="/" class="back-portal">← 返回族谱首页</router-link>
      <div class="navbar-brand" v-if="member">{{ member.name }}</div>
    </div>
  </nav>

  <div class="container">
    <div v-if="loading" class="loading">加载中...</div>

    <template v-if="!loading && member">
      <div class="page-header">
        <div class="member-card" style="cursor:default">
          <div class="member-avatar">
            {{ member.name.charAt(0) }}
          </div>
          <div class="member-info">
            <h1 style="font-size:24px">{{ member.name }}</h1>
            <p>
              {{ member.gender === 1 ? '男' : member.gender === 2 ? '女' : '未知' }}
              <template v-if="member.birthYear">
                · {{ member.birthYear }}年生
                <template v-if="member.deathYear">- {{ member.deathYear }}年卒</template>
              </template>
              <template v-if="member.generation">· 第{{ member.generation }}代</template>
            </p>
          </div>
        </div>
      </div>

      <div v-if="member.bio" class="card">
        <p style="color:var(--text-secondary);line-height:1.8">{{ member.bio }}</p>
      </div>

      <!-- 亲属关系 -->
      <div v-if="relationships.length > 0" class="card">
        <h3 class="card-title">亲属关系</h3>
        <div class="grid-2" style="margin-top:12px">
          <div v-for="rel in relationships" :key="rel.id" style="display:flex;align-items:center;gap:8px">
            <router-link :to="`/member/${getRelativeMemberId(rel)}`" style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:8px;background:var(--primary-bg);flex:1">
              <span style="font-size:12px;color:var(--text-secondary)">
                {{ rel.relationType === 'parent-child' ? '亲子' : '配偶' }}
              </span>
              <span style="font-weight:500">查看 →</span>
            </router-link>
          </div>
        </div>
      </div>

      <!-- 生平事迹 -->
      <div style="margin-top:24px">
        <h3 class="card-title" style="margin-bottom:16px">生平事迹</h3>
        <Timeline v-if="stories.length > 0" :stories="stories" />
        <div v-else class="empty-state">
          <h3>暂无事迹记录</h3>
          <p>等待管理员添加或用户提交</p>
        </div>
      </div>
    </template>
  </div>
</template>
