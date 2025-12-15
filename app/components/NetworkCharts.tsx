'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface Props {
  versionDistribution: { version: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
  darkMode: boolean;
  cardClass: string;
  borderClass: string;
  mutedClass: string;
  COLORS: string[];
}

export default function NetworkCharts({
  versionDistribution,
  statusDistribution,
  darkMode,
  cardClass,
  borderClass,
  mutedClass,
  COLORS,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Version Distribution */}
      <div className={`${cardClass} p-6 rounded-xl border ${borderClass}`}>
        <h3 className="text-lg font-semibold mb-4">Version Distribution</h3>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={versionDistribution}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={darkMode ? '#374151' : '#e5e7eb'}
            />
            <XAxis dataKey="version" stroke="currentColor" />
            <YAxis stroke="currentColor" />
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                borderRadius: '0.5rem',
                color: darkMode ? '#fff' : '#000',
              }}
            />
            <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status Distribution */}
      <div className={`${cardClass} p-6 rounded-xl border ${borderClass}`}>
        <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>

        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={statusDistribution}
              dataKey="count"
              cx="50%"
              cy="50%"
              outerRadius={80}
              labelLine={false}
              label={({ payload, percent }) =>
                `${payload.status} ${((percent || 0) * 100).toFixed(0)}%`
              }
            >
              {statusDistribution.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                borderRadius: '0.5rem',
                color: darkMode ? '#fff' : '#000',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
