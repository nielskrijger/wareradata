/* eslint-disable react/no-nested-component-definitions, react/static-components -- throwaway preview page, deleted once a variant is chosen */
import { Drumstick, Heart } from 'lucide-react'

import { heatColor as heat } from '@/lib/utils'

// Temp page: 15 ways to make the Avg Health / Avg Hunger cards more interesting,
// as nicer single cards or combined. Delete once a direction is chosen.
// Proposals 1-7 are single-stat treatments (shown for both health & hunger);
// 8-15 combine the two into one card.

const HEALTH = 78
const HUNGER = 54
const HEALTH_RANK = 94
const HUNGER_RANK = 58
const TOTAL = 180

// ---- card shells matching StatCard ----
function Single({ children }: { children: React.ReactNode }) {
  return <div className="bg-card flex flex-col gap-1 rounded-md border p-3">{children}</div>
}
function Double({ children }: { children: React.ReactNode }) {
  return <div className="bg-card col-span-2 flex flex-col gap-2 rounded-md border p-3">{children}</div>
}
function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium">{children}</span>
}

// A small donut ring via conic-gradient.
function Ring({ pct, size = 44, children }: { pct: number, size?: number, children?: React.ReactNode }) {
  const color = heat(pct)
  return (
    <div
      className="relative grid place-items-center rounded-full"
      style={{ width: size, height: size, background: `conic-gradient(${color} ${pct * 3.6}deg, var(--muted) ${pct * 3.6}deg)` }}
    >
      <div className="bg-card grid place-items-center rounded-full" style={{ width: size - 10, height: size - 10 }}>
        <span className="text-xs font-medium tabular-nums" style={{ color }}>{children}</span>
      </div>
    </div>
  )
}

// A horizontal track bar.
function Bar({ pct, height = 'h-2', track = 'bg-muted' }: { pct: number, height?: string, track?: string }) {
  return (
    <div className={`${track} ${height} w-full overflow-hidden rounded-full`}>
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: heat(pct) }} />
    </div>
  )
}

function RankLine({ rank }: { rank: number }) {
  return (
    <span className="text-muted-foreground text-xs">
      #
      {rank}
      {' of '}
      {TOTAL}
    </span>
  )
}

// ============ 1-7: single-stat treatments (rendered for both) ============

// 1: icon + big % coloured by heat + rank.
function S1({ label, icon, pct, rank }: { label: string, icon: React.ReactNode, pct: number, rank: number }) {
  return (
    <Single>
      <Label>
        <span className="inline-flex items-center gap-1">{icon}{label}</span>
      </Label>
      <span className="text-2xl tabular-nums" style={{ color: heat(pct) }}>
        {pct}
        %
      </span>
      <RankLine rank={rank} />
    </Single>
  )
}

// 2: big % + a thin heat bar beneath (no rank emphasis).
function S2({ label, pct, rank }: { label: string, pct: number, rank: number }) {
  return (
    <Single>
      <Label>{label}</Label>
      <span className="text-2xl tabular-nums">
        {pct}
        %
      </span>
      <Bar pct={pct} height="h-1.5" />
      <RankLine rank={rank} />
    </Single>
  )
}

// 3: donut ring with % inside + label.
function S3({ label, pct, rank }: { label: string, pct: number, rank: number }) {
  return (
    <Single>
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <Ring pct={pct}>
          {pct}
          %
        </Ring>
        <RankLine rank={rank} />
      </div>
    </Single>
  )
}

// 4: vertical "fill" pill that fills bottom-up like a tank.
function S4({ label, pct, rank }: { label: string, pct: number, rank: number }) {
  return (
    <Single>
      <Label>{label}</Label>
      <div className="flex items-end gap-3">
        <div className="bg-muted relative h-10 w-3 overflow-hidden rounded-full">
          <div className="absolute bottom-0 w-full rounded-full" style={{ height: `${pct}%`, backgroundColor: heat(pct) }} />
        </div>
        <div className="flex flex-col">
          <span className="text-xl tabular-nums" style={{ color: heat(pct) }}>
            {pct}
            %
          </span>
          <RankLine rank={rank} />
        </div>
      </div>
    </Single>
  )
}

// 5: segmented battery (10 pips) coloured by fill.
function S5({ label, pct, rank }: { label: string, pct: number, rank: number }) {
  const filled = Math.round(pct / 10)
  return (
    <Single>
      <Label>{label}</Label>
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={`p-${i}`} className="h-3 flex-1 rounded-sm" style={{ backgroundColor: i < filled ? heat(pct) : 'var(--muted)' }} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm tabular-nums" style={{ color: heat(pct) }}>
          {pct}
          %
        </span>
        <RankLine rank={rank} />
      </div>
    </Single>
  )
}

