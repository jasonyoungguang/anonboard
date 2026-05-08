<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Timeline from '@/components/Timeline.vue'
import { getMemberDetail, getFamilyTree } from '@/api/family'
import type { FamilyMember, FamilyRelationship, FamilyStory } from '@/api/family'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const member = ref<FamilyMember | null>(null)
const relationships = ref<FamilyRelationship[]>([])
const stories = ref<FamilyStory[]>([])
const allMembers = ref<FamilyMember[]>([])

const memberMap = computed(() => {
  const map = new Map<number, FamilyMember>()
  allMembers.value.forEach(m => map.set(m.id, m))
  return map
})

function getRelativeMemberId(rel: FamilyRelationship): number {
  return rel.memberAId === member.value?.id ? rel.memberBId : rel.memberAId
}

function getRelativeName(rel: FamilyRelationship): string {
  return memberMap.value.get(getRelativeMemberId(rel))?.name || '未知'
}

function getRelativeGender(rel: FamilyRelationship): number {
  return memberMap.value.get(getRelativeMemberId(rel))?.gender || 0
}

function isParent(rel: FamilyRelationship): boolean {
  return rel.relationType === 'parent-child' && rel.memberAId !== member.value?.id
}

function isChild(rel: FamilyRelationship): boolean {
  return rel.relationType === 'parent-child' && rel.memberAId === member.value?.id
}

function getRelationLabel(rel: FamilyRelationship): string {
  if (rel.relationType === 'spouse') return '配偶'
  if (isParent(rel)) return getRelativeGender(rel) === 1 ? '父亲' : '母亲'
  if (isChild(rel)) return getRelativeGender(rel) === 1 ? '儿子' : '女儿'
  return '亲属'
}

async function loadData() {
  const id = Number(route.params.id)
  if (!id || isNaN(id)) {
    router.push('/')
    return
  }

  loading.value = true
  try {
    const [detailRes, treeRes] = await Promise.all([
      getMemberDetail(id),
      getFamilyTree()
    ])
    member.value = detailRes.data.data?.member || null
    relationships.value = detailRes.data.data?.relationships || []
    stories.value = detailRes.data.data?.stories || []
    allMembers.value = treeRes.data.data?.members || []
  } catch (e) {
    console.error('加载成员详情失败:', e)
    member.value = null
    relationships.value = []
    stories.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
watch(() => route.params.id, loadData)
</script>

<template>
  <nav class="navbar">
    <div class="container">
      <router-link to="/" class="back-portal">&larr; 返回族谱首页</router-link>
      <div class="navbar-brand" v-if="member">{{ member.name }}</div>
    </div>
  </nav>

  <div class="container">
    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="!member" class="empty-state">
      <h3>成员不存在</h3>
      <p>该成员可能已被删除</p>
      <router-link to="/" class="btn btn-secondary" style="margin-top:12px;display:inline-block">返回族谱</router-link>
    </div>

    <template v-else>
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
                &middot; {{ member.birthYear }}年生
                <template v-if="member.deathYear"> - {{ member.deathYear }}年卒</template>
              </template>
              <template v-if="member.generation"> &middot; 第{{ member.generation }}代</template>
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
          <router-link
            v-for="rel in relationships"
            :key="rel.id"
            :to="`/member/${getRelativeMemberId(rel)}`"
            class="rel-item"
          >
            <span class="rel-label">{{ getRelationLabel(rel) }}</span>
            <span class="rel-name">{{ getRelativeName(rel) }} &rarr;</span>
          </router-link>
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

<style scoped>
.rel-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--primary-bg, #f1f5f9);
  text-decoration: none;
  transition: background 0.15s;
}
.rel-item:hover {
  background: #e2e8f0;
}
.rel-label {
  font-size: 12px;
  color: var(--text-secondary, #64748b);
  flex-shrink: 0;
}
.rel-name {
  font-weight: 500;
  color: #1e293b;
}
</style>
