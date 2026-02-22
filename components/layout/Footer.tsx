import Link from 'next/link'
import Image from 'next/image'
import { IconBrandFacebook, IconBrandInstagram } from '@tabler/icons-react'
import { orgConfig } from '@/config/organization'

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="container mx-auto px-4 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <Image
                src="/images/logos/logo.png"
                alt={`${orgConfig.shortName} Logo`}
                width={50}
                height={50}
                className="rounded invert sm:w-[60px] sm:h-[60px]"
              />
            </div>
            <p className="text-gray-300 font-semibold text-sm sm:text-base mb-2">{orgConfig.name}</p>
            <Link href="/contact?category=general" className="text-gray-400 hover:text-brand-primary text-xs sm:text-sm transition-colors">Contact Us</Link>
          </div>

          <div>
            <h3 className="text-brand-primary font-bold text-base sm:text-lg mb-3 sm:mb-4">Quick Links</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li><Link href="/become-a-referee" className="text-gray-300 hover:text-brand-primary transition-colors text-sm sm:text-base">Become an {orgConfig.labels.official}</Link></li>
              <li><Link href="/get-officials" className="text-gray-300 hover:text-brand-primary transition-colors text-sm sm:text-base">Book {orgConfig.labels.referees}</Link></li>
              <li><Link href="/about" className="text-gray-300 hover:text-brand-primary transition-colors text-sm sm:text-base">About Us</Link></li>
              <li><Link href="/new-officials" className="text-gray-300 hover:text-brand-primary transition-colors text-sm sm:text-base">{orgConfig.labels.newOfficialProgram}</Link></li>
            </ul>
          </div>

          {orgConfig.affiliations.length > 0 && (
            <div>
              <h3 className="text-brand-primary font-bold text-base sm:text-lg mb-3 sm:mb-4">Affiliations</h3>
              <ul className="space-y-1.5 sm:space-y-2">
                {orgConfig.affiliations.map((affiliation, index) => (
                  <li key={index}>
                    <a
                      href={affiliation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-brand-primary transition-colors text-sm sm:text-base"
                    >
                      {affiliation.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(orgConfig.social.facebook || orgConfig.social.instagram) && (
            <div>
              <h3 className="text-brand-primary font-bold text-base sm:text-lg mb-3 sm:mb-4">Follow Us</h3>
              <div className="flex gap-4">
                {orgConfig.social.facebook && (
                  <a
                    href={orgConfig.social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-brand-primary transition-colors"
                    aria-label="Follow us on Facebook"
                  >
                    <IconBrandFacebook size={28} />
                  </a>
                )}
                {orgConfig.social.instagram && (
                  <a
                    href={orgConfig.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-brand-primary transition-colors"
                    aria-label="Follow us on Instagram"
                  >
                    <IconBrandInstagram size={28} />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-700 pt-4 sm:pt-6 text-center text-gray-400">
          <p className="text-xs sm:text-sm">&copy; {new Date().getFullYear()} {orgConfig.name}. All rights reserved.</p>
          <p className="text-xs text-gray-500 mt-3">
            <a
              href="https://syncedsport.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-gray-300 transition-colors"
            >
              Powered by
              <img
                src="https://syncedsport.com/icon.svg"
                alt="SyncedSport"
                className="h-4 w-4 inline-block"
              />
              <span className="font-medium">SyncedSport</span>
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
