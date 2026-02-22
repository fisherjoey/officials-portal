'use client'

import Hero from '@/components/content/Hero'
import ElevateCTA from '@/components/ui/ElevateCTA'
import OSARequestFormWizard from '@/components/forms/OSARequestFormWizard'
import Card from '@/components/ui/Card'
import { IconBallFootball, IconCalendar, IconTrophy, IconCheck } from '@tabler/icons-react'
import { orgConfig } from '@/config/organization'

export default function GetOfficialsPage() {

  return (
    <>
      <Hero
        title={`${orgConfig.shortName} Officiating Services`}
        subtitle={`Request certified ${orgConfig.labels.officials.toLowerCase()} for your ${orgConfig.labels.games.toLowerCase()}, leagues, and tournaments`}
        primaryAction={{ text: `Request ${orgConfig.labels.officials}`, href: '#request-form' }}
      />

      {/* About Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card>
              <h2 className="text-2xl font-bold text-brand-secondary mb-6">
                {orgConfig.shortName} Officiating Services
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  {orgConfig.name} provides professional officiating services for all levels of competition.
                  Our {orgConfig.labels.officials.toLowerCase()} are trained, assessed, and certified to the highest standards.
                </p>
                <p>
                  We are committed to providing quality officiating that ensures fair play and a positive experience
                  for athletes, coaches, and spectators alike.
                </p>
                <div className="bg-blue-50 rounded-lg p-6 mt-6">
                  <h3 className="font-bold text-brand-secondary mb-3">Why Choose {orgConfig.shortName} {orgConfig.labels.officials}?</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <IconCheck size={20} className="text-brand-primary mr-2 flex-shrink-0" />
                      <span>Certified and trained {orgConfig.labels.officials.toLowerCase()}</span>
                    </li>
                    <li className="flex items-start">
                      <IconCheck size={20} className="text-brand-primary mr-2 flex-shrink-0" />
                      <span>Comprehensive insurance coverage</span>
                    </li>
                    <li className="flex items-start">
                      <IconCheck size={20} className="text-brand-primary mr-2 flex-shrink-0" />
                      <span>Professional {orgConfig.labels.game.toLowerCase()} management</span>
                    </li>
                    <li className="flex items-start">
                      <IconCheck size={20} className="text-brand-primary mr-2 flex-shrink-0" />
                      <span>Consistent rule interpretation and application</span>
                    </li>
                    <li className="flex items-start">
                      <IconCheck size={20} className="text-brand-primary mr-2 flex-shrink-0" />
                      <span>Ongoing performance evaluation and development</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Service Types */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-brand-secondary mb-12">
            Our Services
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* TODO: Change the icon to match your sport (IconBallBasketball, IconBallVolleyball, etc.) */}
            <Card>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <IconBallFootball size={48} className="text-brand-primary" />
                </div>
                <h3 className="text-xl font-bold text-brand-secondary mb-3">Exhibition {orgConfig.labels.games}</h3>
                <p className="text-gray-700">
                  Single {orgConfig.labels.games.toLowerCase()} or small sets for tournaments, showcases, or special events
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <IconCalendar size={48} className="text-brand-primary" />
                </div>
                <h3 className="text-xl font-bold text-brand-secondary mb-3">League Coverage</h3>
                <p className="text-gray-700">
                  Complete season coverage for your league with consistent officiating
                </p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <IconTrophy size={48} className="text-brand-primary" />
                </div>
                <h3 className="text-xl font-bold text-brand-secondary mb-3">Tournament Services</h3>
                <p className="text-gray-700">
                  Full officiating services for tournaments of any size with experienced crews
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <ElevateCTA primaryButtonHref="#request-form" />

      {/* Request Form */}
      <section className="py-16 bg-gray-50" id="request-form">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-brand-secondary mb-4">
            Request Officiating Services
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Complete this form to schedule {orgConfig.shortName} {orgConfig.labels.officials.toLowerCase()} for your event
          </p>

          <div className="max-w-3xl mx-auto">
            <OSARequestFormWizard />

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Questions about our services?{' '}
                <a href="/contact?category=scheduling" className="text-brand-primary hover:text-brand-secondary">
                  Contact our scheduling team
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