// 6: icon-left, value right, bar full-width bottom.
function S6({ label, icon, pct, rank }: { label: string, icon: React.ReactNode, pct: number, rank: number }) {
  return (
    <Single>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1" style={{ color: heat(pct) }}>{icon}<span className="text-xs font-medium text-foreground">{label}</span></span>
        <span className="text-lg tabular-nums" style={{ color: heat(pct) }}>
          {pct}
          %
        </span>
      </div>
      <Bar pct={pct} />
      <RankLine rank={rank} />
    </Single>
  )
}

// 7: tinted card background by heat, big number.
function S7({ label, pct, rank }: { label: string, pct: number, rank: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border p-3" style={{ backgroundColor: `color-mix(in oklab, ${heat(pct)} 10%, var(--card))`, borderColor: `color-mix(in oklab, ${heat(pct)} 25%, var(--border))` }}>
      <Label>{label}</Label>
      <span className="text-2xl tabular-nums" style={{ color: heat(pct) }}>
        {pct}
        %
      </span>
      <RankLine rank={rank} />
    </div>
  )
}

// ============ 8-15: combined health + hunger ============

function Row({ icon, label, pct }: { icon: React.ReactNode, label: string, pct: number }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="inline-flex w-20 items-center gap-1">{icon}{label}</span>
      <Bar pct={pct} height="h-1.5" />
      <span className="w-10 text-right tabular-nums" style={{ color: heat(pct) }}>
        {pct}
        %
      </span>
    </div>
  )
}

// 8: "Vitals" card — two icon-led bars stacked.
function C8() {
  return (
    <Double>
      <Label>Vitals</Label>
      <div className="flex flex-col gap-1.5">
        <Row icon={<Heart className="size-3.5" />} label="Health" pct={HEALTH} />
        <Row icon={<Drumstick className="size-3.5" />} label="Hunger" pct={HUNGER} />
      </div>
    </Double>
  )
}

// 9: two donut rings side by side.
function C9() {
  return (
    <Double>
      <Label>Vitals</Label>
      <div className="flex justify-around">
        <div className="flex flex-col items-center gap-1">
          <Ring pct={HEALTH}>
            {HEALTH}
            %
          </Ring>
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs"><Heart className="size-3" />Health</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Ring pct={HUNGER}>
            {HUNGER}
            %
          </Ring>
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs"><Drumstick className="size-3" />Hunger</span>
        </div>
      </div>
    </Double>
  )
}

// 10: two big numbers side by side with labels + mini bars.
function C10() {
  const Half = ({ icon, label, pct }: { icon: React.ReactNode, label: string, pct: number }) => (
    <div className="flex flex-1 flex-col gap-1">
      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">{icon}{label}</span>
      <span className="text-2xl tabular-nums" style={{ color: heat(pct) }}>
        {pct}
        %
      </span>
      <Bar pct={pct} height="h-1" />
    </div>
  )
  return (
    <Double>
      <Label>Vitals</Label>
      <div className="flex gap-4">
        <Half icon={<Heart className="size-3" />} label="Health" pct={HEALTH} />
        <Half icon={<Drumstick className="size-3" />} label="Hunger" pct={HUNGER} />
      </div>
    </Double>
  )
}

// 11: stacked dual-bar with the two overlaid as labelled rows, ranks shown.
function C11() {
  const RowR = ({ icon, label, pct, rank }: { icon: React.ReactNode, label: string, pct: number, rank: number }) => (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between text-xs">
        <span className="inline-flex items-center gap-1 font-medium">{icon}{label}</span>
        <span className="tabular-nums" style={{ color: heat(pct) }}>
          {pct}
          %
        </span>
      </div>
      <Bar pct={pct} height="h-1.5" />
      <span className="text-muted-foreground text-[11px]">
        #
        {rank}
        {' of '}
        {TOTAL}
      </span>
    </div>
  )
  return (
    <Double>
      <Label>Vitals</Label>
      <div className="flex flex-col gap-2">
        <RowR icon={<Heart className="size-3" />} label="Health" pct={HEALTH} rank={HEALTH_RANK} />
        <RowR icon={<Drumstick className="size-3" />} label="Hunger" pct={HUNGER} rank={HUNGER_RANK} />
      </div>
    </Double>
  )
}

