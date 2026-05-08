import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={import.meta.env.BASE_URL + 'images/hero-neural-network.png'}
          alt="Neural network visualization"
          className="w-full h-full object-cover opacity-15"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid opacity-30" />

      {/* Soft decorative blurs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/5 blur-[120px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center max-w-4xl">
        <div className="animate-slide-up">
          <p className="text-primary text-sm font-medium tracking-widest uppercase mb-6">
            Deep Dive into AI Technology
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6">
            <span className="text-foreground">从原理到实践</span>
            <br />
            <span className="gradient-text">大模型 & RAG 技术解析</span>
          </h1>
          <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            深入理解大语言模型的 Transformer 架构、向量数据库的工作机制，
            以及检索增强生成（RAG）如何让 AI 更智能地回答问题
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="glow"
              size="lg"
              onClick={() => document.getElementById('llm-basics')?.scrollIntoView({ behavior: 'smooth' })}
            >
              开始学习
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('interactive')?.scrollIntoView({ behavior: 'smooth' })}
            >
              交互演示
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <button
            onClick={() => document.getElementById('llm-basics')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronDown className="h-6 w-6" />
          </button>
        </div>
      </div>
    </section>
  )
}
