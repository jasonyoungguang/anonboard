import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, RotateCcw, MessageSquare, Cpu, Database, Shuffle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RichText } from '@/components/glossary'

// Simulated knowledge base
const knowledgeBase = [
  {
    id: 1,
    text: '{{transformer|Transformer}} 是一种基于{{self-attention|自注意力机制}}的神经网络架构，由 Vaswani 等人在 2017 年提出。它通过 {{multi-head-attention|Multi-Head Attention}} 并行处理序列中所有位置的信息，解决了 RNN 无法并行化的问题。',
    vector: [0.82, 0.15, 0.93, 0.41],
    topic: 'Transformer架构',
  },
  {
    id: 2,
    text: '向量数据库通过将数据转换为高维向量并建立索引（如 {{hnsw|HNSW}}、{{ivf|IVF}}），实现毫秒级的{{ann|近似最近邻搜索}}。它是 {{rag|RAG}} 系统的核心组件，负责存储和检索知识。',
    vector: [0.91, 0.88, 0.23, 0.67],
    topic: '向量数据库',
  },
  {
    id: 3,
    text: '{{rag|RAG}}（检索增强生成）将信息检索与文本生成结合。用户提问后，系统先从知识库检索相关文档，再将这些文档作为{{context-window|上下文}}输入 LLM，使其生成准确且可溯源的回答。',
    vector: [0.75, 0.62, 0.85, 0.90],
    topic: 'RAG流程',
  },
  {
    id: 4,
    text: '{{self-attention|自注意力机制}}通过 {{query-key-value|Query、Key、Value}} 三个矩阵计算注意力权重。每个 {{token|Token}} 会关注序列中所有其他 {{token|Token}}，权重由 {{softmax|softmax}}(QK^T/sqrt(d_k)) 计算得出。',
    vector: [0.88, 0.20, 0.78, 0.35],
    topic: '注意力机制',
  },
  {
    id: 5,
    text: '{{embedding-model|Embedding 模型}}将文本映射到高维{{semantic-space|向量空间}}。语义相似的文本在向量空间中距离更近，这使得{{cosine-similarity|余弦相似度}}等度量方法可以量化文本间的语义关系。',
    vector: [0.60, 0.75, 0.55, 0.82],
    topic: 'Embedding模型',
  },
]

const presetQuestions = [
  '什么是 Transformer？',
  '向量数据库怎么工作？',
  'RAG 是什么技术？',
  '注意力机制的原理',
]

// Simple similarity based on keyword matching for demo
function simulateSimilarity(query: string, doc: typeof knowledgeBase[0]): number {
  const keywords: Record<string, string[]> = {
    'Transformer': ['transformer', '变换', '架构', 'attention'],
    '向量数据库': ['向量', '数据库', '索引', 'hnsw', '检索'],
    'RAG': ['rag', '检索增强', '增强生成', '知识库'],
    '注意力': ['注意力', 'attention', 'query', 'key', 'value', 'self-attention'],
    'Embedding': ['embedding', '嵌入', '向量空间', '映射'],
  }

  const queryLower = query.toLowerCase()
  let score = 0.3 + Math.random() * 0.15

  for (const [, kws] of Object.entries(keywords)) {
    const queryMatch = kws.some(kw => queryLower.includes(kw))
    const docMatch = kws.some(kw => doc.text.toLowerCase().includes(kw))
    if (queryMatch && docMatch) {
      score += 0.25
    }
  }

  return Math.min(score, 0.98)
}

interface StepState {
  status: 'idle' | 'running' | 'done'
  data?: string
}

