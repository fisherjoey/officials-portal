'use client'

import { useState, useEffect } from 'react'
import Hero from '@/components/content/Hero'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { publicTrainingAPI } from '@/lib/api'
import { IconUserPlus, IconBooks, IconBallBasketball, IconBook, IconTrendingUp, IconUsers, IconRun, IconChecklist, IconUsersGroup, IconPencil, IconCheck, IconVideo, IconFileText, IconSchool } from '@tabler/icons-react'
import { orgConfig } from '@/config/organization'

interface TrainingEvent {
  title: string
  date: string
  startTime: string
  endTime: string
  location: string
  type: 'workshop' | 'certification' | 'refresher' | 'meeting'
  description: string
  registrationLink?: string
  maxParticipants?: number
  currentRegistrations?: number
  instructor?: string
  requirements?: string
  slug: string
}

interface TrainingClientProps {
  trainingEvents?: TrainingEvent[]
}

export default function TrainingClient({ trainingEvents: initialEvents }: TrainingClientProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [trainingEvents, setTrainingEvents] = useState<TrainingEvent[]>(initialEvents || [])
  const [loading, setLoading] = useState(!initialEvents)

  useEffect(() => {
    // If we already have initial data, don't fetch
    if (initialEvents && initialEvents.length > 0) return

    async function fetchEvents() {
      try {
        setLoading(true)
        const events = await publicTrainingAPI.getUpcoming()

        const formatted = events.map(event => ({
          title: event.title,
          date: event.event_date,
          startTime: event.event_time || '9:00 AM',
          endTime: event.event_time ? (
            new Date(new Date(`2000-01-01 ${event.event_time}`).getTime() + 2 * 60 * 60 * 1000)
              .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          ) : '11:00 AM',
          location: event.location || 'TBD',
          type: 'workshop' as const,
          description: event.description,
          registrationLink: event.registration_url,
          instructor: event.instructor,
          slug: event.slug
        }))

        setTrainingEvents(formatted)
      } catch (error) {
        console.error('Failed to load training events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [initialEvents])
  
  // TODO: Customize these certification levels for your sport/organization
  // These are example levels - modify based on your certification program
  const certificationLevels = [
    {
      level: 1,
      name: 'Entry Level Official',
      administrator: orgConfig.certification?.localBodyAcronym || 'Local',
      description: `Foundation level for new ${orgConfig.labels.officials.toLowerCase()}`,
      requirements: [
        'Complete online registration with your organization',
        `Attend New ${orgConfig.labels.officials} Clinic`,
        'Pass basic rules test (60% minimum)',
        `Complete on-${orgConfig.labels.playingArea || 'field'} training session`,
        `Shadow experienced ${orgConfig.labels.officials.toLowerCase()} (minimum 3 ${orgConfig.labels.games.toLowerCase()})`
      ],
      gameLevel: 'Youth recreational leagues, elementary school',
      timeframe: '1-2 months'
    },
    {
      level: 2,
      name: 'Community Level Official',
      administrator: orgConfig.certification?.localBodyAcronym || 'Local',
      description: `Certified for community and school ${orgConfig.sport.namePlural}`,
      requirements: [
        'Minimum 1 year at Level 1',
        'Complete Level 2 online modules',
        'Pass rules exam (70% minimum)',
        `Two successful on-${orgConfig.labels.playingArea || 'field'} evaluations`,
        'Attend regional training clinic'
      ],
      gameLevel: 'Junior high, community leagues, youth competitive',
      timeframe: '6-12 months from Level 1'
    },
    {
      level: 3,
      name: 'Regional Level Official',
      administrator: orgConfig.certification?.localBodyAcronym || 'Local',
      description: `Qualified for high school and club ${orgConfig.sport.namePlural}`,
      requirements: [
        'Minimum 2 years at Level 2',
        'Complete advanced mechanics course',
        'Pass rules exam (80% minimum)',
        'Three successful evaluations at high school level',
        'Attend regional/provincial camp'
      ],
      gameLevel: 'High school varsity, club leagues, junior college',
      timeframe: '1-2 years from Level 2'
    },
    {
      level: 4,
      name: 'National Level Official',
      administrator: orgConfig.certification?.nationalBodyAcronym || 'National',
      description: `Elite level for university and national competitions`,
      requirements: [
        'Minimum 3 years at Level 3',
        'National body recommendation',
        'Pass national certification exam (85% minimum)',
        'Attend national training camp',
        'Multiple evaluations at university level'
      ],
      gameLevel: 'University, national championships',
      timeframe: '2-3 years from Level 3'
    },
    {
      level: 5,
      name: 'International Official',
      administrator: orgConfig.sport.governingBodies?.[0]?.name || 'International',
      description: 'International certification for global competitions',
      requirements: [
        'National level experience',
        'International governing body nomination',
        'Pass international certification exam',
        'Attend international training camp',
        'Meet physical fitness standards'
      ],
      gameLevel: 'International competitions, major championships',
      timeframe: 'By invitation only'
    }
  ]
  
  const pathwaySteps = [
    {
      step: 1,
      title: 'Join Us',
      description: `Register with ${orgConfig.name}`,
      icon: IconUserPlus
    },
    {
      step: 2,
      title: 'Initial Training',
      description: `Complete new ${orgConfig.labels.officials.toLowerCase()} clinic and online modules`,
      icon: IconBooks
    },
    {
      step: 3,
      title: 'Get Experience',
      description: `Officiate ${orgConfig.labels.games.toLowerCase()} at appropriate level for your certification`,
      icon: IconBallBasketball
    },
    {
      step: 4,
      title: 'Continuous Learning',
      description: 'Attend clinics, workshops, and training sessions',
      icon: IconBook
    },
    {
      step: 5,
      title: 'Evaluation & Advancement',
      description: 'Get evaluated and progress through certification levels',
      icon: IconTrendingUp
    }
  ]
  
  const trainingComponents = [
    {
      title: 'In-Class Sessions',
      description: 'Interactive workshops with experienced instructors',
      icon: IconUsers
    },
    {
      title: 'On-Court Practice',
      description: 'Practical training for positioning, signals, and mechanics',
      icon: IconRun
    },
    {
      title: 'Game Evaluations',
      description: 'Performance assessments during live games',
      icon: IconChecklist
    },
    {
      title: 'Mentorship',
      description: 'Guidance from experienced officials',
      icon: IconUsersGroup
    },
    {
      title: 'Rules Testing',
      description: 'Written exams to verify rules knowledge',
      icon: IconPencil
    }
  ]
  
  return (
    <>
      <Hero
        title="Training & Certification Program"
        subtitle={`Your pathway to becoming a certified ${orgConfig.sport.namePlural} ${orgConfig.labels.official.toLowerCase()}`}
      />
      
      {/* Tabs Navigation */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {['overview', 'levels', 'pathway', 'training', 'schedule', 'resources'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-full font-semibold capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-brand-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card>
                <h2 className="text-2xl font-bold text-brand-secondary mb-6">
                  {orgConfig.certification?.programName || 'Officials Certification Program'}
                </h2>
                <div className="space-y-4 text-gray-700">
                  {/* TODO: Customize this description for your sport's certification program */}
                  <p>
                    Our certification program aims to standardize {orgConfig.labels.official.toLowerCase()} development,
                    ensuring consistent quality and professionalism in {orgConfig.sport.namePlural} officiating.
                  </p>
                  <p>
                    As a member of {orgConfig.name}, you&apos;ll progress through
                    a structured certification pathway that develops your skills from entry-level to potentially
                    elite competitions.
                  </p>
                  
                  <div className="bg-blue-50 rounded-lg p-6 mt-6">
                    <h3 className="font-bold text-brand-secondary mb-3">Program Highlights</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <IconCheck size={20} className="text-brand-primary mr-2 flex-shrink-0" />
                        <span>5 certification levels from entry to international</span>
                      </li>
                      <li className="flex items-start">
                        <IconCheck size={20} className="text-brand-primary mr-2 flex-shrink-0" />
                        <span>Comprehensive training combining online and practical components</span>
                      </li>
                      <li className="flex items-start">
                        <IconCheck size={20} className="text-brand-primary mr-2 flex-shrink-0" />
                        <span>Standardized evaluation and progression criteria</span>
                      </li>
                      <li className="flex items-start">
                        <IconCheck size={20} className="text-brand-primary mr-2 flex-shrink-0" />
                        <span>Mentorship and continuous development opportunities</span>
                      </li>
                      <li className="flex items-start">
                        <IconCheck size={20} className="text-brand-primary mr-2 flex-shrink-0" />
                        <span>Recognition across Canada and pathway to international officiating</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-orange-50 border-l-4 border-brand-primary p-4 mt-6">
                    <p className="font-semibold text-gray-800">
                      While certification is not required at the entry level, it becomes mandatory for 
                      intermediate, senior, and elite levels. We strongly encourage all officials to 
                      pursue certification to enhance their skills and advance their officiating career.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      )}
      
      {/* Levels Tab */}
      {activeTab === 'levels' && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-brand-secondary mb-12">
              Certification Levels
            </h2>
            <div className="space-y-6">
              {certificationLevels.map((cert) => (
                <Card key={cert.level}>
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-brand-primary text-white rounded-full flex items-center justify-center text-3xl font-bold">
                        {cert.level}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                        <h3 className="text-xl font-bold text-brand-secondary">
                          Level {cert.level}: {cert.name}
                        </h3>
                      </div>
                      <p className="text-gray-700 mb-4">{cert.description}</p>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-brand-secondary mb-2">Requirements:</h4>
                          <ul className="space-y-1 text-sm text-gray-700">
                            {cert.requirements.map((req, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-brand-primary mr-2">•</span>
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-brand-secondary mb-2">Game Level:</h4>
                          <p className="text-sm text-gray-700 mb-3">{cert.gameLevel}</p>
                          
                          <h4 className="font-semibold text-brand-secondary mb-2">Typical Timeframe:</h4>
                          <p className="text-sm text-gray-700">{cert.timeframe}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* Pathway Tab */}
      {activeTab === 'pathway' && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-brand-secondary mb-12">
              Your Certification Pathway
            </h2>
            
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-5 gap-4 mb-12">
                {pathwaySteps.map((step, index) => (
                  <div key={step.step} className="relative h-full">
                    {index < pathwaySteps.length - 1 && (
                      <div className="hidden md:block absolute top-10 left-1/2 w-full h-0.5 bg-gray-300" />
                    )}
                    <Card className="h-full">
                      <div className="text-center relative z-10 h-full flex flex-col justify-between">
                        <div>
                          <div className="flex justify-center mb-3">
                            <step.icon size={36} className="text-brand-primary" />
                          </div>
                          <h3 className="font-bold text-brand-secondary mb-2">
                            Step {step.step}
                          </h3>
                          <h4 className="text-sm font-semibold mb-2">{step.title}</h4>
                        </div>
                        <p className="text-xs text-gray-600">{step.description}</p>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* Training Tab */}
      {activeTab === 'training' && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-brand-secondary mb-12">
              Training Components
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {trainingComponents.map((component, index) => (
                <Card key={index}>
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <component.icon size={48} className="text-brand-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-brand-secondary mb-2">
                      {component.title}
                    </h3>
                    <p className="text-sm text-gray-700">{component.description}</p>
                  </div>
                </Card>
              ))}
            </div>
            
            <div className="max-w-4xl mx-auto">
              <Card>
                <h3 className="text-xl font-bold text-brand-secondary mb-6">
                  View Training Schedule
                </h3>
                <div className="text-center">
                  <p className="text-gray-600 mb-6">
                    Check out our full training schedule for upcoming workshops, certification sessions, and training events.
                  </p>
                  <button 
                    onClick={() => setActiveTab('schedule')}
                    className="bg-brand-secondary text-white px-6 py-3 rounded-full font-semibold hover:bg-opacity-90 transition-all inline-block mb-6"
                  >
                    View Full Schedule
                  </button>
                  
                  <div className="pt-6 border-t border-gray-200">
                    <p className="text-gray-700 mb-4">
                      Ready to start your officiating journey? Join our today and access all our training programs.
                    </p>
                    <Button 
                      href="/become-a-referee" 
                      size="lg"
                    >
                      Apply to Become an Official
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      )}
      
      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-brand-secondary mb-12">
              Training Schedule 2025
            </h2>
            
            <div className="max-w-5xl mx-auto">
              <div className="grid gap-6">
                <Card>
                  <h3 className="text-xl font-bold text-brand-secondary mb-6">Upcoming Sessions</h3>
                  {trainingEvents.length > 0 ? (
                    <div className="space-y-4">
                      {trainingEvents.slice(0, 10).map((event, index) => {
                        const eventDate = new Date(event.date)
                        const formattedDate = eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        
                        // Determine registration status
                        let statusBadge = null
                        if (event.maxParticipants && event.currentRegistrations !== undefined) {
                          const spotsLeft = event.maxParticipants - event.currentRegistrations
                          if (spotsLeft === 0) {
                            statusBadge = <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">Full</span>
                          } else if (spotsLeft <= 5) {
                            statusBadge = <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">{spotsLeft} Spots Left</span>
                          } else {
                            statusBadge = <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Registration Open</span>
                          }
                        } else {
                          statusBadge = <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Registration Open</span>
                        }
                        
                        const borderColor = event.type === 'certification' ? 'border-brand-primary' : 'border-brand-secondary'
                        
                        return (
                          <div key={index} className={`bg-gray-50 rounded-lg p-4 border-l-4 ${borderColor}`}>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-gray-800">{event.title}</h4>
                              {statusBadge}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              Date: {formattedDate} • {event.startTime} - {event.endTime}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">Location: {event.location}</p>
                            {event.instructor && (
                              <p className="text-sm text-gray-600 mb-1">Instructor: {event.instructor}</p>
                            )}
                            <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                            {event.requirements && (
                              <p className="text-sm text-gray-500 italic mb-2">Prerequisites: {event.requirements}</p>
                            )}
                            {event.registrationLink && (
                              <a 
                                href={event.registrationLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-block mt-2 text-sm text-brand-primary hover:text-brand-secondary font-medium"
                              >
                                Register →
                              </a>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No upcoming training events scheduled.</p>
                      <p className="text-sm mt-2">Check back soon for updates!</p>
                    </div>
                  )}
                </Card>
                
                <Card>
                  <h3 className="text-xl font-bold text-brand-secondary mb-4">Important Dates</h3>
                  <div className="bg-orange-50 border-l-4 border-brand-primary p-4">
                    {/* TODO: Update these dates in config/organization.ts under season */}
                    <ul className="space-y-2 text-sm">
                      <li><strong>Registration Deadline:</strong> {orgConfig.season?.registrationDeadline || 'Contact us'}</li>
                      <li><strong>Season Start:</strong> {orgConfig.season?.seasonStart || 'Contact us'}</li>
                      <li><strong>Mid-Season Evaluations:</strong> {orgConfig.season?.midSeasonEvaluations || 'Contact us'}</li>
                      <li><strong>Championships:</strong> {orgConfig.season?.championshipsMonth || 'Contact us'}</li>
                    </ul>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-brand-secondary mb-12">
              Certification Resources
            </h2>
            
            <div className="max-w-4xl mx-auto space-y-6">
              <Card>
                <h3 className="text-xl font-bold text-brand-secondary mb-4">
                  Important Links
                </h3>
                {/* TODO: Configure governing bodies in config/organization.ts under sport.governingBodies */}
                <div className="space-y-3">
                  {orgConfig.sport.governingBodies && orgConfig.sport.governingBodies.length > 0 ? (
                    orgConfig.sport.governingBodies.map((body, index) => (
                      <a
                        key={index}
                        href={body.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                      >
                        <span className="font-medium text-gray-800">{body.name}</span>
                        <span className="text-brand-primary">→</span>
                      </a>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Configure your sport&apos;s governing bodies in config/organization.ts
                    </p>
                  )}
                </div>
              </Card>
              
              <Card>
                <h3 className="text-xl font-bold text-brand-secondary mb-4">
                  Study Materials
                </h3>
                {/* TODO: Customize these study materials for your sport */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <IconBooks size={20} className="text-brand-primary mr-2" />
                      <h4 className="font-semibold text-gray-800">Rule Books</h4>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• Official Rules</li>
                      <li>• Regional Modifications</li>
                      <li>• Local Interpretations</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <IconVideo size={20} className="text-brand-primary mr-2" />
                      <h4 className="font-semibold text-gray-800">Video Resources</h4>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• Mechanics demonstrations</li>
                      <li>• Game situation analysis</li>
                      <li>• Signal tutorials</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <IconFileText size={20} className="text-brand-primary mr-2" />
                      <h4 className="font-semibold text-gray-800">Practice Tests</h4>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• Sample certification exams</li>
                      <li>• Rules quizzes</li>
                      <li>• Scenario-based questions</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <IconSchool size={20} className="text-brand-primary mr-2" />
                      <h4 className="font-semibold text-gray-800">Study Guides</h4>
                    </div>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• Level-specific materials</li>
                      <li>• Quick reference cards</li>
                      <li>• Case book studies</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="text-center mt-12">
              <h3 className="text-xl font-bold text-brand-secondary mb-4">
                Ready to Start Your Officiating Journey?
              </h3>
              <div className="flex justify-center">
                <Button 
                  href="/become-a-referee" 
                  size="lg"
                >
                  Apply to Join
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}