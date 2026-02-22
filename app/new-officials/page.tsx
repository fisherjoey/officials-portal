'use client'

import Hero from '@/components/content/Hero'
import Card from '@/components/ui/Card'
import { IconCheck, IconHeart, IconShieldCheck, IconUsers } from '@tabler/icons-react'
import Image from 'next/image'
import { orgConfig } from '@/config/organization'

export default function NewOfficialProgramPage() {
  // TODO: Customize these objectives for your organization's new official program
  const objectives = [
    `Create a safe, supportive, and respectful environment for new ${orgConfig.labels.officials.toLowerCase()}`,
    'Eliminate aggressive behavior from players, coaches, and spectators',
    `Promote professionalism, fair play, and adherence to the rules of ${orgConfig.sport.namePlural}`
  ]

  // TODO: Add your program partners in config/organization.ts under newOfficialProgram.partners
  const partners = orgConfig.newOfficialProgram?.partners || []

  return (
    <>
      <Hero
        title={orgConfig.labels.newOfficialProgram}
        subtitle={orgConfig.newOfficialProgram?.tagline || `Supporting new ${orgConfig.labels.officials.toLowerCase()} in their journey`}
        primaryAction={{ text: `Become a ${orgConfig.labels.referee}`, href: '/become-a-referee' }}
      />

      {/* About Section */}
      <section className="py-16 bg-gray-50" id="about">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-lg">
                {/* TODO: Replace with your organization's new official program image */}
                <Image
                  src="/images/new-official-program.jpg"
                  alt={`New ${orgConfig.labels.official.toLowerCase()} in training`}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-brand-secondary mb-4">
                  {orgConfig.labels.newOfficialProgram}
                </h2>
                <p className="text-gray-700">
                  {orgConfig.newOfficialProgram?.description ||
                    `Our ${orgConfig.labels.newOfficialProgram} is designed to support and encourage new ${orgConfig.labels.officials.toLowerCase()} as they begin their officiating journey.`}
                </p>
              </div>
            </div>

            <Card>
              <div className="space-y-4">
                <p className="text-gray-700">
                  New {orgConfig.labels.officials.toLowerCase()} receive mentorship, training, and support as they develop their skills.
                </p>
                <p className="text-gray-700">
                  The program helps create a supportive environment for {orgConfig.labels.officials.toLowerCase()} who are just starting their journey,
                  encouraging patience and understanding from everyone involved in the {orgConfig.labels.game.toLowerCase()}.
                </p>
                <p className="text-gray-700">
                  This initiative helps retain new {orgConfig.labels.officials.toLowerCase()} by ensuring they have a positive experience
                  as they learn and grow in their officiating career.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Program Objectives */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-brand-secondary mb-12">
            Program Objectives
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="grid gap-6">
              {objectives.map((objective, index) => (
                <Card key={index}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      {index === 0 && <IconShieldCheck size={32} className="text-blue-500" />}
                      {index === 1 && <IconHeart size={32} className="text-brand-primary" />}
                      {index === 2 && <IconUsers size={32} className="text-brand-secondary" />}
                    </div>
                    <p className="text-gray-700 text-lg">{objective}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="py-16 bg-brand-secondary text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why This Program Matters
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <h3 className="text-xl font-bold text-brand-primary mb-3">Retention</h3>
              <p className="text-gray-100">
                New {orgConfig.labels.officials.toLowerCase()} often leave the profession due to negative experiences. A supportive environment helps retain valuable new {orgConfig.labels.officials.toLowerCase()}.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <h3 className="text-xl font-bold text-brand-primary mb-3">Development</h3>
              <p className="text-gray-100">
                When {orgConfig.labels.officials.toLowerCase()} feel supported, they can focus on learning and improving rather than dealing with hostile environments.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
              <h3 className="text-xl font-bold text-brand-primary mb-3">Community</h3>
              <p className="text-gray-100">
                Building a culture of respect benefits everyone - players, coaches, parents, and {orgConfig.labels.officials.toLowerCase()} alike.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Program Partners - Only show if partners are configured */}
      {partners.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-brand-secondary mb-12">
              Program Partners
            </h2>
            <div className="max-w-2xl mx-auto">
              <Card>
                <ul className="space-y-3">
                  {partners.map((partner, index) => (
                    <li key={index} className="flex items-center">
                      <IconCheck size={20} className="text-brand-primary mr-3 flex-shrink-0" />
                      <a
                        href={partner.url}
                        className="text-brand-secondary hover:text-brand-primary transition-colors font-medium"
                        target={partner.url === '/' ? undefined : '_blank'}
                        rel={partner.url === '/' ? undefined : 'noopener noreferrer'}
                      >
                        {partner.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-brand-secondary mb-4">
            Interested in Becoming an {orgConfig.labels.official}?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join our team of {orgConfig.sport.namePlural} {orgConfig.labels.officials.toLowerCase()} and be part of our {orgConfig.labels.newOfficialProgram}.
          </p>
          <a
            href="/become-a-referee"
            className="inline-block bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Apply to Become a {orgConfig.labels.referee}
          </a>
        </div>
      </section>
    </>
  )
}
