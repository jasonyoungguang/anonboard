<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as d3 from 'd3'
import { addRelative, deleteMember } from '@/api/family'
import type { FamilyMember, FamilyRelationship } from '@/api/family'

const props = defineProps<{
  members: FamilyMember[]
  relationships: FamilyRelationship[]
  isAdmin?: boolean
}>()

const emit = defineEmits<{ dataChanged: [] }>()

const router = useRouter()
const svgRef = ref<SVGSVGElement>()
const svgHeight = ref(500)

// ---- 搜索 ----
const searchQuery = ref('')
const showSearchList = ref(false)
const selectedNodeId = ref<number | null>(null)
const searchBoxRef = ref<HTMLElement>()

const searchCandidates = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return props.members
  return props.members.filter(m => m.name.toLowerCase().includes(q))
})

function handleClickOutside(e: MouseEvent) {
  if (searchBoxRef.value && !searchBoxRef.value.contains(e.target as Node)) {
    showSearchList.value = false
  }
}

function selectSearchMember(member: FamilyMember) {
  searchQuery.value = member.name
  showSearchList.value = false
  selectedNodeId.value = member.id
  locateNode(member.id)
}

function clearSearch() {
  searchQuery.value = ''
  showSearchList.value = false
  selectedNodeId.value = null
  // 重新渲染去掉高亮
  renderGraph()
}

// 存储关键引用供搜索定位使用
let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null
let nodePositions = new Map<number, { x: number; y: number }>()

function locateNode(nodeId: number) {
  const pos = nodePositions.get(nodeId)
  if (!pos || !svgRef.value || !zoomBehavior) return
  const svg = d3.select(svgRef.value)
  const w = 1200
  const h = svgHeight.value
  // 计算目标变换：把节点平移到视口中心
  const scale = 1.5
  const tx = w / 2 - pos.x * scale
  const ty = h / 2 - pos.y * scale
  svg.transition().duration(500).call(zoomBehavior.transform, d3.zoomIdentity.translate(tx, ty).scale(scale))
  showSearchList.value = false
}

// ---- 导出 ----
function exportPNG() {
  if (!svgRef.value) return
  const svgEl = svgRef.value
  const svgClone = svgEl.cloneNode(true) as SVGSVGElement
  // 设置白色背景
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  rect.setAttribute('width', '100%')
  rect.setAttribute('height', '100%')
  rect.setAttribute('fill', '#ffffff')
  svgClone.insertBefore(rect, svgClone.firstChild)
  const svgData = new XMLSerializer().serializeToString(svgClone)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const img = new Image()
  img.onload = () => {
    canvas.width = svgEl.viewBox.baseVal.width || 1200
    canvas.height = svgEl.viewBox.baseVal.height || 800
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)
    const a = document.createElement('a')
    a.download = '关系网.png'
    a.href = canvas.toDataURL('image/png')
    a.click()
  }
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData)
}

// 管理模式状态
const menuTarget = ref<SimNode | null>(null)
const showContextMenu = ref(false)
const menuX = ref(0)
const menuY = ref(0)

const showRelativeModal = ref(false)
const relativeType = ref('')
const relativeLabel = ref('')
const relativeForm = ref({ name: '', birthYear: null as number | null, deathYear: null as number | null })
const saving = ref(false)
const deleting = ref(false)
const showDeleteConfirm = ref(false)

async function handleDelete() {
  if (!menuTarget.value) return
  showContextMenu.value = false
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!menuTarget.value) return
  deleting.value = true
  try {
    await deleteMember(menuTarget.value.id)
    showDeleteConfirm.value = false
    menuTarget.value = null
    emit('dataChanged')
  } catch (e) {
    console.error('删除失败:', e)
  } finally {
    deleting.value = false
  }
}

function handleNodeClick(event: MouseEvent, node: SimNode) {
  if (!node.id) return
  if (!props.isAdmin) {
    router.push(`/member/${node.id}`)
    return
  }
  menuTarget.value = node
  menuX.value = event.clientX
  menuY.value = event.clientY
  showContextMenu.value = true
  event.stopPropagation()
}

function openAddRelative(type: string) {
  showContextMenu.value = false
  relativeType.value = type
  const labels: Record<string, string> = { father: '父亲', mother: '母亲', son: '儿子', daughter: '女儿', wife: '妻子', husband: '丈夫' }
  relativeLabel.value = labels[type] || type
  relativeForm.value = { name: '', birthYear: null, deathYear: null }
  showRelativeModal.value = true
}

function closeContextMenu() {
  showContextMenu.value = false
  menuTarget.value = null
}

