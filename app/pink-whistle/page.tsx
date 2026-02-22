'use client'

import Hero from '@/components/content/Hero'
import Card from '@/components/ui/Card'
import { IconCheck, IconHeart, IconUsers, IconCoin } from '@tabler/icons-react'
import { orgConfig } from '@/config/organization'

function PinkRibbonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="400 210 620 1050"
      className={className}
      aria-label="Pink ribbon for breast cancer awareness"
    >
      <path style={{fill:'#FF8DB0'}} d="M705.394,325.332c45.9,0,87.417,8.968,117.693,25.321c8.844-32.254,6.615-59.892-6.687-82.289
        l-0.062-0.059l-0.301-0.534c-19.175-31.665-60.531-50.566-110.639-50.566c-50.135,0-91.507,18.917-110.671,50.605
        c-0.016,0.026-0.039,0.06-0.057,0.088l0.002,0.001c0,0-0.03,0.046-0.075,0.113c-0.002,0.003-0.003,0.004-0.005,0.007
        c-13.485,22.46-15.782,50.216-6.891,82.637C617.979,334.301,659.497,325.332,705.394,325.332z"/>
      <path style={{fill:'#FF8DB0'}} d="M618.026,740.203c30.494-49.007,58.263-95.202,82.612-137.436
        c-57.977-100.863-97.328-180.681-116.956-237.24c-8.266-23.821-11.165-45.571-8.709-65.051
        c-9.772,16.828-22.342,39.376-35.866,65.925c-1.21,2.376-2.562,4.923-4.007,7.646c-15.861,29.885-42.409,79.903-17.122,159.208
        C530.891,573.757,564.552,643.376,618.026,740.203z"/>
      <path style={{fill:'#FF8DB0'}} d="M892.819,533.256c25.287-79.306-1.26-129.324-17.121-159.208c-1.446-2.723-2.797-5.27-4.007-7.646
        c-13.529-26.552-26.102-49.099-35.875-65.927c2.457,19.481-0.443,41.231-8.709,65.053
        c-19.771,56.972-59.516,137.486-118.133,239.306l-3.576,6.212l-0.006-0.01c-24.813,42.91-53.07,89.797-84.078,139.501
        c-101.067,162.02-203.003,308.558-216.164,327.403l84.539,166.662c20.454-32.171,118.155-186.48,212.155-345.779
        c33.048-56.011,62.494-107.309,87.522-152.471C844.821,646.326,879.629,574.63,892.819,533.256z"/>
      <path style={{fill:'#FF8DB0'}} d="M793.184,756.473c-23.998,43.15-51.889,91.692-82.994,144.442
        c93.618,158.555,190.553,311.655,210.918,343.685l84.53-166.662C992.637,1059.324,893.021,916.12,793.184,756.473z"/>
    </svg>
  )
}

