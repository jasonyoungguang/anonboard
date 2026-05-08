import { useState, useEffect } from 'react'
import { Menu, X, Brain, ChevronRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { id: 'hero', label: '首页' },
  { id: 'llm-basics', label: '大模型原理' },
  { id: 'vector-db', label: '向量数据库' },
  { id: 'rag-flow', label: 'RAG 流程' },
  { id: 'interactive', label: '交互演示' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
      const sections = navItems.map(item => ({
        id: item.id,
        el: document.getElementById(item.id),
      }))
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = sections[i].el
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(sections[i].id)
          break
        }
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileOpen(false)
  }

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'glass-strong shadow-card' : 'bg-transparent'
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <button
          onClick={() => scrollTo('hero')}
          className="flex items-center gap-2 text-foreground font-semibold text-lg"
        >
          <Brain className="h-6 w-6 text-primary" />
          <span>LLM & RAG</span>
          <span className="text-xs text-muted-foreground font-normal ml-1">技术解析</span>
        </button>
        <a
          href="../../"
          className="ml-2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          title="返回工具门户"
        >
          <ArrowLeft className="h-4 w-4" />
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={cn(
                'px-3 py-2 rounded-md text-sm transition-all duration-200',
                activeSection === item.id
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass-strong shadow-card border-t border-border animate-fade-in">
          <div className="container mx-auto px-6 py-4 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-3 rounded-md text-sm transition-all',
                  activeSection === item.id
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                {item.label}
                <ChevronRight className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