async function saveRelative() {
  if (!menuTarget.value) return
  saving.value = true
  try {
    await addRelative(menuTarget.value.id, {
      relationType: relativeType.value,
      name: relativeForm.value.name,
      birthYear: relativeForm.value.birthYear ?? undefined,
      deathYear: relativeForm.value.deathYear ?? undefined
    })
    showRelativeModal.value = false
    menuTarget.value = null
    emit('dataChanged')
  } catch (e) {
    console.error('添加亲属失败:', e)
  } finally {
    saving.value = false
  }
}

// ---- 关系网数据模型 ----
interface SimNode extends d3.SimulationNodeDatum {
  id: number
  name: string
  gender: number
  generation: number
  birthYear: number | null
  deathYear: number | null
}

interface SimEdge {
  source: number | SimNode
  target: number | SimNode
  type: 'parent-child' | 'spouse'
}

function buildGraph() {
  const nodeMap = new Map<number, SimNode>()
  const nodes: SimNode[] = []

  for (const m of props.members) {
    const node: SimNode = {
      id: m.id,
      name: m.name,
      gender: m.gender,
      generation: m.generation ?? 0,
      birthYear: m.birthYear ?? null,
      deathYear: m.deathYear ?? null
    }
    nodes.push(node)
    nodeMap.set(m.id, node)
  }

  const parentChildEdges: SimEdge[] = []
  const spouseEdges: SimEdge[] = []

  for (const rel of props.relationships) {
    const source = nodeMap.get(rel.memberAId)
    const target = nodeMap.get(rel.memberBId)
    if (!source || !target) continue

    if (rel.relationType === 'parent-child') {
      parentChildEdges.push({ source, target, type: 'parent-child' })
    } else if (rel.relationType === 'spouse') {
      spouseEdges.push({ source, target, type: 'spouse' })
    }
  }

  return { nodes, parentChildEdges, spouseEdges, nodeMap }
}

// ---- 渲染 ----
let simulation: d3.Simulation<SimNode, SimEdge> | null = null