// 12: single combined "condition" gauge = avg of the two, with breakdown beneath.
function C12() {
  const avg = Math.round((HEALTH + HUNGER) / 2)
  return (
    <Double>
      <Label>Condition</Label>
      <div className="flex items-center gap-3">
        <span className="text-3xl tabular-nums" style={{ color: heat(avg) }}>
          {avg}
          %
        </span>
        <div className="flex flex-1 flex-col gap-1 text-xs">
          <Row icon={<Heart className="size-3" />} label="Health" pct={HEALTH} />
          <Row icon={<Drumstick className="size-3" />} label="Hunger" pct={HUNGER} />
        </div>
      </div>
    </Double>
  )
}

// 13: two vertical tanks side by side.
function C13() {
  const Tank = ({ icon, label, pct }: { icon: React.ReactNode, label: string, pct: number }) => (
    <div className="flex flex-col items-center gap-1">
      <div className="bg-muted relative h-12 w-4 overflow-hidden rounded-full">
        <div className="absolute bottom-0 w-full rounded-full" style={{ height: `${pct}%`, backgroundColor: heat(pct) }} />
      </div>
      <span className="text-xs tabular-nums" style={{ color: heat(pct) }}>
        {pct}
        %
      </span>
      <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">{icon}{label}</span>
    </div>
  )
  return (
    <Double>
      <Label>Vitals</Label>
      <div className="flex justify-around">
        <Tank icon={<Heart className="size-3" />} label="Health" pct={HEALTH} />
        <Tank icon={<Drumstick className="size-3" />} label="Hunger" pct={HUNGER} />
      </div>
    </Double>
  )
}

// 14: two segmented batteries stacked.
function C14() {
  const Batt = ({ icon, label, pct }: { icon: React.ReactNode, label: string, pct: number }) => {
    const filled = Math.round(pct / 10)
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex w-20 items-center gap-1 text-sm">{icon}{label}</span>
        <div className="flex flex-1 gap-0.5">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={`b-${i}`} className="h-3 flex-1 rounded-sm" style={{ backgroundColor: i < filled ? heat(pct) : 'var(--muted)' }} />
          ))}
        </div>
        <span className="w-10 text-right text-sm tabular-nums" style={{ color: heat(pct) }}>
          {pct}
          %
        </span>
      </div>
    )
  }
  return (
    <Double>
      <Label>Vitals</Label>
      <div className="flex flex-col gap-1.5">
        <Batt icon={<Heart className="size-3.5" />} label="Health" pct={HEALTH} />
        <Batt icon={<Drumstick className="size-3.5" />} label="Hunger" pct={HUNGER} />
      </div>
    </Double>
  )
}

// 15: compact two-line with inline icon, value, bar in one row each (tightest).
function C15() {
  const Line = ({ icon, pct }: { icon: React.ReactNode, pct: number }) => (
    <div className="flex items-center gap-2">
      <span style={{ color: heat(pct) }}>{icon}</span>
      <Bar pct={pct} height="h-2" />
      <span className="w-10 text-right text-sm tabular-nums" style={{ color: heat(pct) }}>
        {pct}
        %
      </span>
    </div>
  )
  return (
    <Double>
      <Label>Health &amp; hunger</Label>
      <div className="flex flex-col gap-2">
        <Line icon={<Heart className="size-4" />} pct={HEALTH} />
        <Line icon={<Drumstick className="size-4" />} pct={HUNGER} />
      </div>
    </Double>
  )
}

// 16: heat-tinted card (from #7) holding the #6 icon-row + bar contents for
// both health and hunger. Tint blends the two values so the card itself signals
// overall condition.
function VitalRow({ icon, label, pct, rank }: { icon: React.ReactNode, label: string, pct: number, rank: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1" style={{ color: heat(pct) }}>{icon}<span className="text-foreground text-xs font-medium">{label}</span></span>
        <span className="text-2xl tabular-nums" style={{ color: heat(pct) }}>
          {pct}
          %
        </span>
      </div>
      <Bar pct={pct} height="h-1.5" />
      <RankLine rank={rank} />
    </div>
  )
}

function C16() {
  const avg = Math.round((HEALTH + HUNGER) / 2)
  return (
    <div
      className="col-span-2 flex flex-col gap-2 rounded-md border p-3"
      style={{ backgroundColor: `color-mix(in oklab, ${heat(avg)} 10%, var(--card))`, borderColor: `color-mix(in oklab, ${heat(avg)} 25%, var(--border))` }}
    >
      <Label>Vitals</Label>
      <div className="flex flex-col gap-2">
        <VitalRow icon={<Heart className="size-3.5" />} label="Health" pct={HEALTH} rank={HEALTH_RANK} />
        <VitalRow icon={<Drumstick className="size-3.5" />} label="Hunger" pct={HUNGER} rank={HUNGER_RANK} />
      </div>
    </div>
  )
}

