import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

export default function SustainabilityScoreGauge({ score, size = 'lg', label = 'Your Score' }) {
  const data = [{ value: score, fill: '#16a34a' }];

  const scoreColor =
    score >= 75 ? 'text-green-700' :
    score >= 50 ? 'text-yellow-600' :
    'text-red-600';

  const sizeClasses = {
    sm: 'h-32 w-32',
    md: 'h-40 w-40',
    lg: 'h-52 w-52',
    xl: 'h-64 w-64',
  };

  return (
    <div className={`relative ${sizeClasses[size]} mx-auto`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="65%"
          outerRadius="90%"
          startAngle={225}
          endAngle={-45}
          data={[{ value: 100, fill: '#dcfce7' }, { value: score, fill: '#16a34a' }]}
          barSize={14}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={8}
            background={false}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-black leading-none ${
          size === 'xl' ? 'text-5xl' : size === 'lg' ? 'text-4xl' : 'text-3xl'
        } ${scoreColor}`}>
          {score.toFixed(0)}
        </span>
        <span className="text-xs text-gray-500 font-medium mt-0.5">{label}</span>
        <span className="text-xs text-gray-400">/ 100</span>
      </div>
    </div>
  );
}
