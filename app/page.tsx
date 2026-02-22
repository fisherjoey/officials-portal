import Hero from '@/components/content/Hero'
import ElevateCTA from '@/components/ui/ElevateCTA'
import HomeContent from './home-content'
import { orgConfig } from '@/config/organization'

export default function HomePage() {
  return (
    <>
      <Hero
        title={orgConfig.name}
        subtitle={`Join your community's premier ${orgConfig.labels.referee.toLowerCase()} organization`}
        primaryAction={{ text: `Become a ${orgConfig.labels.referee}`, href: '/become-a-referee' }}
        secondaryAction={{ text: 'View Training', href: '/training' }}
        showLogo={true}
      />

      <ElevateCTA />

      <HomeContent />
    </>
  )
}