function renderGraph() {
  if (!svgRef.value) return

  if (simulation) { simulation.stop(); simulation = null }

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const graphData = buildGraph()
  const { nodes, parentChildEdges, spouseEdges } = graphData

  if (nodes.length === 0) {
    svg.append('text')
      .attr('x', 300).attr('y', 100)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .text('暂无家族数据')
    return
  }

  const nodeHeight = 55
  const nodeWidth = 140
  const simWidth = 1600
  const simHeight = 900

  // ---- 纯力导向布局（无年份尺/辈分约束） ----
  const sim = d3.forceSimulation<SimNode>(nodes)
    .force('parent-link', d3.forceLink<SimNode, SimEdge>(parentChildEdges)
      .id(d => d.id).distance(180).strength(0.5))
    .force('spouse-link', d3.forceLink<SimNode, SimEdge>(spouseEdges)
      .id(d => d.id).distance(100).strength(0.7))
    .force('charge', d3.forceManyBody<SimNode>().strength(-500))
    .force('center', d3.forceCenter(simWidth / 2, simHeight / 2).strength(0.3))
    .force('collide', d3.forceCollide<SimNode>(90).strength(1.0))
    .stop()

  for (let i = 0; i < 400; i++) { sim.tick() }
  simulation = sim

  // 锁定位置
  for (const node of nodes) {
    node.fx = node.x
    node.fy = node.y
  }

  // 记录节点位置供搜索定位
  nodePositions.clear()
  for (const node of nodes) {
    nodePositions.set(node.id, { x: node.x!, y: node.y! })
  }

  svgHeight.value = 600
  svg.attr('viewBox', `0 0 ${simWidth} ${simHeight}`)

  // ---- 主图层 ----
  const g = svg.append('g')

  // ---- 连线（用直线区分血缘/非血缘） ----
  const linkG = g.append('g')

  // 配偶连线：黄色虚线
  for (const edge of spouseEdges) {
    const sx = (edge.source as SimNode).x!
    const sy = (edge.source as SimNode).y!
    const tx = (edge.target as SimNode).x!
    const ty = (edge.target as SimNode).y!
    linkG.append('line')
      .attr('x1', sx).attr('y1', sy)
      .attr('x2', tx).attr('y2', ty)
      .attr('stroke', '#eab308')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '6,3')
      .attr('stroke-linecap', 'round')
  }

  // 亲子连线：灰色实线
  for (const edge of parentChildEdges) {
    const sx = (edge.source as SimNode).x!
    const sy = (edge.source as SimNode).y!
    const tx = (edge.target as SimNode).x!
    const ty = (edge.target as SimNode).y!
    linkG.append('line')
      .attr('x1', sx).attr('y1', sy)
      .attr('x2', tx).attr('y2', ty)
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.5)
      .attr('stroke-linecap', 'round')
  }

  // ---- 节点卡片（每人一张，无配偶内嵌） ----
  const nodeG = g.selectAll('g.member-node')
    .data(nodes)
    .enter().append('g')
    .attr('class', 'member-node')
    .attr('transform', d => `translate(${d.x},${d.y})`)

  nodeG.each(function(d) {
    const el = d3.select(this)
    const card = el.append('g')
    const isHighlighted = selectedNodeId.value === d.id
    const halfW = nodeWidth / 2
    const halfH = nodeHeight / 2

    // 高亮外发光
    if (isHighlighted) {
      card.append('rect')
        .attr('x', -halfW - 4)
        .attr('y', -halfH - 4)
        .attr('width', nodeWidth + 8)
        .attr('height', nodeHeight + 8)
        .attr('rx', 10)
        .attr('fill', 'none')
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 3)
    }

    const bgColor = d.gender === 1 ? '#dbeafe'
      : d.gender === 2 ? '#fce7f3' : '#f1f5f9'
    const borderColor = d.gender === 1 ? '#3b82f6'
      : d.gender === 2 ? '#ec4899' : '#cbd5e1'

    card.append('rect')
      .attr('x', -halfW)
      .attr('y', -halfH)
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('rx', 8)
      .attr('fill', isHighlighted ? '#fef3c7' : bgColor)
      .attr('stroke', isHighlighted ? '#f59e0b' : borderColor)
      .attr('stroke-width', isHighlighted ? 2.5 : 1.5)
      .style('cursor', 'pointer')
      .on('click', (event: MouseEvent) => { handleNodeClick(event, d) })

    card.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('fill', '#1e293b')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .text(d.name)

    if (d.birthYear != null) {
      card.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 12)
        .attr('dy', '0.35em')
        .attr('fill', '#94a3b8')
        .attr('font-size', '10px')
        .text(d.deathYear != null ? `${d.birthYear}-${d.deathYear}` : String(d.birthYear))
    }
  })

  // ---- 图例 ----
  const legendG = svg.append('g').attr('transform', `translate(${simWidth - 170}, 12)`)
  legendG.append('rect')
    .attr('width', 155).attr('height', 52)
    .attr('rx', 6).attr('fill', '#ffffff')
    .attr('stroke', '#e2e8f0').attr('stroke-width', 1)

  legendG.append('line')
    .attr('x1', 10).attr('y1', 20).attr('x2', 50).attr('y2', 20)
    .attr('stroke', '#94a3b8').attr('stroke-width', 1.5).attr('stroke-opacity', 0.5)
  legendG.append('text')
    .attr('x', 56).attr('y', 24).attr('fill', '#64748b').attr('font-size', '11px')
    .text('血缘关系')

  legendG.append('line')
    .attr('x1', 10).attr('y1', 40).attr('x2', 50).attr('y2', 40)
    .attr('stroke', '#eab308').attr('stroke-width', 2)
    .attr('stroke-dasharray', '6,3')
  legendG.append('text')
    .attr('x', 56).attr('y', 44).attr('fill', '#64748b').attr('font-size', '11px')
    .text('配偶关系')

  // Zoom/Pan
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.2, 5])
    .on('zoom', (event) => {
      g.attr('transform', event.transform.toString())
    })

  svg.call(zoom)
  zoomBehavior = zoom
}

