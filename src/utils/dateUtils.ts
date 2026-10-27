// Utilitários de data e hora com foco nos cultos de Domingo
// Suporte ao fuso horário America/Sao_Paulo

/**
 * Retorna a data e hora atual no fuso horário oficial de Brasília (America/Sao_Paulo)
 */
export function getNowInSaoPaulo(): Date {
  const now = new Date();
  const spString = now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
  return new Date(spString);
}

/**
 * Retorna o mês atual formatado como YYYY-MM (ex: "2026-10")
 */
export function getCurrentMonthKey(): string {
  const spNow = getNowInSaoPaulo();
  const year = spNow.getFullYear();
  const month = String(spNow.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Formata uma chave de mês (YYYY-MM) para exibição elegante em português (ex: "Outubro de 2026")
 */
export function formatMonthKeyLabel(monthKey: string): string {
  try {
    const [yearStr, monthStr] = monthKey.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const date = new Date(year, month - 1, 15);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`;
  } catch {
    return monthKey;
  }
}

/**
 * Retorna todos os domingos de um determinado mês e ano (formato YYYY-MM-DD)
 * Garante que o calendário exiba estritamente apenas os domingos do mês.
 */
export function getSundaysOfMonth(year: number, month: number): string[] {
  const sundays: string[] = [];
  // month é 1-indexed (1 = Jan, 12 = Dez)
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day);
    // 0 = Domingo
    if (d.getDay() === 0) {
      const dayStr = String(day).padStart(2, '0');
      const monthStr = String(month).padStart(2, '0');
      sundays.push(`${year}-${monthStr}-${dayStr}`);
    }
  }

  return sundays;
}

/**
 * Formata data de domingo por extenso (ex: "Domingo, 18 de Outubro")
 */
export function formatSundayDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const monthName = d.toLocaleDateString('pt-BR', { month: 'long' });
    return `Domingo, ${day} de ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;
  } catch {
    return dateStr;
  }
}

/**
 * Formata dia e mês resumido (ex: "18/10")
 */
export function formatShortDate(dateStr: string): string {
  try {
    const [, month, day] = dateStr.split('-');
    return `${day}/${month}`;
  } catch {
    return dateStr;
  }
}

/**
 * Gera lista de opções de meses ao redor do mês atual para o seletor
 */
export function generateMonthOptions(centerMonthKey?: string, rangeCount: number = 4): { value: string; label: string }[] {
  const center = centerMonthKey ? centerMonthKey : getCurrentMonthKey();
  const [cYear, cMonth] = center.split('-').map(Number);

  const options: { value: string; label: string }[] = [];

  for (let offset = -1; offset <= rangeCount; offset++) {
    const d = new Date(cYear, cMonth - 1 + offset, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const value = `${y}-${m}`;
    options.push({
      value,
      label: formatMonthKeyLabel(value),
    });
  }

  return options;
}
