<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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

  // 停止旧的 simulation
  if (simulation) { simulation.stop(); simulation = null }

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const graphData = buildGraph()
  const { nodes, parentChildEdges, spouseEdges, nodeMap } = graphData

  if (nodes.length === 0) {
    svg.append('text')
      .attr('x', 300).attr('y', 100)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .text('暂无家族数据')
    return
  }

  const width = 1200
  const nodeHeight = 60
  const nodeWidth = 120
  const rulerWidth = 80
  const rulerStartY = 40

  // ---- 年份数据 ----
  const birthYearMap = new Map<number, number>()
  for (const m of props.members) {
    if (m.birthYear != null) birthYearMap.set(m.id, m.birthYear)
  }

  // ---- 年份推断（图遍历版本） ----
  const estimateCache = new Map<number, number>()

  function estimateYearForNode(node: SimNode): number {
    if (estimateCache.has(node.id)) return estimateCache.get(node.id)!
    if (birthYearMap.has(node.id)) {
      estimateCache.set(node.id, birthYearMap.get(node.id)!)
      return birthYearMap.get(node.id)!
    }

    let minChildYear = Infinity
    for (const edge of parentChildEdges) {
      const sourceId = typeof edge.source === 'number' ? edge.source : edge.source.id
      if (sourceId === node.id) {
        const child = typeof edge.target === 'number' ? nodeMap.get(edge.target) : edge.target
        if (child) {
          const cy = estimateYearForNode(child)
          if (cy < minChildYear) minChildYear = cy
        }
      }
    }
    if (minChildYear < Infinity) {
      const result = minChildYear - 25
      estimateCache.set(node.id, result)
      return result
    }
    const result = 1990 - node.generation * 25
    estimateCache.set(node.id, result)
    return result
  }

  // 收集所有年份确定范围
  const allYears = nodes.map(n => estimateYearForNode(n))
  let minYear = Math.min(...allYears) - 5
  let maxYear = Math.max(...allYears) + 5
  const yearRange = maxYear - minYear

  const yearScale = Math.max(6, Math.min(12, (1200 - rulerStartY - 60) / yearRange))
  const contentHeight = yearRange * yearScale + rulerStartY + 60
  svgHeight.value = contentHeight
  svg.attr('viewBox', `0 0 ${width} ${contentHeight}`)

  function yearToY(year: number): number {
    return rulerStartY + (maxYear - year) * yearScale
  }

  // 预设初始位置：Y 按出生年份，X 随机散开
  const centerX = (width - rulerWidth) / 2 + rulerWidth
  for (const node of nodes) {
    node.x = centerX + (Math.random() - 0.5) * 300
    node.y = yearToY(estimateYearForNode(node))
  }

  // ---- 年份尺子 ----
  const rulerG = svg.append('g').attr('transform', `translate(${rulerWidth - 15}, 0)`)

  rulerG.append('line')
    .attr('x1', 0).attr('y1', yearToY(maxYear + 5))
    .attr('x2', 0).attr('y2', yearToY(minYear - 5))
    .attr('stroke', '#cbd5e1')
    .attr('stroke-width', 1.5)

  const tickStep = yearRange > 100 ? 20 : yearRange > 50 ? 10 : 5
  for (let y = Math.ceil(minYear / tickStep) * tickStep; y <= maxYear; y += tickStep) {
    const py = yearToY(y)
    const isMajor = y % (tickStep * 2) === 0
    rulerG.append('line')
      .attr('x1', 0).attr('y1', py)
      .attr('x2', isMajor ? 12 : 6).attr('y2', py)
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', isMajor ? 1.5 : 0.8)

    svg.append('line')
      .attr('x1', rulerWidth).attr('y1', py)
      .attr('x2', width).attr('y2', py)
      .attr('stroke', isMajor ? '#e2e8f0' : '#f1f5f9')
      .attr('stroke-width', isMajor ? 1 : 0.5)

    if (isMajor) {
      rulerG.append('text')
        .attr('x', 16).attr('y', py)
        .attr('dy', '0.35em')
        .attr('fill', '#64748b')
        .attr('font-size', '11px')
        .attr('font-family', 'monospace')
        .text(String(y))
    }
  }

  // ---- 主图层（可缩放） ----
  const g = svg.append('g').attr('transform', `translate(${rulerWidth - 5}, 0)`)

  // 连线：spouse（先画，在底层）
  if (spouseEdges.length > 0) {
    const spouseLineG = g.append('g').attr('class', 'spouse-links')

    spouseLineG.selectAll('line')
      .data(spouseEdges)
      .enter().append('line')
      .attr('stroke', '#eab308')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '6,3')
      .attr('x1', d => (typeof d.source === 'number' ? 0 : d.source.x!))
      .attr('y1', d => (typeof d.source === 'number' ? 0 : d.source.y!))
      .attr('x2', d => (typeof d.target === 'number' ? 0 : d.target.x!))
      .attr('y2', d => (typeof d.target === 'number' ? 0 : d.target.y!))

    // 配偶连线中点圆点
    spouseLineG.selectAll('circle')
      .data(spouseEdges)
      .enter().append('circle')
      .attr('r', 2.5)
      .attr('fill', '#eab308')
      .attr('cx', d => {
        const sx = typeof d.source === 'number' ? 0 : d.source.x!
        const tx = typeof d.target === 'number' ? 0 : d.target.x!
        return (sx + tx) / 2
      })
      .attr('cy', d => {
        const sy = typeof d.source === 'number' ? 0 : d.source.y!
        const ty = typeof d.target === 'number' ? 0 : d.target.y!
        return (sy + ty) / 2
      })
  }

  // 连线：parent-child
  if (parentChildEdges.length > 0) {
    const pcLineG = g.append('g').attr('class', 'parent-child-links')

    pcLineG.selectAll('line')
      .data(parentChildEdges)
      .enter().append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6)
      .attr('x1', d => (typeof d.source === 'number' ? 0 : d.source.x!))
      .attr('y1', d => (typeof d.source === 'number' ? 0 : d.source.y!))
      .attr('x2', d => (typeof d.target === 'number' ? 0 : d.target.x!))
      .attr('y2', d => (typeof d.target === 'number' ? 0 : d.target.y!))
  }

  // ---- 节点卡片 ----
  const nodeG = g.selectAll('g.member-node')
    .data(nodes)
    .enter().append('g')
    .attr('class', 'member-node')
    .attr('transform', d => `translate(${d.x},${d.y})`)

  nodeG.each(function(d) {
    const el = d3.select(this)
    const card = el.append('g')

    card.append('rect')
      .attr('x', -nodeWidth / 2)
      .attr('y', -nodeHeight / 2)
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('rx', 8)
      .attr('fill', d.gender === 1 ? '#dbeafe' : d.gender === 2 ? '#fce7f3' : '#f1f5f9')
      .attr('stroke', d.gender === 1 ? '#3b82f6' : d.gender === 2 ? '#ec4899' : '#cbd5e1')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('click', (event: MouseEvent) => { handleNodeClick(event, d) })

    card.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#1e293b')
      .attr('font-size', '13px')
      .attr('font-weight', '600')
      .text(d.name)

    // 出生年份
    const yearToShow = d.birthYear ?? estimateYearForNode(d)
    if (yearToShow != null) {
      card.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1.6em')
        .attr('fill', '#94a3b8')
        .attr('font-size', '10px')
        .text(String(yearToShow))
    }
  })

  // ---- Force Simulation ----
  simulation = d3.forceSimulation<SimNode>(nodes)
    .force('parent-link', d3.forceLink<SimNode, SimEdge>(parentChildEdges)
      .id(d => d.id).distance(100).strength(0.4))
    .force('spouse-link', d3.forceLink<SimNode, SimEdge>(spouseEdges)
      .id(d => d.id).distance(80).strength(1.5))
    .force('y', d3.forceY<SimNode>(d => yearToY(estimateYearForNode(d)))
      .strength(1.0))
    .force('x', d3.forceX<SimNode>(centerX).strength(0.02))
    .force('collide', d3.forceCollide<SimNode>(80).strength(1.0))
    .alphaDecay(0.02)
    .on('tick', () => {
      // 更新配偶连线
      g.selectAll('.spouse-links line')
        .attr('x1', d => (typeof d.source === 'number' ? 0 : d.source.x!))
        .attr('y1', d => (typeof d.source === 'number' ? 0 : d.source.y!))
        .attr('x2', d => (typeof d.target === 'number' ? 0 : d.target.x!))
        .attr('y2', d => (typeof d.target === 'number' ? 0 : d.target.y!))

      g.selectAll('.spouse-links circle')
        .attr('cx', d => {
          const sx = typeof d.source === 'number' ? 0 : d.source.x!
          const tx = typeof d.target === 'number' ? 0 : d.target.x!
          return (sx + tx) / 2
        })
        .attr('cy', d => {
          const sy = typeof d.source === 'number' ? 0 : d.source.y!
          const ty = typeof d.target === 'number' ? 0 : d.target.y!
          return (sy + ty) / 2
        })

      // 更新父子连线
      g.selectAll('.parent-child-links line')
        .attr('x1', d => (typeof d.source === 'number' ? 0 : d.source.x!))
        .attr('y1', d => (typeof d.source === 'number' ? 0 : d.source.y!))
        .attr('x2', d => (typeof d.target === 'number' ? 0 : d.target.x!))
        .attr('y2', d => (typeof d.target === 'number' ? 0 : d.target.y!))

      // 更新节点位置
      g.selectAll('g.member-node')
        .attr('transform', d => `translate(${d.x},${d.y})`)
    })

  // Zoom/Pan
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.3, 3])
    .on('zoom', (event) => {
      g.attr('transform', `translate(${event.transform.x + rulerWidth - 5},${event.transform.y}) scale(${event.transform.k})`)
    })

  svg.call(zoom)

  // 节点拖拽
  const drag = d3.drag<SVGGElement, SimNode>()
    .on('start', (event, d) => {
      if (!event.active && simulation) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    })
    .on('drag', (event, d) => {
      d.fx = event.x
      d.fy = event.y
    })
    .on('end', (event, d) => {
      if (!event.active && simulation) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    })

  g.selectAll<SVGGElement, SimNode>('g.member-node').call(drag)
}

onMounted(renderGraph)
watch(() => [props.members, props.relationships], renderGraph, { deep: true })
</script>

<template>
  <div class="family-tree-container">
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