onMounted(() => {
  renderGraph()
  document.addEventListener('mousedown', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})
// 不使用 deep watch：数据通过 API 返回全新数组引用，shallow 引用变化即可触发重绘
watch(() => [props.members, props.relationships], () => renderGraph())
</script>

<template>
  <div class="family-tree-container">
    <!-- 工具栏 -->
    <div class="graph-toolbar">
      <div ref="searchBoxRef" class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="搜索姓名..."
          @focus="showSearchList = true"
          @keyup.enter="() => { const c = searchCandidates; if (c.length === 1) selectSearchMember(c[0]) }"
        />
        <button v-if="searchQuery" class="search-clear" @click="clearSearch">&times;</button>
        <div v-if="showSearchList && searchCandidates.length > 0" class="search-dropdown">
          <div
            v-for="m in searchCandidates"
            :key="m.id"
            class="search-item"
            @mousedown.prevent="selectSearchMember(m)"
          >
            <span :class="['gender-dot', m.gender === 1 ? 'male' : m.gender === 2 ? 'female' : 'unknown']"></span>
            {{ m.name }}
            <span v-if="m.birthYear" class="search-year">{{ m.birthYear }}</span>
          </div>
        </div>
      </div>
      <button class="tool-btn" title="导出图片" @click="exportPNG">⬇ 导出</button>
    </div>

    <svg ref="svgRef" width="100%" :height="svgHeight + 'px'"></svg>

    <!-- 操作菜单 -->
    <div v-if="showContextMenu" class="ctx-menu-overlay" @click="closeContextMenu">
      <div class="ctx-menu" :style="{ left: menuX + 'px', top: menuY + 'px' }">
        <div class="ctx-menu-header">{{ menuTarget?.name }}</div>
        <button class="ctx-menu-item" @click.stop="router.push(`/member/${menuTarget?.id}`)">
          查看详情
        </button>
        <div class="ctx-menu-divider"></div>
        <button class="ctx-menu-item" @click.stop="openAddRelative('father')">添加父亲</button>
        <button class="ctx-menu-item" @click.stop="openAddRelative('mother')">添加母亲</button>
        <button class="ctx-menu-item" @click.stop="openAddRelative('son')">添加儿子</button>
        <button class="ctx-menu-item" @click.stop="openAddRelative('daughter')">添加女儿</button>
        <div class="ctx-menu-divider"></div>
        <button v-if="menuTarget?.gender === 1" class="ctx-menu-item" @click.stop="openAddRelative('wife')">添加妻子</button>
        <button v-if="menuTarget?.gender === 2" class="ctx-menu-item" @click.stop="openAddRelative('husband')">添加丈夫</button>
        <div class="ctx-menu-divider"></div>
        <button class="ctx-menu-item ctx-menu-item-danger" @click.stop="handleDelete">删除</button>
      </div>
    </div>

    <!-- 删除确认 Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal-content" style="max-width: 360px; text-align: center;">
        <h2 style="margin-bottom: 12px;">确认删除</h2>
        <p style="color: var(--text-secondary); margin-bottom: 8px;">
          确定要删除 <strong>{{ menuTarget?.name }}</strong> 吗？
        </p>
        <p style="color: var(--danger); font-size: 13px; margin-bottom: 20px;">
          此操作不可撤销，相关的所有关系也会同步删除。
        </p>
        <div class="modal-actions" style="justify-content: center;">
          <button class="btn btn-secondary" @click="showDeleteConfirm = false">取消</button>
          <button class="btn btn-danger" :disabled="deleting" @click="confirmDelete">
            {{ deleting ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 添加亲属 Modal -->
    <div v-if="showRelativeModal" class="modal-overlay" @click.self="showRelativeModal = false">
      <div class="modal-content">
        <h2>为 {{ menuTarget?.name }} 添加{{ relativeLabel }}</h2>
        <div class="form-group">
          <label class="form-label">姓名</label>
          <input v-model="relativeForm.name" class="form-input" placeholder="请输入姓名" />
        </div>
        <div class="form-group">
          <label class="form-label">出生年份</label>
          <input v-model.number="relativeForm.birthYear" type="number" class="form-input" placeholder="可选" />
        </div>
        <div class="form-group">
          <label class="form-label">逝世年份</label>
          <input v-model.number="relativeForm.deathYear" type="number" class="form-input" placeholder="留空表示健在" />
        </div>
        <p class="form-hint">辈分和关系将自动确定</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showRelativeModal = false">取消</button>
          <button class="btn btn-primary" :disabled="!relativeForm.name || saving" @click="saveRelative">
            {{ saving ? '保存中...' : '确认' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.graph-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 280px;
}

.search-input {
  width: 100%;
  padding: 6px 28px 6px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  color: #334155;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.search-clear {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 16px;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  max-height: 220px;
  overflow-y: auto;
  margin-top: 2px;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 13px;
  color: #334155;
}

.search-item:hover {
  background: #f1f5f9;
}

.gender-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.gender-dot.male { background: #3b82f6; }
.gender-dot.female { background: #ec4899; }
.gender-dot.unknown { background: #cbd5e1; }

.search-year {
  margin-left: auto;
  font-size: 11px;
  color: #94a3b8;
}

.tool-btn {
  padding: 6px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  color: #334155;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.tool-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.ctx-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.ctx-menu {
  position: fixed;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 150px;
  padding: 4px 0;
  z-index: 1000;
}

.ctx-menu-header {
  padding: 8px 16px;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
}

.ctx-menu-item {
  display: block;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  color: #334155;
}

.ctx-menu-item:hover {
  background: #f1f5f9;
}

.ctx-menu-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 4px 0;
}

.ctx-menu-item-danger {
  color: #ef4444;
}

.ctx-menu-item-danger:hover {
  background: #fef2f2;
}

.form-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-top: -4px;
  margin-bottom: 8px;
}
</style>
