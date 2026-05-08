import { Navbar } from '@/components/Navbar'
import { HeroSection } from '@/components/HeroSection'
import { LLMBasicsSection } from '@/components/LLMBasicsSection'
import { VectorDBSection } from '@/components/VectorDBSection'
import { RAGFlowSection } from '@/components/RAGFlowSection'
import { InteractiveDemo } from '@/components/InteractiveDemo'
import { Footer } from '@/components/Footer'
import { GlossaryProvider } from '@/components/glossary'
import { TermModalStack } from '@/components/glossary'

function App() {
  return (
    <GlossaryProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main>
          <HeroSection />
          <LLMBasicsSection />
          <VectorDBSection />
          <RAGFlowSection />
          <InteractiveDemo />
        </main>
        <Footer />
      </div>
      <TermModalStack />
    </GlossaryProvider>
  )
}

export default App
