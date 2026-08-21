import { useState } from 'react';
import { MessageCircle, ArrowRight, Check } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../data/products';

type Step = 'level' | 'style' | 'weight' | 'result';

export default function PaddleFinder() {
  const [step, setStep] = useState<Step>('level');
  const [level, setLevel] = useState('');
  const [style, setStyle] = useState('');
  const [weight, setWeight] = useState('');

  const reset = () => {
    setStep('level');
    setLevel('');
    setStyle('');
    setWeight('');
  };

  const buildResultMessage = () => {
    const msg = `Hola The House of Sports Perú, estoy buscando una pala ideal. Mi nivel es: ${level}, busco: ${style}, prefiero pala: ${weight}. ¿Me ayudan a elegir la mejor opción?`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  const steps: Step[] = ['level', 'style', 'weight', 'result'];
  const currentIdx = steps.indexOf(step);

  return (
    <section id="quiz" className="bg-gradient-to-b from-zinc-950 to-zinc-900 py-16 lg:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-sm font-semibold text-[#e3262e] uppercase tracking-wider">
            Asesoría inteligente
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mt-2 mb-4">
            Encuentra tu pala ideal
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Responde 3 preguntas y te recomendamos la pala perfecta para tu juego
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= currentIdx ? 'w-12 bg-[#e3262e]' : 'w-8 bg-white/10'
              }`}
            />
          ))}
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 lg:p-10">
          {/* Step 1: Level */}
          {step === 'level' && (
            <div className="animate-fade-in">
              <h3 className="text-xl lg:text-2xl font-bold text-white text-center mb-8">
                ¿Cuál es tu nivel de juego?
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {['Principiante', 'Intermedio', 'Avanzado'].map((l) => (
                  <button
                    key={l}
                    onClick={() => { setLevel(l); setStep('style'); }}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                      level === l
                        ? 'border-[#e3262e] bg-[#e3262e]/10'
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    <div className="text-3xl mb-2">
                      {l === 'Principiante' ? '🌱' : l === 'Intermedio' ? '⚡' : '🔥'}
                    </div>
                    <div className="text-base font-bold text-white">{l}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Style */}
          {step === 'style' && (
            <div className="animate-fade-in">
              <h3 className="text-xl lg:text-2xl font-bold text-white text-center mb-8">
                ¿Buscas control, potencia o equilibrio?
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {['Control', 'Potencia', 'Equilibrio'].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStyle(s); setStep('weight'); }}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                      style === s
                        ? 'border-[#e3262e] bg-[#e3262e]/10'
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    <div className="text-3xl mb-2">
                      {s === 'Control' ? '🎯' : s === 'Potencia' ? '💪' : '⚖️'}
                    </div>
                    <div className="text-base font-bold text-white">{s}</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep('level')} className="mt-6 text-sm text-gray-400 hover:text-white mx-auto block">
                ← Volver
              </button>
            </div>
          )}

          {/* Step 3: Weight */}
          {step === 'weight' && (
            <div className="animate-fade-in">
              <h3 className="text-xl lg:text-2xl font-bold text-white text-center mb-8">
                ¿Prefieres pala ligera o pesada?
              </h3>
              <div className="grid sm:grid-cols-2 gap-4 max-w-md mx-auto">
                {['Ligera', 'Pesada'].map((w) => (
                  <button
                    key={w}
                    onClick={() => { setWeight(w); setStep('result'); }}
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                      weight === w
                        ? 'border-[#e3262e] bg-[#e3262e]/10'
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    <div className="text-3xl mb-2">
                      {w === 'Ligera' ? '🪶' : '🏋️'}
                    </div>
                    <div className="text-base font-bold text-white">{w}</div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep('style')} className="mt-6 text-sm text-gray-400 hover:text-white mx-auto block">
                ← Volver
              </button>
            </div>
          )}

          {/* Result */}
          {step === 'result' && (
            <div className="animate-fade-in text-center">
              <div className="w-16 h-16 rounded-full bg-[#e3262e]/20 flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-[#e3262e]" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-white mb-3">
                ¡Listo! Tenemos tu perfil
              </h3>
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                <span className="text-sm font-semibold px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300">
                  Nivel: {level}
                </span>
                <span className="text-sm font-semibold px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300">
                  Estilo: {style}
                </span>
                <span className="text-sm font-semibold px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300">
                  Peso: {weight}
                </span>
              </div>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Habla con un asesor y te ayudamos a elegir la mejor opción según tu perfil de juego.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={buildResultMessage()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold px-8 py-4 rounded-full transition-all duration-200 hover:scale-105"
                >
                  <MessageCircle size={20} />
                  Hablar con un asesor
                </a>
                <button
                  onClick={reset}
                  className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-8 py-4 rounded-full transition-colors"
                >
                  Volver a empezar <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
