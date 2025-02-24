import React from "react";
import { CapacityChartColumnProps, CapacityChartColumns } from "./capacity-chart-columns";

export type CapacityChartProps = CapacityChartColumnProps;
export const CapacityChart: React.FC<CapacityChartProps> = props => {
  return (
    <g className="grid">
      <CapacityChartColumns {...props} />
    </g>
  );
};
