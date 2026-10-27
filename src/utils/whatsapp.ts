import type { SundayService, ScheduleAssignment, Member, SetlistSong } from '../types';
import { formatSundayDate } from './dateUtils';

export function generateWhatsAppScheduleText(params: {
  service: SundayService;
  assignments: (ScheduleAssignment & { member?: Member })[];
  songs: SetlistSong[];
}): string {
  const { service, assignments, songs } = params;
  const formattedDate = formatSundayDate(service.date);
  const periodLabel = service.period === 'manha' ? 'MANHÃ (09:30)' : 'NOITE (19:00)';

  const lines: string[] = [
    `⛪ *ESPAÇO CRISTÃO — MINISTÉRIO DE LOUVOR*`,
    `✨ *ESCALA OFICIAL DO CULTO*`,
    `🗓️ *${formattedDate.toUpperCase()}*`,
    `⏰ *Horário:* ${periodLabel}`,
    ``,
  ];

  const isMediaTech = (role: string) => {
    const r = role.toLowerCase();
    return (
      r.includes('som') ||
      r.includes('mesa') ||
      r.includes('multimídia') ||
      r.includes('multimidia') ||
      r.includes('projeção') ||
      r.includes('projecao') ||
      r.includes('transmissão') ||
      r.includes('transmissao') ||
      r.includes('live') ||
      r.includes('foto') ||
      r.includes('vídeo') ||
      r.includes('video') ||
      r.includes('iluminação') ||
      r.includes('iluminacao')
    );
  };

  const louvorAssignments = assignments.filter((a) => !isMediaTech(a.role));
  const mediaAssignments = assignments.filter((a) => isMediaTech(a.role));

  if (assignments.length === 0) {
    lines.push(`🎵 *EQUIPE ESCALADA:*`);
    lines.push(`• _(Nenhum integrante escalado ainda)_`);
  } else {
    if (louvorAssignments.length > 0) {
      lines.push(`🎵 *LOUVOR & VOZES:*`);
      louvorAssignments.forEach((item) => {
        lines.push(`• *${item.role}:* ${item.member?.name || 'A definir'}`);
      });
    }

    if (mediaAssignments.length > 0) {
      if (louvorAssignments.length > 0) lines.push('');
      lines.push(`🎛️ *MULTIMÍDIA, SOM & FOTO:*`);
      mediaAssignments.forEach((item) => {
        lines.push(`• *${item.role}:* ${item.member?.name || 'A definir'}`);
      });
    }
  }

  if (songs.length > 0) {
    lines.push('');
    lines.push(`🎶 *MÚSICAS QUE VAMOS TOCAR (SETLIST):*`);
    songs.forEach((song, idx) => {
      const artistPart = song.artist ? ` - ${song.artist}` : '';
      const tonePart = song.tone ? ` [Tom: ${song.tone}]` : '';
      const linkPart = song.link ? `\n   🔗 ${song.link}` : '';
      lines.push(`${idx + 1}. *${song.title}*${artistPart}${tonePart}${linkPart}`);
    });
  }

  lines.push('');
  lines.push(`🙏 _"Tudo o que fizerem, façam de todo o coração, como para o Senhor." (Colossenses 3:23)_`);
  lines.push(`_Por favor, confirmem o recebimento e cheguem 30min antes para afinação!_`);

  return lines.join('\n');
}

export function openWhatsAppWithMessage(text: string): void {
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (err) {
    console.error('Erro ao copiar texto', err);
    return false;
  }
}
