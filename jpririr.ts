const calculateHoursByPeriod = (
  tasks: Task[],
  filterType: ViewMode,
  weekStartsOn: 0 | 1 = 1
): CapacityChartValue[] => {
  // 1. Verificação inicial de tarefas vazias
  if (tasks.length === 0) return [];

  // 2. Filtra tarefas válidas do tipo 'task' com datas corretas
  const validTasks = tasks.filter(
    task =>
      task.type === "task" &&
      !isNaN(task.start.getTime()) && // Verifica se a data de início é válida
      !isNaN(task.end.getTime())      // Verifica se a data de término é válida
  );

  // 3. Retorna vazio se nenhuma tarefa válida encontrada
  if (validTasks.length === 0) return [];

  // 4. Encontra a data mais antiga e mais recente entre todas as tarefas
  const minStart = new Date(Math.min(...validTasks.map(task => task.start.getTime())));
  const maxEnd = new Date(Math.max(...validTasks.map(task => task.end.getTime())));

  // 5. Função para obter o primeiro dia do período de acordo com o filtro
  const getFirstDayOfPeriod = (date: Date): Date => {
    switch (filterType) {
      case "Day":
        // Para dia: mantém a mesma data (YYYY-MM-DD 00:00:00)
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      case "Week":
        // Para semana: ajusta para segunda-feira (ou dia configurado)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - ((date.getDay() - weekStartsOn + 7) % 7));
        return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
      case "Month":
        // Para mês: primeiro dia do mês (YYYY-MM-01 00:00:00)
        return new Date(date.getFullYear(), date.getMonth(), 1);
      case "Year":
        // Para ano: primeiro dia do ano (YYYY-01-01 00:00:00)
        return new Date(date.getFullYear(), 0, 1);
      default:
        return new Date(date);
    }
  };

  // 6. Mapa para armazenar a duração acumulada por período
  const mapDuration: Record<string, number> = {};
  let cursor = new Date(minStart); // Data inicial para varredura

  // 7. Preenchimento inicial de todos os períodos possíveis
  while (cursor <= maxEnd) {
    const periodStart = getFirstDayOfPeriod(cursor);
    console.log(periodStart) // DEBUG: Mostra as datas geradas

    // 8. Cria chave no formato 'YYYY-M-D 00:00:00'
    const key = `${periodStart.getFullYear()}-${periodStart.getMonth() + 1}-${periodStart.getDate()} 00:00:00`;

    // 9. Inicializa período com 0 se não existir
    if (!mapDuration[key]) {
      mapDuration[key] = 0;
    }

    // 10. Avança o cursor para o próximo período
    switch (filterType) {
      case "Day":
        cursor.setDate(cursor.getDate() + 1); // +1 dia
        break;
      case "Week":
        cursor.setDate(cursor.getDate() + 7); // +1 semana
        break;
      case "Month":
        cursor.setMonth(cursor.getMonth() + 1); // +1 mês
        break;
      case "Year":
        cursor.setFullYear(cursor.getFullYear() + 1); // +1 ano
        break;
    }
  }

  // 11. Calcula a duração real das tarefas em cada período
  validTasks.forEach(task => {
    let current = new Date(task.start);

    while (current <= task.end) {
      const periodStart = getFirstDayOfPeriod(current);
      const nextPeriod = new Date(periodStart);

      // 12. Define o fim do período atual
      switch (filterType) {
        case "Day":
          nextPeriod.setDate(periodStart.getDate() + 1); // Fim: próximo dia
          break;
        case "Week":
          nextPeriod.setDate(periodStart.getDate() + 7); // Fim: próxima semana
          break;
        case "Month":
          nextPeriod.setMonth(periodStart.getMonth() + 1); // Fim: próximo mês
          break;
        case "Year":
          nextPeriod.setFullYear(periodStart.getFullYear() + 1); // Fim: próximo ano
          break;
      }

      // 13. Calcula sobreposição entre tarefa e período
      const overlapStart = Math.max(task.start.getTime(), periodStart.getTime());
      const overlapEnd = Math.min(task.end.getTime(), nextPeriod.getTime());
      const durationHours = (overlapEnd - overlapStart); // EM MILISSEGUNDOS

      // 14. Atualiza o mapa se houver sobreposição
      if (durationHours > 0) {
        const key = `${periodStart.getFullYear()}-${periodStart.getMonth() + 1}-${periodStart.getDate()} 00:00:00`;
        if(mapDuration[key]){
          mapDuration[key] += durationHours; // PROBLEMA: Está somando milissegundos, não horas
        }
      }

      current = new Date(nextPeriod); // Avança para próximo período
    }
  });

  // 15. Formata o resultado final
  return Object.entries(mapDuration)
    // Ordena pelas datas (convertendo a parte da data da chave)
    .sort(([a], [b]) => new Date(a.split(" ")[0]).getTime() - new Date(b.split(" ")[0]).getTime())
    // Mapeia para o formato de saída
    .map(([key, value]) => ({
      date: new Date(key),
      value: Number(value), // VALOR INCORRETO: ainda está em milissegundos
      name: "h"
    }))
    .filter(item => item.value > 0); // Filtra valores zerados
}
