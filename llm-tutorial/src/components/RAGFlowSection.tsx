import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  MessageSquare,
  Cpu,
  Database,
  Shuffle,
  Sparkles,
  FileText,
  ArrowDown,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { RichText } from '@/components/glossary'

const ragSteps = [
  {
    id: 1,
    icon: MessageSquare,
    title: '用户提问',
    description: '用户以自然语言输入问题',
    detail: '用户向系统提出一个问题，例如："公司最新的报销政策是什么？"。这个问题是一段原始的自然语言文本。',
    tech: '前端接收文本输入，传递给后端 API',
    color: 'bg-glow-blue/8 border-glow-blue/20',
  },
  {
    id: 2,
    icon: Cpu,
    title: '问题向量化',
    description: '将问题文本转为向量表示',
    detail: '调用 {{embedding-model|Embedding 模型}}（如 OpenAI text-embedding-3-small），将用户问题转换为一个高维浮点向量（例如 {{embedding-dimension|1536 维}}）。这个向量编码了问题的{{semantic-space|语义信息}}。',
    tech: 'embedding_model.encode("公司最新的报销政策是什么？") → [0.023, -0.156, ...]',
    color: 'bg-primary/8 border-primary/20',
  },
  {
    id: 3,
    icon: Database,
    title: '向量数据库检索',
    description: '在知识库中查找相关文档',
    detail: '将问题向量作为查询，在向量数据库中执行 {{ann|ANN（近似最近邻）}}搜索。数据库返回与问题语义最相似的 {{top-k|Top-K}} 个文档片段及其{{cosine-similarity|相似度}}分数。',
    tech: 'vector_db.search(query_vector, top_k=5) → [{doc: "报销政策v3...", score: 0.94}, ...]',
    color: 'bg-accent/8 border-accent/20',
  },
  {
    id: 4,
    icon: Shuffle,
    title: '上下文增强（Prompt 构造）',
    description: '将检索结果与原始问题拼接',
    detail: '将检索到的文档片段作为{{context-window|上下文}}信息，与用户的原始问题一起构造一个增强版的 {{prompt-engineering|Prompt}}。这确保 LLM 能基于最新、最相关的知识来回答。',
    tech: 'prompt = f"基于以下信息回答问题：\\n{context}\\n\\n问题：{question}"',
    color: 'bg-glow-purple/8 border-glow-purple/20',
  },
  {
    id: 5,
    icon: Sparkles,
    title: 'LLM 生成回答',
    description: '大模型根据增强上下文生成答案',
    detail: '将增强后的 {{prompt-engineering|Prompt}} 输入大语言模型（如 GPT-4、Claude），模型基于提供的{{context-window|上下文}}信息生成准确、有据可查的回答，大幅减少{{llm-hallucination|幻觉}}问题。',
    tech: 'llm.generate(augmented_prompt) → "根据最新v3版报销政策，差旅费报销上限为..."',
    color: 'bg-glow-cyan/8 border-glow-cyan/20',
  },
]

const advantages = [
  { title: '减少幻觉', desc: '基于真实文档回答，不编造信息（{{grounding|Grounding}}）' },
  { title: '知识实时更新', desc: '更新文档即更新知识，无需重新{{fine-tuning|训练}}' },
  { title: '可溯源', desc: '每个回答都能追溯到原始文档来源' },
  { title: '成本可控', desc: '比{{fine-tuning|微调}}模型更经济，部署更灵活' },
]

