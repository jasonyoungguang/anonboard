import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Layers, Zap, Type, Network, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RichText } from '@/components/glossary'

const concepts = [
  {
    id: 'tokenization',
    icon: Type,
    title: 'Tokenization (分词)',
    subtitle: '文本到数字的桥梁',
    description: '将自然语言文本拆分成更小的单元（{{token|Token}}），并映射为数字 ID，使模型能够处理文本。',
    details: [
      '文本首先被拆分为子词（Subword）单元，如 {{bpe|BPE}} 或 {{wordpiece|WordPiece}} 算法',
      '每个 {{token|Token}} 对应{{vocabulary|词表}}中的唯一 ID，如 "你好" -> [4513, 3465]',
      '特殊 {{token|Token}} 如 [CLS]、[SEP] 用于标记句子边界',
      '中文通常按字/词分割，英文按子词分割',
    ],
    example: {
      input: '"什么是向量数据库？"',
      output: '["什么", "是", "向量", "数据", "库", "？"] -> [2345, 156, 8901, 3456, 789, 12]',
    },
  },
  {
    id: 'embedding',
    icon: Layers,
    title: 'Embedding (嵌入层)',
    subtitle: '从 ID 到语义空间',
    description: '将离散的 {{token|Token}} ID 转换为连续的高维向量表示，捕获词语的{{semantic-space|语义信息}}。',
    details: [
      '每个 {{token|Token}} ID 对应嵌入矩阵中的一行向量（通常 {{embedding-dimension|768 或 1024 维}}）',
      '加上{{positional-encoding|位置编码（Positional Encoding）}}，使模型感知词序',
      '{{vector-embedding|嵌入向量}}在训练过程中不断优化，语义相近的词向量距离更近',
      '这是从离散符号到连续数学空间的关键转换',
    ],
    example: {
      input: 'Token ID: 8901 ("向量")',
      output: '[0.23, -0.15, 0.87, ..., 0.42] (768 维浮点向量)',
    },
  },
  {
    id: 'attention',
    icon: Zap,
    title: 'Self-Attention (自注意力)',
    subtitle: 'Transformer 的核心',
    description: '让每个 {{token|Token}} 动态地"关注"序列中其他所有 {{token|Token}}，捕获上下文依赖关系。',
    details: [
      '通过 {{query-key-value|Query、Key、Value}} 三个矩阵计算注意力权重',
      '公式：Attention(Q,K,V) = {{softmax|softmax}}(QK^T / sqrt(d_k)) * V',
      '{{multi-head-attention|Multi-Head Attention}}：多个注意力头并行计算，捕获不同维度的关系',
      '这就是为什么 {{transformer|Transformer}} 能理解"苹果公司"和"吃苹果"中"苹果"的不同含义',
    ],
    example: {
      input: '"银行的利率很高" 中的 "银行"',
      output: '注意力高度关注 "利率"、"高" -> 判断为金融机构（而非河岸）',
    },
  },
  {
    id: 'ffn',
    icon: Network,
    title: 'FFN & 层堆叠',
    subtitle: '深层理解与生成',
    description: '{{ffn|前馈网络}}进一步变换表示，多层堆叠逐步提取从低级到高级的语义特征。',
    details: [
      '每个 {{transformer|Transformer}} 层包含：{{multi-head-attention|Multi-Head Attention}} + {{ffn|Feed-Forward Network}}',
      '{{ffn|FFN}} 通常使用 {{relu-gelu|ReLU/GELU}} 激活，提供非线性变换能力',
      '{{layer-norm|Layer Normalization}} 和{{residual-connection|残差连接}}保证训练稳定性',
      'GPT-3 有 96 层、175B 参数；通过层层堆叠实现复杂{{inference|推理}}',
    ],
    example: {
      input: '第 1 层：识别词义 -> 第 48 层：理解句法 -> 第 96 层：推理与生成',
      output: '最终输出概率分布，选择下一个最可能的 Token',
    },
  },
]

