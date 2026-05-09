<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import FamilyTree from '@/components/FamilyTree.vue'
import FamilyTreeClassic from '@/components/FamilyTreeClassic.vue'
import Timeline from '@/components/Timeline.vue'
import { getFamilyTree, getAllStories, getStats } from '@/api/family'
import { useAuthStore } from '@/stores/auth'
import type { FamilyMember, FamilyRelationship, FamilyStory, FamilyStats } from '@/api/family'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.isLoggedIn())

const activeTab = ref<'tree' | 'timeline' | 'classic'>('tree')
const loading = ref(true)
const members = ref<FamilyMember[]>([])
const relationships = ref<FamilyRelationship[]>([])
const stories = ref<FamilyStory[]>([])
const stats = ref<FamilyStats | null>(null)

async function loadData() {
  loading.value = true
  try {
    const [treeRes, storiesRes, statsRes] = await Promise.all([
      getFamilyTree(),
      getAllStories(),
      getStats().catch(() => null)
    ])
    members.value = treeRes.data.data?.members || []
    relationships.value = treeRes.data.data?.relationships || []
    stories.value = storiesRes.data.data || []
    if (statsRes) {
      stats.value = statsRes.data.data || null
    }
  } catch (e) {
    console.error('加载数据失败:', e)
  } finally {
    loading.value = false
    lastLoadTime = Date.now()
  }
}

let lastLoadTime = 0
const POLL_INTERVAL = 30000
const MIN_RELOAD_GAP = 5000
let pollTimer: number | null = null

function handleFocus() {
  const now = Date.now()
  if (now - lastLoadTime > MIN_RELOAD_GAP) {
    loadData()
  }
}

onMounted(() => {
  loadData()
  pollTimer = window.setInterval(loadData, POLL_INTERVAL)
  window.addEventListener('focus', handleFocus)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  window.removeEventListener('focus', handleFocus)
})
</script>

<template>
  <nav class="navbar">
    <div class="container">
      <a href="/portal/" class="back-portal">← 返回门户</a>
      <span class="navbar-brand">族谱工具</span>
      <div class="navbar-links">
        <router-link to="/submit-story">提交事迹</router-link>
        <router-link to="/admin/login">管理后台</router-link>
      </div>
    </div>
  </nav>

  <div class="container">
    <div class="page-header">
      <h1>家族族谱</h1>
      <p>浏览家族成员关系与生平事迹</p>
    </div>

    <!-- 统计卡片 -->
    <div v-if="stats" class="grid-2" style="margin-bottom:20px">
      <div class="card" style="text-align:center;padding:16px">
        <div style="font-size:28px;font-weight:700;color:var(--primary)">{{ stats.totalMembers }}</div>
        <div style="font-size:13px;color:var(--text-secondary)">成员总数</div>
      </div>
      <div class="card" style="text-align:center;padding:16px">
        <div style="font-size:28px;font-weight:700;color:#3b82f6">{{ stats.maleCount }}</div>
        <div style="font-size:13px;color:var(--text-secondary)">男性</div>
      </div>
      <div class="card" style="text-align:center;padding:16px">
        <div style="font-size:28px;font-weight:700;color:#ec4899">{{ stats.femaleCount }}</div>
        <div style="font-size:13px;color:var(--text-secondary)">女性</div>
      </div>
      <div class="card" style="text-align:center;padding:16px">
        <div style="font-size:20px;font-weight:700;color:var(--text)">
          <template v-if="stats.minGeneration != null && stats.maxGeneration != null">
            第{{ stats.minGeneration }} - 第{{ stats.maxGeneration }}代
          </template>
          <template v-else>--</template>
        </div>
        <div style="font-size:13px;color:var(--text-secondary)">世代跨度</div>
      </div>
    </div>

    <div class="tabs">
      <button :class="['tab-btn', { active: activeTab === 'tree' }]" @click="activeTab = 'tree'">
        关系网
      </button>
      <button :class="['tab-btn', { active: activeTab === 'classic' }]" @click="activeTab = 'classic'">
        传统族谱
      </button>
      <button :class="['tab-btn', { active: activeTab === 'timeline' }]" @click="activeTab = 'timeline'">
        时间线
      </button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <FamilyTree
      v-if="!loading && activeTab === 'tree'"
      :members="members"
      :relationships="relationships"
      :is-admin="isAdmin"
      @data-changed="loadData"
    />

    <FamilyTreeClassic
      v-if="!loading && activeTab === 'classic'"
      :members="members"
      :relationships="relationships"
      :is-admin="isAdmin"
    />

    <Timeline
      v-if="!loading && activeTab === 'timeline'"
      :stories="stories"
    />
  </div>
</template>
