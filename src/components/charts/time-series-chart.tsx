"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  ResponsiveContainer
} from 'recharts';

interface ChartItem {
  id: string;
  name: string;
  minValue: number;
  maxValue: number;
  description: string | null;
  unit: string | null;
}

interface TimeSeriesDataPoint {
  timestamp: string;
  itemId: string;
  value: number;
}

interface TimeSeriesChartProps {
  items: ChartItem[];
  data: TimeSeriesDataPoint[];
  width?: number;
  height?: number;
  className?: string;
}

export function TimeSeriesChart({
  items,
  data,
  width = 700,
  height = 400,
  className = ""
}: TimeSeriesChartProps) {
  // 데이터를 Recharts 형식으로 변환
  const chartData = data.reduce((acc: any[], point) => {
    const existingPoint = acc.find(p => p.timestamp === point.timestamp);

    if (existingPoint) {
      existingPoint[point.itemId] = point.value;
    } else {
      const newPoint: any = { timestamp: point.timestamp };
      newPoint[point.itemId] = point.value;
      acc.push(newPoint);
    }

    return acc;
  }, []);

  // 시간순으로 정렬
  chartData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // 동적 색상 생성 함수
  const generateColors = (count: number) => {
    const baseColors = [
      '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4',
      '#10b981', '#f97316', '#8b5a2b', '#6b7280', '#ec4899',
      '#84cc16', '#06b6d4', '#7c3aed', '#f59e0b', '#ef4444'
    ];

    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }

    // 더 많은 색상이 필요한 경우 HSL을 사용해서 동적 생성
    const colors = [...baseColors];
    for (let i = baseColors.length; i < count; i++) {
      const hue = (i * 137.5) % 360; // 황금비를 사용해서 색상 분포 최적화
      const saturation = 60 + (i % 20); // 60-80% 범위
      const lightness = 45 + (i % 15); // 45-60% 범위
      colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }

    return colors;
  };

  const colors = generateColors(items.length);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600 mb-2">
            {new Date(label).toLocaleString()}
          </p>
          {payload.map((entry: any, index: number) => {
            const item = items.find(i => i.id === entry.dataKey);
            const isNormal = item && entry.value >= item.minValue && entry.value <= item.maxValue;

            return (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {item?.name}: {entry.value} {item?.unit}
                <span className={`ml-2 text-xs ${isNormal ? 'text-green-600' : 'text-red-600'}`}>
                  {isNormal ? '(정상)' : '(비정상)'}
                </span>
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`chart-container ${className}`} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          {/* 정상 범위 영역 */}
          {items.map((item, index) => {
            const color = colors[index % colors.length] || '#3b82f6';
            const fillColor = color.startsWith('hsl')
              ? color.replace(')', ', 0.1)').replace('hsl', 'hsla')
              : color.replace('#', '').match(/.{2}/g)?.reduce((acc, hex) => acc + parseInt(hex, 16) + ',', 'rgba(') + '0.1)';

            const strokeColor = color.startsWith('hsl')
              ? color.replace(')', ', 0.3)').replace('hsl', 'hsla')
              : color.replace('#', '').match(/.{2}/g)?.reduce((acc, hex) => acc + parseInt(hex, 16) + ',', 'rgba(') + '0.3)';

            return (
              <ReferenceArea
                key={`area-${item.id}`}
                y1={item.minValue}
                y2={item.maxValue}
                fill={fillColor}
                stroke={strokeColor}
                strokeDasharray="5 5"
              />
            );
          })}

          <XAxis
            dataKey="timestamp"
            tickFormatter={(value) => {
              const date = new Date(value);
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              return `${year}-${month}-${day}\n${hours}:${minutes}`;
            }}
            stroke="#6b7280"
            fontSize={12}
          />

          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => value.toFixed(1)}
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{
              fontSize: '12px',
              paddingTop: '10px',
              paddingBottom: '10px'
            }}
            iconSize={12}
            iconType="circle"
          />

          {/* 데이터 라인 */}
          {items.map((item, index) => (
            <Line
              key={item.id}
              type="monotone"
              dataKey={item.id}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors[index % colors.length], strokeWidth: 2 }}
              name={item.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 