// 17: same heat-tinted + icon-row treatment as #16, but one stat per card (two
// separate single-width cards), each tinted by its own value.
function S17({ icon, label, pct, rank }: { icon: React.ReactNode, label: string, pct: number, rank: number }) {
  return (
    <div
      className="flex flex-col gap-1 rounded-md border p-3"
      style={{ backgroundColor: `color-mix(in oklab, ${heat(pct)} 10%, var(--card))`, borderColor: `color-mix(in oklab, ${heat(pct)} 25%, var(--border))` }}
    >
      <VitalRow icon={icon} label={label} pct={pct} rank={rank} />
    </div>
  )
}

const TINT = (pct: number) => ({ backgroundColor: `color-mix(in oklab, ${heat(pct)} 10%, var(--card))`, borderColor: `color-mix(in oklab, ${heat(pct)} 25%, var(--border))` })

// 18: label+icon vertically centred against the big %, so the baseline matches.
function S18({ icon, label, pct, rank }: { icon: React.ReactNode, label: string, pct: number, rank: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border p-3" style={TINT(pct)}>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1" style={{ color: heat(pct) }}>{icon}<span className="text-foreground text-sm font-medium">{label}</span></span>
        <span className="text-2xl leading-none tabular-nums" style={{ color: heat(pct) }}>
          {pct}
          %
        </span>
      </div>
      <Bar pct={pct} height="h-1.5" />
      <RankLine rank={rank} />
    </div>
  )
}

// 19: conventional StatCard hierarchy — small caption label on top, big % below.
function S19({ icon, label, pct, rank }: { icon: React.ReactNode, label: string, pct: number, rank: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border p-3" style={TINT(pct)}>
      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs font-medium">{icon}{label}</span>
      <span className="text-2xl tabular-nums" style={{ color: heat(pct) }}>
        {pct}
        %
      </span>
      <Bar pct={pct} height="h-1.5" />
      <RankLine rank={rank} />
    </div>
  )
}

// 20: big % and big label both on the headline row (label medium-weight so it
// carries next to the number); bar + rank below.
function S20({ icon, label, pct, rank }: { icon: React.ReactNode, label: string, pct: number, rank: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border p-3" style={TINT(pct)}>
      <div className="flex items-baseline justify-between">
        <span className="inline-flex items-center gap-1 text-base font-medium" style={{ color: heat(pct) }}>{icon}{label}</span>
        <span className="text-2xl tabular-nums" style={{ color: heat(pct) }}>
          {pct}
          %
        </span>
      </div>
      <Bar pct={pct} height="h-1.5" />
      <RankLine rank={rank} />
    </div>
  )
}

const SINGLES: { name: string, note: string, render: () => React.ReactNode }[] = [
  { name: '1 · Icon + heat number', note: 'Icon-led label, big % coloured by value, rank below.', render: () => <><S1 label="Avg Health" icon={<Heart className="size-3.5" style={{ color: heat(HEALTH) }} />} pct={HEALTH} rank={HEALTH_RANK} /><S1 label="Avg Hunger" icon={<Drumstick className="size-3.5" style={{ color: heat(HUNGER) }} />} pct={HUNGER} rank={HUNGER_RANK} /></> },
  { name: '2 · Number + thin bar', note: 'Big %, a thin heat bar beneath, rank.', render: () => <><S2 label="Avg Health" pct={HEALTH} rank={HEALTH_RANK} /><S2 label="Avg Hunger" pct={HUNGER} rank={HUNGER_RANK} /></> },
  { name: '3 · Donut ring', note: 'Ring with % inside, rank beside.', render: () => <><S3 label="Avg Health" pct={HEALTH} rank={HEALTH_RANK} /><S3 label="Avg Hunger" pct={HUNGER} rank={HUNGER_RANK} /></> },
  { name: '4 · Vertical tank', note: 'A small tank that fills bottom-up + value & rank.', render: () => <><S4 label="Avg Health" pct={HEALTH} rank={HEALTH_RANK} /><S4 label="Avg Hunger" pct={HUNGER} rank={HUNGER_RANK} /></> },
  { name: '5 · Segmented battery', note: '10 pips fill by value, % + rank below.', render: () => <><S5 label="Avg Health" pct={HEALTH} rank={HEALTH_RANK} /><S5 label="Avg Hunger" pct={HUNGER} rank={HUNGER_RANK} /></> },
  { name: '6 · Icon row + bar', note: 'Icon+label left, % right, full-width bar.', render: () => <><S6 label="Avg Health" icon={<Heart className="size-3.5" />} pct={HEALTH} rank={HEALTH_RANK} /><S6 label="Avg Hunger" icon={<Drumstick className="size-3.5" />} pct={HUNGER} rank={HUNGER_RANK} /></> },
  { name: '7 · Heat-tinted card', note: 'Whole card tinted by the value.', render: () => <><S7 label="Avg Health" pct={HEALTH} rank={HEALTH_RANK} /><S7 label="Avg Hunger" pct={HUNGER} rank={HUNGER_RANK} /></> },
]

