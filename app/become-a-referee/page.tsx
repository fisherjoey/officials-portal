'use client'

import Hero from '@/components/content/Hero'
import Card from '@/components/ui/Card'
import { IconCheck } from '@tabler/icons-react'
import Link from 'next/link'
import { orgConfig } from '@/config/organization'

export default function BecomeARefereePage() {
  const requirements = [
    'Sign the Membership Agreement',
    'Pay the annual dues',
    'Attend a clinic for your level of experience',
    'Purchase the correct referee uniform',
    'Pass the rules exam on an annual basis'
  ]

  const timeline = [
    { month: 'Pre-Season', activity: `New ${orgConfig.labels.officials} Course - Online classroom sessions begin` },
    { month: 'Early Season', activity: 'On-court training sessions and practical application' },
    { month: 'Season', activity: `Active officiating season - gain experience with ${orgConfig.labels.game.toLowerCase()} assignments` },
    { month: 'Ongoing', activity: 'Continuous training and development opportunities' },
  ]

  const benefits = [
    { title: 'Competitive Pay', description: `Earn competitive rates per ${orgConfig.labels.game.toLowerCase()} depending on level, division, and location.` },
    { title: 'Flexible Schedule', description: `Choose your availability. Work as many or as few ${orgConfig.labels.games.toLowerCase()} as your schedule allows.` },
    { title: 'Stay Active', description: 'Great way to stay physically fit while being involved in the sport you love.' },
    { title: 'Career Advancement', description: 'Clear pathway from youth games to high school, college, and potentially professional levels.' },
    { title: 'Community Impact', description: 'Make a positive difference in young athletes\' lives and help grow the sport in your community.' },
    { title: 'Training & Support', description: `Ongoing education, mentorship programs, and support from experienced ${orgConfig.labels.officials.toLowerCase()}.` },
  ]

  return (
    <>
      <Hero
        title={`Join ${orgConfig.name}`}
        subtitle={`Thank you for your interest in becoming a certified ${orgConfig.labels.official.toLowerCase()}`}
        primaryAction={{ text: 'Apply Now', href: '#application' }}
        secondaryAction={{ text: 'Learn More', href: '#requirements' }}
      />

      {/* About Section */}
      <section className="py-16 bg-gray-50" id="requirements">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card>
              <h2 className="text-2xl font-bold text-brand-secondary mb-6">
                Becoming an Active {orgConfig.shortName} {orgConfig.labels.official}
              </h2>
              <p className="text-gray-700 mb-6">
                In order to become an active {orgConfig.labels.official.toLowerCase()} with {orgConfig.shortName}, you will need to do the following:
              </p>
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <ul className="space-y-3">
                  {requirements.map((req, index) => (
                    <li key={index} className="text-gray-800 font-medium flex items-start">
                      <IconCheck size={20} className="text-brand-primary mr-2 flex-shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <p className="text-gray-700">
                  <strong>Our season typically begins in the fall</strong>, with a New {orgConfig.labels.officials} course that runs online and with on-court sessions. These clinics are vital to anyone new to officiating as they cover the rules and mechanics of officiating and what expectations the association will have of you as a member.
                </p>
                <p className="text-gray-700">
                  This course is geared towards those who have never officiated and is an excellent refresher for those getting back into officiating. The course work is typically both online and with live on-court sessions.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-brand-secondary mb-12">
            Training Timeline
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <Card key={index}>
                  <div className="flex items-start">
                    <div className="w-32 flex-shrink-0">
                      <span className="text-brand-primary font-bold">{item.month}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700">{item.activity}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-brand-secondary text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Become a {orgConfig.shortName} {orgConfig.labels.official}?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                <h3 className="text-xl font-bold text-brand-primary mb-3">{benefit.title}</h3>
                <p className="text-gray-100">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* New Official Program Section */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-brand-secondary mb-4">
              New to Officiating?
            </h2>
            <p className="text-gray-700 mb-6">
              Our {orgConfig.labels.newOfficialProgram} is designed to help new {orgConfig.labels.officials.toLowerCase()} get started. We provide mentorship, training, and support to ensure you have a positive experience.
            </p>
            <Link
              href="/new-officials"
              className="inline-block bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Learn About the {orgConfig.labels.newOfficialProgram}
            </Link>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16 bg-gray-50" id="application">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-brand-secondary mb-4">
            {orgConfig.labels.official} Application Form
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Complete this application to begin your journey as a {orgConfig.shortName} {orgConfig.labels.referee.toLowerCase()}
          </p>
          <div className="max-w-2xl mx-auto">
            <Card>
              {/* Replace this iframe src with your own application form URL */}
              <div className="p-8 text-center bg-gray-100 rounded-lg">
                <p className="text-gray-600 mb-4">
                  Configure your application form URL in the page component or integrate with your preferred form service (Google Forms, Microsoft Forms, Typeform, etc.)
                </p>
                <p className="text-sm text-gray-500">
                  Example: Embed a Google Form, Microsoft Form, or custom application form here.
                </p>
              </div>
            </Card>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Thank you for your interest in joining our organization. We look forward to having you as a member.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Questions? <a href="/contact?category=general" className="text-brand-primary hover:text-brand-secondary">Contact us</a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
