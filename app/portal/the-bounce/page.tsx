import { getAllContent, sortByDate } from '@/lib/content'
import TheBounceClient from './TheBounceClient'

export default function TheBouncePage() {
  const newsletters = sortByDate(getAllContent('newsletters'))
  
  return <TheBounceClient newsletters={newsletters} />
}
