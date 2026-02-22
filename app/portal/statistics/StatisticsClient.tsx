'use client'

import { useState, useMemo } from 'react'
import {
  IconUsers,
  IconCalendarEvent,
  IconClipboardList,
  IconTrophy
} from '@tabler/icons-react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/DataTable'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts'

// Mock data based on the real data you provided
const mockSeasonData = {
  season: '2025-2026',
  officials: {
    active: 213,
    ready: 184,
    refereed: 163
  },
  assignments: {
    totalGames: 3334,
    totalAssignments: 6681,
    min: 1,
    max: 156,
    average: 39.12
  },
  distribution: [
    { range: '1-9', count: 39 },
    { range: '10-19', count: 36 },
    { range: '20-29', count: 17 },
    { range: '30-39', count: 8 },
    { range: '40-49', count: 9 },
    { range: '50-59', count: 5 },
    { range: '60-69', count: 10 },
    { range: '70-79', count: 9 },
    { range: '80-89', count: 5 },
    { range: '90-99', count: 6 },
    { range: '100-109', count: 4 },
    { range: '110-119', count: 4 },
    { range: '120-129', count: 4 },
    { range: '130-139', count: 3 },
    { range: '140-149', count: 3 },
    { range: '150-159', count: 1 }
  ],
  cumulativeDistribution: [
    { label: 'Top 10', count: 193, percent: 21.49 },
    { label: 'Top 15', count: 271, percent: 30.18 },
    { label: 'Top 20', count: 226, percent: 25.17 },
    { label: 'Top 30', count: 339, percent: 37.75 },
    { label: 'Top 40', count: 458, percent: 51.00 },
    { label: 'Top 50', count: 563, percent: 62.69 },
    { label: 'Top 60', count: 648, percent: 72.16 },
    { label: 'Top 70', count: 718, percent: 79.96 },
    { label: 'Top 80', count: 778, percent: 86.64 },
    { label: 'Top 90', count: 829, percent: 92.32 },
    { label: 'Rest', count: 898, percent: 100.00 }
  ],
  tournaments: {
    total: 45,
    totalGames: 817,
    totalAssignments: 1604,
    byCategory: [
      { name: 'High School', count: 23, games: 428, assignments: 875 },
      { name: 'Junior High', count: 14, games: 249, assignments: 436 },
      { name: 'Club', count: 6, games: 113, assignments: 226 },
      { name: 'CJBL', count: 1, games: 13, assignments: 39 },
      { name: 'Recreational Adult', count: 1, games: 14, assignments: 28 }
    ],
    breakdown: [
      { name: 'Edge', count: 2, games: 81, assignments: 179 },
      { name: 'Simon Fraser Jr. High', count: 2, games: 48, assignments: 96 },
      { name: 'William D. Pratt', count: 2, games: 44, assignments: 88 },
      { name: 'Holy Trinity Academy', count: 2, games: 38, assignments: 76 },
      { name: 'Nelson Mandela High School', count: 1, games: 32, assignments: 66 },
      { name: 'Rocky View Junior High (9 venues)', count: 1, games: 34, assignments: 18 },
      { name: 'John G Diefenbaker High School', count: 1, games: 24, assignments: 48 },
      { name: 'Sir Winston Churchill High School', count: 1, games: 24, assignments: 48 },
      { name: 'Cochrane High School', count: 1, games: 24, assignments: 48 },
      { name: 'Bishop McNally (Pearson)', count: 1, games: 24, assignments: 48 },
      { name: 'Club (Full Court Events)', count: 6, games: 113, assignments: 226 },
      { name: 'Bert Church High School', count: 1, games: 21, assignments: 42 },
      { name: 'Crowther Memorial School', count: 1, games: 20, assignments: 40 },
      { name: 'Central Memorial High School', count: 1, games: 18, assignments: 36 },
      { name: 'Springbank High School', count: 1, games: 18, assignments: 36 },
      { name: 'Western Canada High School', count: 1, games: 18, assignments: 36 },
      { name: 'North Trail Jr High Feeder', count: 1, games: 18, assignments: 24 },
      { name: 'Rundle College (Junior High)', count: 1, games: 16, assignments: 32 },
      { name: 'Sherwood School', count: 1, games: 16, assignments: 32 },
      { name: 'Clarence Samson School', count: 1, games: 16, assignments: 32 }
    ]
  },
  leagues: {
    totalGames: 2328,
    totalAssignments: 4650,
    breakdown: [
      {
        name: 'CBE Junior High',
        games: 1381,
        assignments: 2761,
        subdivisions: []
      },
      {
        name: 'Senior Mens',
        games: 395,
        assignments: 986,
        subdivisions: [
          { name: 'Mens Div 1', games: 99, assignments: 198 },
          { name: 'Mens Div 2', games: 211, assignments: 422 },
          { name: 'Mens Div 3', games: 121, assignments: 239 },
          { name: 'Mens Masters', games: 64, assignments: 127 }
        ]
      },
      {
        name: 'CSHSAA',
        games: 228,
        assignments: 456,
        subdivisions: [
          { name: 'Div 1/2 Sr Boys', games: 43, assignments: 86 },
          { name: 'Div 3 Sr Boys', games: 16, assignments: 32 },
          { name: 'Div 1 Sr Girls', games: 21, assignments: 42 },
          { name: 'Div 2 Sr Girls', games: 27, assignments: 54 },
          { name: 'Div 3 Sr Girls', games: 11, assignments: 22 },
          { name: 'Div 1/2 Jr Boys', games: 42, assignments: 84 },
          { name: 'Div 3 Jr Boys', games: 13, assignments: 26 },
          { name: 'Div 1 Jr Girls', games: 21, assignments: 42 },
          { name: 'Div 2 Jr Girls', games: 27, assignments: 54 },
          { name: 'Div 3 Jr Girls', games: 7, assignments: 14 }
        ]
      },
      {
        name: 'Womens Div 2',
        games: 79,
        assignments: 158,
        subdivisions: []
      },
      {
        name: 'Rocky View League',
        games: 50,
        assignments: 100,
        subdivisions: [
          { name: 'Sr Boys', games: 11, assignments: 22 },
          { name: 'Sr Girls', games: 10, assignments: 20 },
          { name: 'Jr Boys', games: 15, assignments: 30 },
          { name: 'Jr Girls', games: 14, assignments: 28 }
        ]
      },
      {
        name: 'Womens Masters',
        games: 33,
        assignments: 65,
        subdivisions: []
      },
      {
        name: 'your community Chinese Basketball Club',
        games: 30,
        assignments: 60,
        subdivisions: []
      },
      {
        name: 'Foothills League',
        games: 16,
        assignments: 32,
        subdivisions: [
          { name: 'Sr Boys', games: 5, assignments: 10 },
          { name: 'Sr Girls', games: 3, assignments: 6 },
          { name: 'Jr Boys', games: 5, assignments: 10 },
          { name: 'Jr Girls', games: 3, assignments: 6 }
        ]
      },
      {
        name: 'your community High School Sports League (CHSSL)',
        games: 16,
        assignments: 32,
        subdivisions: [
          { name: 'Sr Boys', games: 9, assignments: 18 },
          { name: 'Sr Girls', games: 7, assignments: 14 }
        ]
      },
      {
        name: 'Foothills Exhibition',
        games: 12,
        assignments: 24,
        subdivisions: [
          { name: 'Sr Boys', games: 4, assignments: 8 },
          { name: 'Sr Girls', games: 4, assignments: 8 },
          { name: 'Jr Boys', games: 2, assignments: 4 },
          { name: 'Jr Girls', games: 2, assignments: 4 }
        ]
      }
    ]
  }
}