export default function PinkWhistlePage() {
  // TODO: Customize howItWorks content for your charity campaign
  const howItWorks = [
    {
      icon: IconCoin,
      title: `${orgConfig.labels.officials} Donate`,
      description: `${orgConfig.labels.officials} volunteer to donate one ${orgConfig.labels.game.toLowerCase()} fee during ${orgConfig.charityProgram?.campaignMonth || 'February'} to support the cause.`
    },
    {
      icon: IconUsers,
      title: `${orgConfig.shortName} Contributes`,
      description: `The ${orgConfig.name} contributes a lump sum donation to the charity.`
    },
    {
      icon: IconHeart,
      title: 'Making an Impact',
      description: 'Together, our donations support research, patient support services, and awareness programs.'
    }
  ]

  // TODO: Customize campaign name, tagline, and donation URL in config/organization.ts charityProgram section
  const campaignName = orgConfig.charityProgram?.name || 'Charity Campaign'
  const campaignTagline = orgConfig.charityProgram?.tagline || 'Support our cause'
  const donationUrl = orgConfig.charityProgram?.donationUrl || '#'

  return (
    <>
      <Hero
        title={campaignName}
        subtitle={campaignTagline}
        gradientClass="bg-gradient-to-br from-pink-300 via-pink-500 to-pink-700"
        primaryAction={{ text: 'Donate Now', href: donationUrl }}
        buttonClassName="!bg-white !text-pink-600 hover:!bg-pink-100"
      />

      {/* About Section */}
      <section className="py-16 bg-gray-50" id="about">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
              <div className="flex justify-center">
                <PinkRibbonIcon className="w-48 h-64" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-pink-600 mb-4">
                  {campaignName}
                </h2>
                {/* TODO: Customize this description in config/organization.ts charityProgram.description */}
                <p className="text-gray-700">
                  {orgConfig.charityProgram?.description ||
                    `Every ${orgConfig.charityProgram?.campaignMonth || 'February'}, ${orgConfig.labels.officials.toLowerCase()} join organizations across the ${orgConfig.region?.country || 'country'} in supporting this important cause. Our ${orgConfig.labels.officials.toLowerCase()} wear pink whistles on the ${orgConfig.labels.playingArea} as a visible symbol of support and solidarity.`}
                </p>
              </div>
            </div>

            <Card>
              <div className="space-y-4">
                {/* TODO: Customize campaign details for your organization */}
                <p className="text-gray-700">
                  The {campaignName} brings together our officiating community to make a real difference.
                  {orgConfig.labels.officials} who participate donate one {orgConfig.labels.game.toLowerCase()} fee, and {orgConfig.name} contributes a lump sum donation to the charity.
                </p>
                <p className="text-gray-700">
                  When you see an {orgConfig.labels.official.toLowerCase()} wearing a pink whistle during {orgConfig.charityProgram?.campaignMonth || 'February'}, you&apos;re seeing someone who
                  has chosen to give back and support this important cause.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-pink-600 mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {howItWorks.map((item, index) => (
              <Card key={index}>
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <item.icon size={48} className="text-pink-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">{item.title}</h3>
                  <p className="text-gray-700">{item.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      {/* TODO: Replace these statistics with relevant data for your charity cause */}
      <section className="py-16 bg-pink-600 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why This Matters
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-lg p-6 text-center">
              <h3 className="text-2xl font-bold text-pink-600 mb-3">Stat 1</h3>
              <p className="text-gray-700">
                Add a compelling statistic about your cause
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center">
              <h3 className="text-2xl font-bold text-pink-600 mb-3">Stat 2</h3>
              <p className="text-gray-700">
                Add another impactful statistic
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 text-center">
              <h3 className="text-2xl font-bold text-pink-600 mb-3">Stat 3</h3>
              <p className="text-gray-700">
                Add a third statistic to reinforce the message
              </p>
            </div>
          </div>
          {/* TODO: Add source link for your statistics */}
          <p className="text-center text-sm text-pink-100 mt-8">
            Source: Add your source here
          </p>
        </div>
      </section>

      {/* Get Involved */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-pink-600 mb-12">
            Get Involved
          </h2>
          <div className="max-w-2xl mx-auto">
            <Card>
              <h3 className="text-xl font-bold text-gray-800 mb-4">For {orgConfig.labels.officials}</h3>
              {/* TODO: Customize participation steps for your charity campaign */}
              <ul className="space-y-3">
                <li className="flex items-start">
                  <IconCheck size={20} className="text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Sign up to participate in the {campaignName} through the member portal</span>
                </li>
                <li className="flex items-start">
                  <IconCheck size={20} className="text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Receive your pink whistle to wear during {orgConfig.charityProgram?.campaignMonth || 'February'} {orgConfig.labels.games.toLowerCase()}</span>
                </li>
                <li className="flex items-start">
                  <IconCheck size={20} className="text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Donate one {orgConfig.labels.game.toLowerCase()} fee to support the charity</span>
                </li>
                <li className="flex items-start">
                  <IconCheck size={20} className="text-pink-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Help spread awareness on and off the {orgConfig.labels.playingArea}</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          {/* TODO: Customize the call to action for your charity campaign */}
          <h2 className="text-3xl font-bold text-pink-600 mb-4">
            Support Our Cause
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            You can make a difference by donating directly to our partner charity.
          </p>
          <a
            href={donationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Donate Now
          </a>
        </div>
      </section>
    </>
  )
}