export function LLMBasicsSection() {
  const [activeConcept, setActiveConcept] = useState(concepts[0].id)
  const active = concepts.find(c => c.id === activeConcept)!

  return (
    <section id="llm-basics" className="relative py-24 sm:py-32">
      <div className="absolute inset-0 bg-dots opacity-20" />
      <div className="relative container mx-auto px-6">
        {/* Section header */}
        <div className="max-w-3xl mb-16">
          <p className="text-primary text-sm font-medium tracking-widest uppercase mb-3">
            Chapter 01
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            大语言模型基础原理
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            <RichText text="大语言模型（LLM）的核心是 {{transformer|Transformer}} 架构。理解从文本输入到{{inference|生成输出}}的完整流程，是掌握 AI 技术的第一步。" />
          </p>
        </div>

        {/* Architecture flow visualization */}
        <div className="flex flex-wrap gap-2 mb-12 justify-center sm:justify-start">
          {concepts.map((concept, i) => (
            <div key={concept.id} className="flex items-center gap-2">
              <button
                onClick={() => setActiveConcept(concept.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 border',
                  activeConcept === concept.id
                    ? 'border-primary/50 bg-primary/10 text-primary glow-sm'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-border/80'
                )}
              >
                <concept.icon className="h-4 w-4" />
                {concept.title.split(' ')[0]}
              </button>
              {i < concepts.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
              )}
            </div>
          ))}
        </div>

        {/* Detail card */}
        <div className="grid lg:grid-cols-5 gap-8">
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-lg gradient-accent">
                  <active.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle>{active.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{active.subtitle}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-foreground leading-relaxed">{active.description}</p>
              <ul className="space-y-3">
                {active.details.map((detail, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span className="leading-relaxed"><RichText text={detail} /></span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Example card */}
          <Card className="lg:col-span-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">实例演示</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="code-block p-4">
                <p className="text-xs text-muted-foreground mb-2">输入</p>
                <p className="text-sm text-primary font-mono break-all">{active.example.input}</p>
              </div>
              <div className="flex justify-center">
                <div className="h-8 w-px bg-gradient-to-b from-primary/50 to-transparent" />
              </div>
              <div className="code-block p-4">
                <p className="text-xs text-muted-foreground mb-2">输出</p>
                <p className="text-sm text-accent font-mono break-all">{active.example.output}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transformer architecture diagram */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Transformer 架构数据流</CardTitle>
          </CardHeader>
          <CardContent>
            <TransformerFlowDiagram />
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function TransformerFlowDiagram() {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-center gap-4 min-w-[700px] py-4">
        {[
          { label: '输入文本', sub: '"什么是RAG？"', color: 'bg-glow-blue/20 border-glow-blue/40' },
          { label: 'Tokenizer', sub: '分词 & ID化', color: 'bg-primary/10 border-primary/30' },
          { label: 'Embedding', sub: '向量映射+位置编码', color: 'bg-primary/10 border-primary/30' },
          { label: 'Self-Attention', sub: 'Q·K·V 注意力计算', color: 'bg-accent/10 border-accent/30' },
          { label: 'FFN', sub: '前馈网络变换', color: 'bg-accent/10 border-accent/30' },
          { label: 'x N 层', sub: '重复 N 次', color: 'bg-secondary border-border' },
          { label: 'Output', sub: 'softmax -> 下一Token', color: 'bg-glow-cyan/20 border-glow-cyan/40' },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-4">
            <div
              className={cn(
                'flex flex-col items-center justify-center p-4 rounded-lg border min-w-[110px] text-center transition-all duration-300 hover:scale-105',
                step.color
              )}
            >
              <p className="text-sm font-semibold text-foreground">{step.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{step.sub}</p>
            </div>
            {i < 6 && (
              <svg width="32" height="16" className="shrink-0">
                <line x1="0" y1="8" x2="24" y2="8" className="stroke-primary/40" strokeWidth="2" />
                <polygon points="24,3 32,8 24,13" className="fill-primary/40" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
