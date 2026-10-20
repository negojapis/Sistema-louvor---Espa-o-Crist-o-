import type { Service, ScheduleAssignment, Member, Song } from '../types';

export function formatServiceDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' });
    const monthName = d.toLocaleDateString('pt-BR', { month: 'long' });
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${day} de ${
      monthName.charAt(0).toUpperCase() + monthName.slice(1)
    } de ${year}`;
  } catch {
    return dateStr;
  }
}

export function generateWhatsAppScheduleText(params: {
  service: Service;
  schedule: (ScheduleAssignment & { member?: Member })[];
  songs: Song[];
}): string {
  const { service, schedule, songs } = params;
  const formattedDate = formatServiceDate(service.date);

  const louvor = schedule.filter((s) => s.ministry_section !== 'multimidia');
  const multimidia = schedule.filter((s) => s.ministry_section === 'multimidia');

  const lines: string[] = [
    `⛪ *ESPAÇO CRISTÃO — MINISTÉRIO DE LOUVOR*`,
    `✨ *ESCALA DO CULTO*`,
    `📌 *${service.title.toUpperCase()}*`,
    `🗓️ *Data:* ${formattedDate}`,
    `⏰ *Horário:* ${service.time}`,
  ];

  if (service.notes) {
    lines.push(`📝 *Avisos:* ${service.notes}`);
  }

  lines.push('');
  lines.push(`🎵 *EQUIPE DE LOUVOR & CONDUÇÃO:*`);
  if (louvor.length === 0) {
    lines.push(`• _(Nenhum integrante escalado ainda)_`);
  } else {
    louvor.forEach((item) => {
      lines.push(`• *${item.role_name}:* ${item.member?.name || 'A definir'}`);
    });
  }

  lines.push('');
  lines.push(`🎛️ *EQUIPE DE MULTIMÍDIA:*`);
  if (multimidia.length === 0) {
    lines.push(`• _(Nenhum integrante escalado ainda)_`);
  } else {
    multimidia.forEach((item) => {
      const leaderNote = item.member?.is_leader ? ' (Líder)' : '';
      lines.push(`• *${item.role_name}:* ${item.member?.name || 'A definir'}${leaderNote}`);
    });
  }

  if (songs.length > 0) {
    lines.push('');
    lines.push(`🎶 *REPERTÓRIO DE MÚSICAS:*`);
    songs.forEach((song, idx) => {
      const tonePart = song.tone ? ` (Tom: ${song.tone})` : '';
      const linkPart = song.link ? `\n   🔗 ${song.link}` : '';
      lines.push(`${idx + 1}. *${song.title}*${tonePart}${linkPart}`);
    });
  }

  lines.push('');
  lines.push(`🙏 _"Tudo o que fizerem, façam de todo o coração, como para o Senhor." (Colossenses 3:23)_`);
  lines.push(`_Favor confirmar o recebimento no grupo!_`);

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
