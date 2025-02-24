import React, { ReactChild } from "react";
import { addToDate } from "../../helpers/date-helper";
import styles from "./capacity-chart.module.css";
import { CapacityChartValue } from "../../types/public-types";

export type CapacityChartColumnProps = {
  capacityChartValue: CapacityChartValue[];
  dates: Date[];
  svgWidth: number;
  columnWidth: number;
  height: number;
  todayColor: string;
  rtl: boolean;
};
export const CapacityChartColumns: React.FC<CapacityChartColumnProps> = ({
  capacityChartValue,
  dates,
  svgWidth,
  columnWidth,
  height,
  todayColor,
  rtl,
}) => {
  const capacityChartRows: ReactChild[] = [
    <rect
      key="SingleRow"
      x="0"
      y="0"
      width={svgWidth}
      height={height} // Altura baseada no total de tarefas
      className={styles.capacityChartRowSumsTime}
    />,
  ];

  const rowLines: ReactChild[] = [
    <line
      key="RowLineLast"
      x="0"
      y1={height} // Última linha no final de todas as tarefas
      x2={svgWidth}
      y2={height}
      className={styles.capacityChartRowLine}
    />,
  ];
  let y = height;

  const now = new Date();
  let tickX = 0;
  const ticks: ReactChild[] = [];
  let today: ReactChild = <rect />;
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    ticks.push(
      <line
        key={date.getTime()}
        x1={tickX}
        y1={0}
        x2={tickX}
        y2={y}
      />
    );
    if (
      (i + 1 !== dates.length &&
        date.getTime() < now.getTime() &&
        dates[i + 1].getTime() >= now.getTime()) ||
      // if current date is last
      (i !== 0 &&
        i + 1 === dates.length &&
        date.getTime() < now.getTime() &&
        addToDate(
          date,
          date.getTime() - dates[i - 1].getTime(),
          "millisecond"
        ).getTime() >= now.getTime())
    ) {
      today = (
        <rect
          key={`today-${now.getTime()}`}
          x={tickX}
          y={0}
          width={columnWidth}
          height={y}
          fill={todayColor}
        />
      );
    }
    // rtl for today
    if (
      rtl &&
      i + 1 !== dates.length &&
      date.getTime() >= now.getTime() &&
      dates[i + 1].getTime() < now.getTime()
    ) {
      today = (
        <rect
          key={`today-rtl-${now.getTime()}`}
          x={tickX + columnWidth}
          y={0}
          width={columnWidth}
          height={y}
          fill={todayColor}
        />
      );
    }
    tickX += columnWidth;
  }

  const capacityValueDates = new Set(
    capacityChartValue.map(task => new Date(task.date).toString()) // Normaliza para comparação
  );

  const maxValue = Math.max(...capacityChartValue.map(task => task.value), 1);

  const coloredColumns: ReactChild[] = [];

  let tickxx = 0;

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const dateStr = date.toString(); // Normaliza para "YYYY-MM-DD"

    // Apenas adiciona a cor se houver tarefa nessa data
    if (capacityValueDates.has(dateStr)) {

      const task = capacityChartValue.find(
        task => new Date(task.date).toString() === dateStr
      );
      const taskValue = task?.value || 0;

      // Calcula a altura proporcional
      const columnHeight = (taskValue / maxValue) * (y - 16);

      coloredColumns.push(
        <g key={`group-${i}-${date.getTime()}`}>
          <rect
            key={`col-${i}-${date.getTime()}`}
            x={tickxx + 5}
            y={y - columnHeight}
            width={columnWidth - 10}
            height={columnHeight}
            rx="5"
            className={styles.columnSums}
          />
          {task?.name && (
            <text
              x={tickxx + columnWidth / 2}
              y={y - columnHeight - 12}
              textAnchor="middle"
              alignmentBaseline="hanging"
              fontSize="12"
              fill="black"
              fontWeight="600"
              style={{ zIndex: 99999 }}
            >
              {task.name}
            </text>
          )}
        </g>
      );
    }

    ticks.push(
      <line
        key={`tick-${i}-${date.getTime()}`}
        x1={tickxx}
        y1={0}
        x2={tickxx}
        y2={y}
      />
    );

    tickxx += columnWidth;
  }

  return (
    <g className="capacityChartBody">
      <g className="rows">{capacityChartRows}</g>
      <g className="rowLines">{rowLines}</g>
      <g className="ticks">{ticks}</g>
      <g className="coloredColumns">{coloredColumns}</g>{" "}
      <g className="today">{today}</g>
    </g>
  );
};