const mockMonthlyData = {
  month: 'February 2026',
  officials: {
    active: 203,
    ready: 171,
    refereed: 135
  },
  assignments: {
    totalGames: 1452,
    totalAssignments: 2919,
    min: 1,
    max: 55,
    average: 21.62
  },
  distribution: [
    { range: '1-9', count: 32 },
    { range: '10-19', count: 33 },
    { range: '20-29', count: 26 },
    { range: '30-39', count: 29 },
    { range: '40-49', count: 10 },
    { range: '50-59', count: 5 }
  ],
  tournaments: {
    total: 32,
    totalGames: 407,
    totalAssignments: 0,
    byCategory: [
      { name: 'High School', count: 28, games: 361, assignments: 0 },
      { name: 'Junior High', count: 3, games: 34, assignments: 0 },
      { name: 'Club', count: 0, games: 0, assignments: 0 },
      { name: 'CJBL', count: 1, games: 12, assignments: 0 }
    ]
  }
}

// Types for TanStack Table
type TournamentRow = {
  name: string
  count: number
  games: number
  assignments: number
}

type LeagueRow = {
  name: string
  games: number
  assignments: number
  subRows?: LeagueRow[]
}

// Column definitions for tournaments table
const tournamentColumns: ColumnDef<TournamentRow>[] = [
  {
    accessorKey: 'name',
    header: 'Tournament',
  },
  {
    accessorKey: 'count',
    header: 'Count',
    meta: { align: 'right' as const },
  },
  {
    accessorKey: 'games',
    header: 'Games',
    meta: { align: 'right' as const },
  },
  {
    accessorKey: 'assignments',
    header: 'Assignments',
    meta: { align: 'right' as const },
  },
]