const COMBINED: { name: string, note: string, render: () => React.ReactNode }[] = [
  { name: '8 · Vitals: two icon bars', note: 'One card, two icon-led bars (health/hunger).', render: () => <C8 /> },
  { name: '9 · Two donut rings', note: 'Side-by-side rings under one "Vitals" card.', render: () => <C9 /> },
  { name: '10 · Two big numbers', note: 'Two big %s split across the card with mini bars.', render: () => <C10 /> },
  { name: '11 · Two bars + ranks', note: 'Each stat: label, %, bar, and its rank line.', render: () => <C11 /> },
  { name: '12 · Condition score', note: 'One combined avg number + the two as a small breakdown.', render: () => <C12 /> },
  { name: '13 · Two vertical tanks', note: 'Side-by-side fill tanks.', render: () => <C13 /> },
  { name: '14 · Two batteries', note: 'Two segmented battery rows.', render: () => <C14 /> },
  { name: '15 · Compact icon lines', note: 'Tightest: icon + bar + % per row, no text labels.', render: () => <C15 /> },
  { name: '16 · Heat-tinted + icon rows', note: 'Card #7 tint (blended by both values) holding #6 icon-row + bar contents for health & hunger.', render: () => <C16 /> },
  { name: '17 · Two heat-tinted cards', note: 'Same treatment as #16 but split into two single-width cards, each tinted by its own value.', render: () => <><S17 icon={<Heart className="size-3.5" />} label="Health" pct={HEALTH} rank={HEALTH_RANK} /><S17 icon={<Drumstick className="size-3.5" />} label="Hunger" pct={HUNGER} rank={HUNGER_RANK} /></> },
  { name: '18 · Centred label vs big %', note: 'Label+icon vertically centred against the big %, slightly larger label so the row balances.', render: () => <><S18 icon={<Heart className="size-3.5" />} label="Health" pct={HEALTH} rank={HEALTH_RANK} /><S18 icon={<Drumstick className="size-3.5" />} label="Hunger" pct={HUNGER} rank={HUNGER_RANK} /></> },
  { name: '19 · Caption label on top', note: 'Conventional StatCard hierarchy: small caption label on top, big % below.', render: () => <><S19 icon={<Heart className="size-3.5" />} label="Health" pct={HEALTH} rank={HEALTH_RANK} /><S19 icon={<Drumstick className="size-3.5" />} label="Hunger" pct={HUNGER} rank={HUNGER_RANK} /></> },
  { name: '20 · Big label + big %', note: 'Both on the headline row, label medium-weight so it carries next to the number.', render: () => <><S20 icon={<Heart className="size-4" />} label="Health" pct={HEALTH} rank={HEALTH_RANK} /><S20 icon={<Drumstick className="size-4" />} label="Hunger" pct={HUNGER} rank={HUNGER_RANK} /></> },
]

function GridRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {children}
      <div className="bg-card flex flex-col gap-1 rounded-md border p-3">
        <span className="text-xs font-medium">Avg Points</span>
        <span className="text-2xl tabular-nums">35,241</span>
        <span className="text-muted-foreground text-xs">#72 of 180</span>
      </div>
    </div>
  )
}

export default function VitalsPreviewPage() {
  return (
    <main className="px-8 py-12">
      <div className="max-w-5xl space-y-2">
        <h1 className="text-2xl font-semibold">Health / hunger card proposals</h1>
        <p className="text-muted-foreground">
          15 ways to make the avg-health/hunger cards more interesting. 1-7 are
          single-stat treatments (shown for both); 8-15 combine them. Sample:
          health 78%, hunger 54%. Shown in the StatCard grid (an Avg Points card
          for scale).
        </p>
      </div>

      <div className="mt-10 space-y-10">
        {[...SINGLES, ...COMBINED].map(v => (
          <section key={v.name} className="space-y-3">
            <div>
              <h2 className="font-medium">{v.name}</h2>
              <p className="text-muted-foreground text-sm">{v.note}</p>
            </div>
            <GridRow>{v.render()}</GridRow>
          </section>
        ))}
      </div>
    </main>
  )
}
