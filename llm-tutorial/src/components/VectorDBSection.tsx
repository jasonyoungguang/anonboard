import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, Search, GitCompare, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RichText } from '@/components/glossary'

const similarityMethods = [
  {
    name: '余弦相似度 (Cosine)',
    formula: 'cos(A, B) = (A·B) / (|A| × |B|)',
    description: '衡量两个向量方向的一致性，忽略长度差异。最常用于文本{{semantic-space|语义}}相似度计算。',
    range: '[-1, 1]，1 表示完全相同方向',
  },
  {
    name: '欧氏距离 (L2)',
    formula: 'd(A, B) = sqrt(sum((Ai - Bi)²))',
    description: '衡量两个向量在{{semantic-space|空间}}中的绝对距离，距离越小越相似。',
    range: '[0, ∞)，0 表示完全相同',
  },
  {
    name: '点积 (Dot Product)',
    formula: 'A·B = sum(Ai × Bi)',
    description: '计算简单高效，同时考虑方向和大小。向量归一化后等价于{{cosine-similarity|余弦相似度}}。',
    range: '(-∞, ∞)，值越大越相似',
  },
]

const vectorDatabases = [
  { name: 'Pinecone', type: '云托管', feature: '全托管服务，开箱即用' },
  { name: 'Milvus', type: '开源', feature: '高性能分布式，支持百亿级向量' },
  { name: 'Weaviate', type: '开源', feature: '内置向量化，GraphQL API' },
  { name: 'Chroma', type: '开源', feature: '轻量级，适合原型开发' },
  { name: 'Qdrant', type: '开源', feature: 'Rust 实现，过滤性能优异' },
  { name: 'pgvector', type: '扩展', feature: 'PostgreSQL 向量扩展，易集成' },
]

export function VectorDBSection() {
  const [activeMethod, setActiveMethod] = useState(0)

  return (
    <section id="vector-db" className="relative py-24 sm:py-32">
      {/* Background effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="relative container mx-auto px-6">
        {/* Section header */}
        <div className="max-w-3xl mb-16">
          <p className="text-primary text-sm font-medium tracking-widest uppercase mb-3">
            Chapter 02
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            向量数据库：语义搜索的基石
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            <RichText text="向量数据库将文本转化为高维向量并进行高效{{cosine-similarity|相似度搜索}}，是实现{{semantic-space|语义理解}}和知识检索的关键基础设施。" />
          </p>
        </div>

        {/* Hero image */}
        <div className="relative rounded-xl overflow-hidden mb-16 border border-border shadow-card">
          <img
            src={import.meta.env.BASE_URL + 'images/vector-space.png'}
            alt="Vector space visualization"
            className="w-full h-64 sm:h-80 object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <h3 className="text-xl font-semibold text-foreground mb-2">什么是向量嵌入？</h3>
            <p className="text-muted-foreground max-w-2xl leading-relaxed">
              <RichText text={'{{vector-embedding|向量嵌入}}（Vector Embedding）将非结构化数据（文本、图片等）映射到高维{{semantic-space|数学空间}}中的一个点。语义相似的内容在这个空间中彼此\u201c靠近\u201d，使得计算机能理解并比较含义。'} />
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader>
              <div className="p-2.5 rounded-lg bg-primary/10 w-fit mb-2">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">1. 数据向量化</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <RichText text="使用 {{embedding-model|Embedding 模型}}（如 OpenAI text-embedding-ada-002、BGE 等）将文本文档转换为固定维度的浮点向量，存入向量数据库并建立索引。" />
              </p>
              <div className="code-block p-3 mt-4">
                <p className="text-xs font-mono text-muted-foreground">
                  <span className="text-primary">"机器学习是AI的子领域"</span>
                  <br />→ [0.12, -0.34, 0.56, ..., 0.78]
                  <br />  <span className="text-accent">(1536 维向量)</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-2.5 rounded-lg bg-accent/10 w-fit mb-2">
                <Search className="h-5 w-5 text-accent" />
              </div>
              <CardTitle className="text-base">2. 相似度搜索</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <RichText text="将用户查询也转换为向量，然后在数据库中通过{{ann|近似最近邻（ANN）}}算法快速找到最相似的向量。常用索引算法包括 {{hnsw|HNSW}}、{{ivf|IVF}} 等。" />
              </p>
              <div className="code-block p-3 mt-4">
                <p className="text-xs font-mono text-muted-foreground">
                  <span className="text-primary">Query: "什么是ML？"</span>
                  <br />→ 找到 Top-K 最近向量
                  <br />  <span className="text-accent">相似度: 0.95, 0.87, 0.82...</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="p-2.5 rounded-lg bg-glow-cyan/10 w-fit mb-2">
                <GitCompare className="h-5 w-5 text-glow-cyan" />
              </div>
              <CardTitle className="text-base">3. 返回结果</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <RichText text="返回与查询最相似的 {{top-k|Top-K}} 文档片段及其元数据。这些检索到的内容将作为{{context-window|上下文}}，增强 LLM 的回答质量。" />
              </p>
              <div className="code-block p-3 mt-4">
                <p className="text-xs font-mono text-muted-foreground">
                  <span className="text-primary">Results:</span>
                  <br />1. "机器学习是AI的子领域..." (0.95)
                  <br />2. "ML算法包括监督学习..." (0.87)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Similarity methods */}
        <Card className="mb-16">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>向量相似度计算方法</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-6">
              {similarityMethods.map((method, i) => (
                <Button
                  key={i}
                  variant={activeMethod === i ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveMethod(i)}
                  className={cn(
                    activeMethod === i && 'gradient-accent'
                  )}
                >
                  {method.name}
                </Button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  <RichText text={similarityMethods[activeMethod].description} />
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground font-medium">取值范围：</span>
                  {similarityMethods[activeMethod].range}
                </p>
              </div>
              <div className="code-block p-4">
                <p className="text-xs text-muted-foreground mb-2">公式</p>
                <p className="text-lg font-mono text-primary">
                  {similarityMethods[activeMethod].formula}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database comparison */}
        <Card>
          <CardHeader>
            <CardTitle>主流向量数据库对比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {vectorDatabases.map((db) => (
                <div
                  key={db.name}
                  className="p-4 rounded-lg border border-border bg-secondary/50 hover:border-primary/30 hover:shadow-card transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-foreground text-sm">{db.name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {db.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{db.feature}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