// Column definitions for leagues table
const leagueColumns: ColumnDef<LeagueRow>[] = [
  {
    accessorKey: 'name',
    header: 'League',
  },
  {
    accessorKey: 'games',
    header: 'Games',
    meta: { align: 'right' as const },
    cell: ({ getValue }) => getValue<number>().toLocaleString(),
  },
  {
    accessorKey: 'assignments',
    header: 'Assignments',
    meta: { align: 'right' as const },
    cell: ({ getValue }) => getValue<number>().toLocaleString(),
  },
]

// Stat Card Component
function StatCard({ label, value, icon: Icon, subtext }: {
  label: string
  value: number | string
  icon?: any
  subtext?: string
}) {
  return (
    <div className="bg-white dark:bg-portal-surface rounded-xl border border-gray-200 dark:border-portal-border p-4 sm:p-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 bg-blue-900/30 rounded-lg">
            <Icon className="h-6 w-6 text-blue-400" />
          </div>
        )}
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          {subtext && <p className="text-xs text-gray-400 dark:text-gray-500">{subtext}</p>}
        </div>
      </div>
    </div>
  )
}

export default function StatisticsClient() {
  const [viewType, setViewType] = useState<'season' | 'monthly'>('season')
  const [selectedSeason, setSelectedSeason] = useState('2025-2026')
  const [selectedMonth, setSelectedMonth] = useState('February 2026')

  const data = viewType === 'season' ? mockSeasonData : mockMonthlyData as typeof mockSeasonData

  // Transform leagues data for TanStack Table with subRows
  const leaguesData = useMemo((): LeagueRow[] => {
    return mockSeasonData.leagues.breakdown.map((league) => ({
      name: league.name,
      games: league.games,
      assignments: league.assignments,
      subRows: league.subdivisions && league.subdivisions.length > 0
        ? league.subdivisions.map((sub) => ({
            name: sub.name,
            games: sub.games,
            assignments: sub.assignments,
          }))
        : undefined,
    }))
  }, [])

  const CHART_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd']

  return (
    <div className="space-y-6 portal-animate">
      {/* Under Construction Banner */}
      <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg p-4 flex items-center gap-3">
        <span className="text-2xl">🚧</span>
        <div>
          <p className="font-semibold text-amber-800 dark:text-amber-300">Under Construction</p>
          <p className="text-sm text-amber-700 dark:text-amber-400">This page is currently displaying mock data for demonstration purposes.</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-gray-900 dark:text-white">Statistics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Scheduler statistics and reports</p>
        </div>

        {/* View Toggle & Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-portal-surface rounded-lg p-1">
            <button
              onClick={() => setViewType('season')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewType === 'season'
                  ? 'bg-white dark:bg-portal-hover shadow text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Season Summary
            </button>
            <button
              onClick={() => setViewType('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewType === 'monthly'
                  ? 'bg-white dark:bg-portal-hover shadow text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
          </div>

          {viewType === 'season' ? (
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-portal-surface text-gray-900 dark:text-white"
            >
              <option value="2025-2026">2025-2026 Season</option>
              <option value="2024-2025">2024-2025 Season</option>
              <option value="2023-2024">2023-2024 Season</option>
            </select>
          ) : (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-portal-surface text-gray-900 dark:text-white"
            >
              <option value="February 2026">February 2026</option>
              <option value="March 2026">March 2026</option>
              <option value="January 2026">January 2026</option>
              <option value="December 2025">December 2025</option>
              <option value="November 2025">November 2025</option>
            </select>
          )}
        </div>
      </div>

      {/* Officials & Assignments Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Active Officials" value={data.officials.active} icon={IconUsers} />
        <StatCard label="Ready to Officiate" value={data.officials.ready} icon={IconUsers} />
        <StatCard label="Refereed 1+ Game" value={data.officials.refereed} icon={IconUsers} />
        <StatCard label="Games Assigned" value={data.assignments.totalGames} icon={IconCalendarEvent} />
        <StatCard label="Total Assignments" value={data.assignments.totalAssignments} icon={IconClipboardList} />
        <StatCard
          label="Avg Games/Official"
          value={data.assignments.average.toFixed(2)}
          subtext={`Min: ${data.assignments.min} / Max: ${data.assignments.max}`}
        />
      </div>

      {/* Distribution Chart */}
      <div className="bg-white dark:bg-portal-surface rounded-xl border border-gray-200 dark:border-portal-border p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Officials by Games Refereed</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.distribution} layout="vertical" margin={{ left: 60, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} className="dark:opacity-30" />
              <XAxis type="number" tick={{ fill: 'currentColor' }} className="text-gray-600 dark:text-gray-400" />
              <YAxis type="category" dataKey="range" tick={{ fontSize: 12, fill: 'currentColor' }} width={50} className="text-gray-600 dark:text-gray-400" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg, white)', borderColor: 'var(--tooltip-border, #e5e7eb)', color: 'var(--tooltip-text, #1f2937)' }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="count" position="right" className="fill-gray-700 dark:fill-gray-300" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cumulative Distribution (Season only) */}
      {viewType === 'season' && mockSeasonData.cumulativeDistribution && (
        <div className="bg-white dark:bg-portal-surface rounded-xl border border-gray-200 dark:border-portal-border p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Assignment Distribution (Cumulative)</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Shows cumulative assignments by top officials</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockSeasonData.cumulativeDistribution} margin={{ top: 20, right: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="dark:opacity-30" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-gray-600 dark:text-gray-400" />
                <YAxis tick={{ fill: 'currentColor' }} className="text-gray-600 dark:text-gray-400" />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'count' ? `${value} assignments` : `${value}%`,
                    name === 'count' ? 'Assignments' : 'Percentage'
                  ]}
                  contentStyle={{ backgroundColor: 'var(--tooltip-bg, white)', borderColor: 'var(--tooltip-border, #e5e7eb)', color: 'var(--tooltip-text, #1f2937)' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {mockSeasonData.cumulativeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                  <LabelList
                    dataKey="percent"
                    position="top"
                    formatter={(value: number) => `${value}%`}
                    fill="#f97316"
                    fontSize={11}
                  />
                  <LabelList
                    dataKey="count"
                    position="inside"
                    fill="#fff"
                    fontSize={12}
                    fontWeight="bold"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tournaments Section */}
      <div className="bg-white dark:bg-portal-surface rounded-xl border border-gray-200 dark:border-portal-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <IconTrophy className="h-6 w-6 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tournaments</h2>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span><strong className="text-gray-900 dark:text-white">{data.tournaments.total}</strong> tournaments</span>
            <span><strong className="text-gray-900 dark:text-white">{data.tournaments.totalGames.toLocaleString()}</strong> games</span>
            {data.tournaments.totalAssignments > 0 && (
              <span><strong className="text-gray-900 dark:text-white">{data.tournaments.totalAssignments.toLocaleString()}</strong> assignments</span>
            )}
          </div>
        </div>

        {/* Category Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {data.tournaments.byCategory.map((cat) => (
            <div key={cat.name} className="bg-gray-50 dark:bg-portal-hover rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{cat.name}</p>
              <p className="text-xl font-bold text-blue-400">{cat.count}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{cat.games} games</p>
            </div>
          ))}
        </div>

        {/* Tournament Breakdown Table (Season only) */}
        {viewType === 'season' && (
          <>
            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">Tournament Breakdown</h3>
            <DataTable
              data={mockSeasonData.tournaments.breakdown}
              columns={tournamentColumns}
              searchable
              searchPlaceholder="Search tournaments..."
              maxHeight="24rem"
              stickyHeader
            />
          </>
        )}
      </div>

      {/* Leagues Section (Season only) */}
      {viewType === 'season' && (
        <div className="bg-white dark:bg-portal-surface rounded-xl border border-gray-200 dark:border-portal-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Leagues</h2>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span><strong className="text-gray-900 dark:text-white">{mockSeasonData.leagues.totalGames.toLocaleString()}</strong> games</span>
              <span><strong className="text-gray-900 dark:text-white">{mockSeasonData.leagues.totalAssignments.toLocaleString()}</strong> assignments</span>
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Click on a league with subdivisions to expand</p>

          <DataTable
            data={leaguesData}
            columns={leagueColumns}
            getSubRows={(row) => row.subRows}
          />
        </div>
      )}

    </div>
  )
}
