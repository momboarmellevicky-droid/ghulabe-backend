import React, { useState } from 'react';
import { Language, Mission, Message } from '../../types';
import { MOCK_MESSAGES } from '../../data/mockData';
import { 
  Send, Paperclip, FileText, 
  Star, Smartphone, Mail
} from 'lucide-react';

interface MissionChatModalProps {
  lang: Language;
  mission: Mission;
  onClose: () => void;
  onRateDeveloper?: (missionId: string, stars: number, review: string) => void;
}

export const MissionChatModal: React.FC<MissionChatModalProps> = ({
  lang,
  mission,
  onClose,
  onRateDeveloper
}) => {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [newMsgText, setNewMsgText] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [stars, setStars] = useState(5);
  const [review, setReview] = useState('');

  // Commission calculation (15% Ghulabe, 85% Net Dev)
  const budget = mission.budget_fcfa || 60000;
  const commGhulabe = Math.round(budget * 0.15);
  const netDev = budget - commGhulabe;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgText.trim()) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      mission_id: mission.id,
      sender_id: mission.client_id,
      sender_name: mission.client_name,
      sender_role: 'client',
      content: newMsgText,
      created_at: new Date().toISOString()
    };

    setMessages([...messages, newMsg]);
    setNewMsgText('');

    // Simulate realtime response from dev
    setTimeout(() => {
      const devReply: Message = {
        id: `msg-${Date.now() + 1}`,
        mission_id: mission.id,
        sender_id: mission.developer_id,
        sender_name: `${mission.developer_name} (GHULABE EXPERT)`,
        sender_role: 'developer',
        content: lang === 'fr' 
          ? "Bien reçu ! Le correctif est en cours de validation finale via notre pipeline de test bilingue."
          : "Received! The fix is undergoing final verification via our bilingual testing pipeline.",
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, devReply]);
    }, 1500);
  };

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!review.trim()) return;
    if (onRateDeveloper) {
      onRateDeveloper(mission.id, stars, review);
    }
    setShowRatingModal(false);
    alert(lang === 'fr' 
      ? `⭐ Merci pour votre notation de ${stars}/5 !\n\n${stars < 3 ? '⚠️ Note < 3/5 : Signalement automatique à l\'administration GHULABE (Mombo Armelle Vicky) pour audit.' : 'L\'avis a été publié sur le profil du développeur certifié.'}`
      : `⭐ Thank you for rating ${stars}/5!`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="glass-card max-w-3xl w-full h-[85vh] rounded-3xl border border-[#0066FF] flex flex-col shadow-[0_0_50px_rgba(0,102,255,0.35)] overflow-hidden">
        
        {/* Chat Top Bar & Commission info */}
        <div className="bg-[#0D1B2A] p-4 sm:p-6 border-b border-[#0066FF]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00FF88] animate-ping"></span>
              <h3 className="font-display font-bold text-lg sm:text-xl text-white">
                Mission #{mission.id} • {mission.developer_name}
              </h3>
            </div>
            <p className="text-xs font-mono text-gray-400 mt-1">
              Cible : <strong className="text-white">{mission.url}</strong> • Urgence : <span className="text-[#FF2D2D] font-bold uppercase">{mission.urgency}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5 font-mono text-xs">
            <div className="text-right">
              <span className="text-gray-400 block text-[10px] uppercase">Budget / Net Dev Net</span>
              <span className="text-[#00FF88] font-bold">{budget.toLocaleString()} FCFA</span>
              <span className="text-gray-400 block text-[9px]">(Dev 85%: {netDev.toLocaleString()} FCFA | Ghulabe 15%: {commGhulabe.toLocaleString()} FCFA)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRatingModal(true)}
                className="px-3 py-1.5 rounded-lg bg-[#FFB800] hover:bg-[#FFB800]/80 text-[#0A0A0F] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-[#0A0A0F]" />
                <span>Noter</span>
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-white text-lg px-2">
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Realtime Notification simulation pill */}
        <div className="bg-[#0A0A0F] px-4 py-1.5 border-b border-white/5 text-[11px] font-mono text-gray-400 flex items-center justify-between">
          <span>⚡ Supabase Realtime Active • TLS 1.3 / AES-256</span>
          <span className="flex items-center gap-1.5 text-[#00FF88]">
            <Smartphone className="w-3 h-3" />
            <Mail className="w-3 h-3" />
            <span>Notifs SMS+Email activées</span>
          </span>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#0A0A0F]/90">
          {messages.map((msg) => {
            const isMe = msg.sender_role === 'client';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  <span className="text-[10px] font-mono text-gray-400">{msg.sender_name}</span>
                  <span className="text-[9px] font-mono text-gray-500">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div
                  className={`max-w-xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed font-sans shadow-md ${
                    isMe
                      ? 'bg-[#0066FF] text-white rounded-br-sm shadow-[0_4px_15px_rgba(0,102,255,0.3)]'
                      : 'bg-[#0D1B2A] text-gray-200 border border-[#0066FF]/30 rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {msg.attachment_name && (
                    <div className="mt-3 p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2 text-xs font-mono text-[#00FF88] cursor-pointer hover:bg-black/60 transition-colors">
                      <FileText className="w-4 h-4 shrink-0 text-[#0066FF]" />
                      <span className="truncate">{msg.attachment_name}</span>
                      <span className="text-[10px] text-gray-400 ml-auto">(PDF Signé)</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="p-4 bg-[#0D1B2A] border-t border-white/10 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              alert(lang === 'fr' ? "📎 Raccourci : Joindre un rapport PDF ou capture d'écran." : "📎 Attach PDF report or screenshot.");
            }}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors cursor-pointer shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={newMsgText}
            onChange={(e) => setNewMsgText(e.target.value)}
            placeholder={lang === 'fr' ? "Écrire un message sécurisé..." : "Write a secure message..."}
            className="flex-1 py-3 px-4 rounded-xl bg-[#0A0A0F] border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[#0066FF]"
          />

          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-[#0066FF] hover:bg-[#00FF88] hover:text-[#0A0A0F] text-white font-display font-bold text-xs uppercase transition-all shadow-[0_0_15px_rgba(0,102,255,0.5)] cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Envoyer</span>
          </button>
        </form>

        {/* Rating Modal */}
        {showRatingModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="glass-card max-w-md w-full p-6 sm:p-8 rounded-3xl border border-[#FFB800] space-y-6 text-center">
              <h4 className="font-display font-bold text-xl text-white">
                Noter la Mission & le Développeur
              </h4>
              <p className="text-xs text-gray-300">
                Note de 1 à 5 étoiles et avis obligatoire. En dessous de 3/5, un examen de litige est automatiquement transmis à Mombo Armelle Vicky.
              </p>

              <form onSubmit={handleRatingSubmit} className="space-y-5">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((sVal) => (
                    <button
                      key={sVal}
                      type="button"
                      onClick={() => setStars(sVal)}
                      className="p-2 transition-transform hover:scale-125 cursor-pointer"
                    >
                      <Star
                        className={`w-8 h-8 ${sVal <= stars ? 'text-[#FFB800] fill-[#FFB800]' : 'text-gray-600'}`}
                      />
                    </button>
                  ))}
                </div>

                {stars < 3 && (
                  <p className="text-[11px] font-mono text-[#FF2D2D] font-bold p-2 bg-[#FF2D2D]/10 rounded border border-[#FF2D2D]/30">
                    ⚠️ Note &lt; 3/5 : Signalement automatique à l'Administrateur pour vérification de prestation.
                  </p>
                )}

                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={3}
                  placeholder="Écrivez votre avis circonstancié..."
                  className="w-full p-3 rounded-xl bg-[#0A0A0F] border border-white/10 text-white text-xs focus:outline-none focus:border-[#FFB800] resize-none"
                  required
                ></textarea>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-gray-400 text-xs cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#FFB800] text-[#0A0A0F] font-display font-bold text-xs uppercase cursor-pointer"
                  >
                    Publier l'avis
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
      