export function InteractiveDemo() {
  const [query, setQuery] = useState('')
  const [steps, setSteps] = useState<Record<string, StepState>>({
    input: { status: 'idle' },
    embed: { status: 'idle' },
    search: { status: 'idle' },
    augment: { status: 'idle' },
    generate: { status: 'idle' },
  })
  const [searchResults, setSearchResults] = useState<{ doc: typeof knowledgeBase[0]; score: number }[]>([])
  const [finalAnswer, setFinalAnswer] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  const reset = useCallback(() => {
    setSteps({
      input: { status: 'idle' },
      embed: { status: 'idle' },
      search: { status: 'idle' },
      augment: { status: 'idle' },
      generate: { status: 'idle' },
    })
    setSearchResults([])
    setFinalAnswer('')
    setIsRunning(false)
  }, [])

  const runDemo = useCallback(async () => {
    if (!query.trim()) return
    reset()
    setIsRunning(true)

    // Step 1: Input
    setSteps(s => ({ ...s, input: { status: 'running' } }))
    await delay(600)
    setSteps(s => ({ ...s, input: { status: 'done', data: query } }))

    // Step 2: Embed
    setSteps(s => ({ ...s, embed: { status: 'running' } }))
    await delay(900)
    const fakeVector = `[${(Math.random() * 0.5 + 0.3).toFixed(3)}, ${(Math.random() * 0.5 - 0.2).toFixed(3)}, ${(Math.random() * 0.5 + 0.4).toFixed(3)}, ..., ${(Math.random() * 0.5 + 0.1).toFixed(3)}]`
    setSteps(s => ({ ...s, embed: { status: 'done', data: fakeVector } }))

    // Step 3: Search
    setSteps(s => ({ ...s, search: { status: 'running' } }))
    await delay(1200)
    const results = knowledgeBase
      .map(doc => ({ doc, score: simulateSimilarity(query, doc) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
    setSearchResults(results)
    setSteps(s => ({ ...s, search: { status: 'done', data: `找到 ${results.length} 条相关文档` } }))

    // Step 4: Augment
    setSteps(s => ({ ...s, augment: { status: 'running' } }))
    await delay(800)
    setSteps(s => ({
      ...s,
      augment: {
        status: 'done',
        data: `Prompt = 上下文(${results.length}条文档) + 用户问题`,
      },
    }))

    // Step 5: Generate
    setSteps(s => ({ ...s, generate: { status: 'running' } }))
    await delay(1500)
    const topDoc = results[0]?.doc
    const answer = topDoc
      ? `基于检索到的知识：${topDoc.text.slice(0, 80)}... 综合以上信息，${query.replace('？', '').replace('?', '')}的核心要点如上所述。系统从 ${results.length} 条相关文档中提取了关键信息来生成此回答。`
      : '未找到足够相关的文档来回答此问题。'
    setFinalAnswer(answer)
    setSteps(s => ({ ...s, generate: { status: 'done', data: '回答已生成' } }))
    setIsRunning(false)
  }, [query, reset])

  const stepConfig = [
    { key: 'input', icon: MessageSquare, label: '接收问题' },
    { key: 'embed', icon: Cpu, label: '问题向量化' },
    { key: 'search', icon: Database, label: '向量检索' },
    { key: 'augment', icon: Shuffle, label: '上下文增强' },
    { key: 'generate', icon: Sparkles, label: 'LLM 生成' },
  ]

  return (
    <section id="interactive" className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="relative container mx-auto px-6">
        {/* Section header */}
        <div className="max-w-3xl mb-16">
          <p className="text-primary text-sm font-medium tracking-widest uppercase mb-3">
            Interactive Demo
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            RAG 流程交互演示
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            <RichText text="输入一个问题，观察完整的 {{rag|RAG}} 流程如何逐步执行——从问题{{vector-embedding|向量化}}、向量数据库检索、{{context-window|上下文}}增强到 LLM 最终生成回答。" />
          </p>
        </div>

        {/* Input area */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isRunning && runDemo()}
                  placeholder="输入你的问题，例如：什么是 Transformer？"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all text-sm"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {presetQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuery(q)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 sm:flex-col">
                <Button
                  variant="glow"
                  onClick={runDemo}
                  disabled={isRunning || !query.trim()}
                  className="flex-1 sm:flex-none"
                >
                  <Play className="h-4 w-4 mr-2" />
                  运行
                </Button>
                <Button variant="outline" onClick={() => { reset(); setQuery('') }}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  重置
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline steps */}
        <div className="grid grid-cols-5 gap-2 mb-8">
          {stepConfig.map((step) => {
            const state = steps[step.key]
            return (
              <div
                key={step.key}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border transition-all duration-500',
                  state.status === 'done' && 'border-primary/40 bg-primary/5',
                  state.status === 'running' && 'border-accent/40 bg-accent/5 animate-node-pulse',
                  state.status === 'idle' && 'border-border bg-card'
                )}
              >
                <step.icon className={cn(
                  'h-5 w-5 transition-colors',
                  state.status === 'done' && 'text-primary',
                  state.status === 'running' && 'text-accent',
                  state.status === 'idle' && 'text-muted-foreground'
                )} />
                <p className="text-[10px] sm:text-xs font-medium text-center text-foreground">
                  {step.label}
                </p>
                <div className={cn(
                  'h-1 w-8 rounded-full transition-all duration-300',
                  state.status === 'done' && 'gradient-accent',
                  state.status === 'running' && 'bg-accent/50 animate-pulse',
                  state.status === 'idle' && 'bg-border'
                )} />
              </div>
            )
          })}
        </div>

        {/* Results area */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Search results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                向量检索结果
              </CardTitle>
            </CardHeader>
            <CardContent>
              {searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">运行演示后，检索结果将显示在此处...</p>
              ) : (
                <div className="space-y-3">
                  {searchResults.map(({ doc, score }, i) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-lg border border-border bg-secondary/30 animate-slide-up"
                      style={{ animationDelay: `${i * 150}ms` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {doc.topic}
                        </span>
                        <span className="text-xs font-mono text-accent">
                          相似度: {score.toFixed(3)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <RichText text={doc.text.slice(0, 120)} />...
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generated answer */}
          <Card className={cn(finalAnswer && 'border-primary/30')}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                LLM 生成的回答
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!finalAnswer ? (
                <p className="text-sm text-muted-foreground">运行演示后，AI 生成的回答将显示在此处...</p>
              ) : (
                <div className="animate-slide-up">
                  <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                    <p className="text-sm text-foreground leading-relaxed">{finalAnswer}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    * 这是一个模拟演示，展示 RAG 的完整流程。实际系统中会使用真实的 Embedding 模型和 LLM。
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Step detail log */}
        {Object.values(steps).some(s => s.status !== 'idle') && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">执行日志</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="code-block p-4 space-y-1.5">
                {stepConfig.map((step) => {
                  const state = steps[step.key]
                  if (state.status === 'idle') return null
                  return (
                    <p key={step.key} className="text-xs font-mono">
                      <span className={cn(
                        state.status === 'done' ? 'text-primary' : 'text-accent'
                      )}>
                        [{state.status === 'done' ? 'DONE' : 'RUNNING'}]
                      </span>
                      <span className="text-muted-foreground"> {step.label}</span>
                      {state.data && (
                        <span className="text-foreground/70"> → {state.data}</span>
                      )}
                    </p>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
