'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconX } from '@tabler/icons-react'

// Toggle this to enable/disable the campaign banner site-wide
const CAMPAIGN_ENABLED = false

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

export default function CampaignBanner() {
  const [dismissed, setDismissed] = useState(false)
  const pathname = usePathname()

  // Don't show on the pink whistle page itself
  if (!CAMPAIGN_ENABLED || dismissed || pathname?.startsWith('/pink-whistle')) {
    return null
  }

  return (
    <div className="bg-pink-500 text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-1 sm:py-1.5">
          <div className="flex items-center gap-2 sm:gap-3 flex-1">
            <PinkRibbonIcon className="w-5 h-6 sm:w-6 sm:h-7 flex-shrink-0" />
            <p className="text-sm sm:text-base font-medium">
              <span className="font-bold">Call a Foul on Cancer</span>
              <span className="hidden sm:inline"> — Support Breast Cancer Awareness with our Pink Whistle Campaign</span>
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/pink-whistle"
              className="text-sm sm:text-base font-semibold bg-white text-pink-600 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full hover:bg-pink-100 transition-colors whitespace-nowrap"
            >
              Learn More
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-pink-600 rounded transition-colors"
              aria-label="Dismiss banner"
            >
              <IconX size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
