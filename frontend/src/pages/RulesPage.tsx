function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
      <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
      {children}
    </div>
  );
}

export default function RulesPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-6">📜 Reglas de puntuación</h1>

      <Section title="⚽ Puntos por partido">
        <p className="text-sm text-gray-400 mb-4">
          Por cada partido se suman los puntos de todas las condiciones que aciertes — no tienes que elegir
          entre ellas, se acumulan. Como un resultado exacto también acierta automáticamente la diferencia
          de goles y el ganador, un pronóstico perfecto suma los tres premios a la vez.
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2.5">
            <span className="text-gray-300">🎯 Resultado exacto (p. ej. predices 2:1 y termina 2:1)</span>
            <span className="text-yellow-400 font-bold">+5 pts</span>
          </div>
          <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2.5">
            <span className="text-gray-300">📊 Diferencia de goles correcta (p. ej. predices 2:1 y termina 3:2)</span>
            <span className="text-yellow-400 font-bold">+3 pts</span>
          </div>
          <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2.5">
            <span className="text-gray-300">✅ Ganador o empate correcto (aciertas quién gana, o que empatan)</span>
            <span className="text-yellow-400 font-bold">+1 pt</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Ejemplo: predices <span className="text-gray-300 font-medium">2:1</span> y el resultado real es{' '}
          <span className="text-gray-300 font-medium">2:1</span> → resultado exacto (5) + diferencia correcta (3)
          + ganador correcto (1) = <span className="text-yellow-400 font-bold">9 pts</span> en la fase de grupos.
        </p>
      </Section>

      <Section title="🔢 Multiplicador por fase">
        <p className="text-sm text-gray-400 mb-4">
          Cuanto más avanza el torneo, más valen los puntos de cada partido — la suma de arriba se multiplica
          según la fase:
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2.5">
            <span className="text-gray-300">Fase de grupos</span>
            <span className="text-yellow-400 font-bold">× 1</span>
          </div>
          <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2.5">
            <span className="text-gray-300">Ronda de 32 · Octavos · Cuartos · Tercer puesto</span>
            <span className="text-yellow-400 font-bold">× 2</span>
          </div>
          <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2.5">
            <span className="text-gray-300">Semifinal y Final</span>
            <span className="text-yellow-400 font-bold">× 3</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Ejemplo: un acierto perfecto (9 pts base) en semifinal vale 9 × 3 = <span className="text-yellow-400 font-bold">27 pts</span>.
        </p>
      </Section>

      <Section title="🏆 Pronósticos especiales">
        <p className="text-sm text-gray-400 mb-3">
          Además de los partidos, puedes pronosticar quién será el campeón, el subcampeón y el máximo goleador
          del torneo (pestaña "🏆 Especiales" en Pronósticos). Solo puedes enviarlos antes de que arranque el
          primer partido — después quedan bloqueados.
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2.5">
            <span className="text-gray-300">🥇 Campeón del mundo correcto</span>
            <span className="text-yellow-400 font-bold">+10 pts</span>
          </div>
          <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2.5">
            <span className="text-gray-300">🥈 Subcampeón correcto</span>
            <span className="text-yellow-400 font-bold">+6 pts</span>
          </div>
          <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2.5">
            <span className="text-gray-300">⚽ Máximo goleador correcto</span>
            <span className="text-yellow-400 font-bold">+6 pts</span>
          </div>
        </div>
      </Section>

      <Section title="⏰ Plazos para pronosticar">
        <ul className="text-sm text-gray-400 space-y-2 list-disc list-inside">
          <li>Por ahora solo está abierta la <span className="text-gray-200 font-medium">fase de grupos</span> — el resto de fases las irá abriendo el administrador a medida que avance el torneo.</li>
          <li>Cada partido se cierra automáticamente en cuanto comienza — ya no se puede cambiar el pronóstico.</li>
          <li>Los pronósticos especiales (campeón, subcampeón, goleador) se cierran en el saque inicial del primer partido del torneo.</li>
        </ul>
      </Section>
    </div>
  );
}
