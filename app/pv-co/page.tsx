import type { CompanyRef, TodoItem } from '@/lib/advisor/types'
import { AdviseList } from '@/components/advise/advise-list'

const four: CompanyRef = { id: '1', name: '4', itemCode: 'iron', workers: 5 }
const limb: CompanyRef = { id: '3', name: 'Limburgse mijnunie', itemCode: 'bread', workers: 3 }
const items: TodoItem[] = [
  { id: 's', kind: 'item', title: 'Switch Iron 4 to oil', titleParts: ['Switch ', four, ' ', { from: 'iron', to: 'oil' }], why: 'w', facts: [{ label: 'Switch cost', value: '5', brief: '5 · 9.00 g', icon: 'concrete' }], gainPerDay: 4.41 },
  { id: 's2', kind: 'item', title: 'Switch Bread Limburgse mijnunie to oil', titleParts: ['Switch ', limb, ' ', { from: 'bread', to: 'oil' }], why: 'w', facts: [{ label: 'x', value: 'x', brief: '+14% per point' }], gainPerDay: 3.21 },
  { id: 'h', kind: 'hire', title: 'Hire', titleParts: ['Hire into the empty slot at ', four], why: 'w', facts: [{ label: 'x', value: 'x', brief: 'lowest wage per point' }], gainPerDay: 2, energy: 10 },
]
export default function Page() {
  return <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8 sm:px-8"><AdviseList result={{ items, skipped: [], energy: { current: 49, cap: 170, regenPerHour: 17, hoursToFull: 7.1 } }} user={{ id: 'x', name: 'Niels' }} /></main>
}