export function RAGFlowSection() {
  const [activeStep, setActiveStep] = useState(1)
  const current = ragSteps.find(s => s.id === activeStep)!

  return (
    <section id="rag-flow" className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-dots opacity-20" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="relative container mx-auto px-6">
        {/* Section header */}
        <div className="max-w-3xl mb-16">
          <p className="text-primary text-sm font-medium tracking-widest uppercase mb-3">
            Chapter 03
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            RAG: 检索增强生成
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            <RichText text="{{rag|RAG}}（Retrieval-Augmented Generation）将向量检索与大语言模型结合，让 AI 能基于你的私有知识库提供准确、可溯源的回答。" />
          </p>
        </div>

        {/* Hero image */}
        <div className="relative rounded-xl overflow-hidden mb-16 border border-border">
          <img
            src={import.meta.env.BASE_URL + 'images/rag-pipeline.png'}
            alt="RAG pipeline visualization"
            className="w-full h-48 sm:h-64 object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <h3 className="text-lg font-semibold text-foreground">
              从问题到答案的完整数据流
            </h3>
          </div>
        </div>

        {/* RAG Flow - interactive steps */}
        <div className="grid lg:grid-cols-12 gap-8 mb-16">
          {/* Left: step indicators */}
          <div className="lg:col-span-4 space-y-2">
            {ragSteps.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  'w-full flex items-start gap-4 p-4 rounded-lg border transition-all duration-300 text-left',
                  activeStep === step.id
                    ? cn(step.color, 'shadow-card-hover')
                    : 'border-border bg-card hover:border-border/80'
                )}
              >
                <div className={cn(
                  'p-2 rounded-lg shrink-0 transition-all',
                  activeStep === step.id
                    ? 'gradient-accent'
                    : 'bg-secondary'
                )}>
                  <step.icon className={cn(
                    'h-4 w-4',
                    activeStep === step.id ? 'text-primary-foreground' : 'text-muted-foreground'
                  )} />
                </div>
                <div>
                  <p className={cn(
                    'text-sm font-semibold',
                    activeStep === step.id ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    Step {step.id}: {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Right: detail */}
          <div className="lg:col-span-8">
            <Card className={cn('border', current.color.split(' ')[1])}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg gradient-accent">
                    <current.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle>Step {current.id}: {current.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{current.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-foreground leading-relaxed"><RichText text={current.detail} /></p>
                <div className="code-block p-4">
                  <p className="text-xs text-muted-foreground mb-2">技术实现</p>
                  <p className="text-sm font-mono text-primary break-all">{current.tech}</p>
                </div>
                <div className="flex gap-2">
                  {activeStep > 1 && (
                    <Button variant="outline" size="sm" onClick={() => setActiveStep(activeStep - 1)}>
                      上一步
                    </Button>
                  )}
                  {activeStep < 5 && (
                    <Button variant="glow" size="sm" onClick={() => setActiveStep(activeStep + 1)}>
                      下一步
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Complete flow diagram */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle>RAG 完整架构流程图</CardTitle>
          </CardHeader>
          <CardContent>
            <RAGArchitectureDiagram />
          </CardContent>
        </Card>

        {/* Advantages */}
        <div>
          <h3 className="text-xl font-semibold text-foreground mb-6">RAG 的核心优势</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {advantages.map((adv, i) => (
              <div
                key={i}
                className="p-5 rounded-lg border border-border bg-secondary/50 hover:border-primary/30 hover:shadow-card transition-all duration-300"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-4 w-4 text-primary" />
                  <p className="font-semibold text-foreground text-sm">{adv.title}</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed"><RichText text={adv.desc} /></p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function RAGArchitectureDiagram() {
  const blocks = [
    { label: '知识文档', sub: 'PDF/Word/网页', icon: FileText, group: 'prep' },
    { label: '文本分割', sub: 'Chunk splitting', icon: Shuffle, group: 'prep' },
    { label: 'Embedding', sub: '向量化', icon: Cpu, group: 'prep' },
    { label: '向量数据库', sub: '索引 & 存储', icon: Database, group: 'prep' },
  ]
  const queryBlocks = [
    { label: '用户问题', sub: 'Natural Language', icon: MessageSquare },
    { label: '问题向量化', sub: 'Query Embedding', icon: Cpu },
    { label: '相似度搜索', sub: 'Top-K retrieval', icon: Database },
    { label: 'Prompt 组装', sub: 'Context + Question', icon: Shuffle },
    { label: 'LLM 生成', sub: 'GPT-4 / Claude', icon: Sparkles },
  ]

  return (
    <div className="space-y-8">
      {/* Data preparation pipeline */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">
          数据准备阶段（离线）
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {blocks.map((block, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border bg-secondary/30 hover:border-primary/30 transition-all">
                <block.icon className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">{block.label}</p>
                  <p className="text-[10px] text-muted-foreground">{block.sub}</p>
                </div>
              </div>
              {i < blocks.length - 1 && (
                <svg width="24" height="16" className="shrink-0 hidden sm:block">
                  <line x1="0" y1="8" x2="16" y2="8" className="stroke-primary/40" strokeWidth="2" />
                  <polygon points="16,3 24,8 16,13" className="fill-primary/40" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <ArrowDown className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Query pipeline */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">
          查询阶段（在线）
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {queryBlocks.map((block, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all">
                <block.icon className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">{block.label}</p>
                  <p className="text-[10px] text-muted-foreground">{block.sub}</p>
                </div>
              </div>
              {i < queryBlocks.length - 1 && (
                <svg width="24" height="16" className="shrink-0 hidden sm:block">
                  <line x1="0" y1="8" x2="16" y2="8" className="stroke-accent/40" strokeWidth="2" />
                  <polygon points="16,3 24,8 16,13" className="fill-accent/40" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
