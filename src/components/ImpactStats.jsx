// Hardcoded impact multipliers derived from task co2Impact values and
// standard conversion factors (World Bank emission factor publications).
// Water saved: ~8L per kg CO₂ avoided (avg lifecycle); Energy: ~2.5 kWh per kg CO₂.
// These are estimates and clearly labelled as such in the UI.
const WATER_PER_CO2 = 8;   // litres per kg CO₂ saved
const ENERGY_PER_CO2 = 2.5; // kWh per kg CO₂ saved

export default function ImpactStats({ co2Saved, label = 'Your Impact', note = true }) {
  const waterSaved = (co2Saved * WATER_PER_CO2).toFixed(1);
  const energySaved = (co2Saved * ENERGY_PER_CO2).toFixed(1);

  const stats = [
    { icon: '🌿', value: co2Saved.toFixed(1), unit: 'kg', label: 'CO₂ Saved', color: 'text-green-700 bg-green-50' },
    { icon: '💧', value: waterSaved, unit: 'L', label: 'Water Saved', color: 'text-blue-700 bg-blue-50' },
    { icon: '⚡', value: energySaved, unit: 'kWh', label: 'Energy Saved', color: 'text-amber-700 bg-amber-50' },
  ];

  return (
    <div>
      <h3 className="font-bold text-gray-800 mb-3">{label}</h3>
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ icon, value, unit, label: statLabel, color }) => (
          <div key={statLabel} className={`rounded-2xl p-4 ${color.split(' ')[1]} text-center`}>
            <p className="text-2xl mb-1">{icon}</p>
            <p className={`text-xl font-black ${color.split(' ')[0]}`}>{value}</p>
            <p className={`text-xs font-semibold ${color.split(' ')[0]} opacity-80`}>{unit}</p>
            <p className="text-xs text-gray-500 mt-1">{statLabel}</p>
          </div>
        ))}
      </div>
      {note && (
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
          *Estimated impact based on predefined emission factors (World Bank). Not directly measured.
        </p>
      )}
    </div>
  );
}
