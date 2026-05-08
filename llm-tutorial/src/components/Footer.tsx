import { Brain, Github } from 'lucide-react'

export function Footer() {
  return (
    <footer className="relative border-t border-border py-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Brain className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">LLM & RAG 技术解析</span>
          </div>
          <p className="text-xs text-muted-foreground">
            一个交互式技术教育网站，帮助你理解大模型和向量数据库的工作原理
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
