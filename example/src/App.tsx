import React, { useCallback, useEffect } from "react";
import { Task, ViewMode, Gantt, CapacityChartValue } from "gantt-task-react";
import { getStartEndDateForProject, initTasks } from "./helper";
import "gantt-task-react/dist/index.css";
import { ViewSwitcher } from "./components/view-switcher";

// Init
const App = () => {
  const [view, setView] = React.useState<ViewMode>(ViewMode.Day);
  const [tasks, setTasks] = React.useState<Task[]>(initTasks());
  const [capacityChartValues, setCapacityChartValues] = React.useState<
    CapacityChartValue[]
  >([]);
  const [isChecked, setIsChecked] = React.useState(true);
  let columnWidth = 65;
  if (view === ViewMode.Year) {
    columnWidth = 350;
  } else if (view === ViewMode.Month) {
    columnWidth = 300;
  } else if (view === ViewMode.Week) {
    columnWidth = 250;
  }

  const handleTaskChange = (task: Task) => {
    console.log("On date change Id:" + task.id, task.data);
    let newTasks = tasks.map(t => (t.id === task.id ? task : t));
    if (task.project) {
      const [start, end] = getStartEndDateForProject(newTasks, task.project);
      const project = newTasks[newTasks.findIndex(t => t.id === task.project)];
      if (
        project.start.getTime() !== start.getTime() ||
        project.end.getTime() !== end.getTime()
      ) {
        const changedProject = { ...project, start, end };
        newTasks = newTasks.map(t =>
          t.id === task.project ? changedProject : t
        );
      }
    }
    setTasks(newTasks);
  };

  const handleTaskDelete = (task: Task) => {
    const conf = window.confirm("Are you sure about " + task.name + " ?");
    if (conf) {
      setTasks(tasks.filter(t => t.id !== task.id));
    }
    return conf;
  };

  const handleProgressChange = async (task: Task) => {
    setTasks(tasks.map(t => (t.id === task.id ? task : t)));
    console.log("On progress change Id:" + task.id);
  };

  const handleDblClick = (task: Task) => {
    alert("On Double Click event Id:" + task.id);
  };

  const handleClick = (task: Task) => {
    console.log("On Click event Id:" + task.id);
  };

  const handleSelect = (task: Task, isSelected: boolean) => {
    console.log(task.name + " has " + (isSelected ? "selected" : "unselected"));
  };

  const handleExpanderClick = (task: Task) => {
    setTasks(tasks.map(t => (t.id === task.id ? task : t)));
    console.log("On expander click Id:" + task.id);
  };

  const calculateTimeByPeriod = (
    tasks: Task[],
    filterType: ViewMode,
    weekStartsOn: 0 | 1 = 1
  ): CapacityChartValue[] => {
    if (tasks.length === 0) return [];

    const validTasks = tasks.filter(
      task =>
        task.type === "task" &&
        !isNaN(task.start.getTime()) &&
        !isNaN(task.end.getTime())
    );

    if (validTasks.length === 0) return [];

    const minStart = new Date(
      Math.min(...validTasks.map(task => task.start.getTime()))
    );
    const maxEnd = new Date(
      Math.max(...validTasks.map(task => task.end.getTime()))
    );

    const getFirstDayOfPeriod = (date: Date): Date => {
      switch (filterType) {
        case "Day":
          return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        case "Week":
          const weekStart = new Date(date);
          weekStart.setDate(
            date.getDate() - ((date.getDay() - weekStartsOn + 7) % 7)
          );
          return new Date(
            weekStart.getFullYear(),
            weekStart.getMonth(),
            weekStart.getDate()
          );
        case "Month":
          return new Date(date.getFullYear(), date.getMonth(), 1);
        case "Year":
          return new Date(date.getFullYear(), 0, 1);
        default:
          return new Date(date);
      }
    };

    const mapDuration: Record<string, number> = {};
    let cursor = new Date(minStart);

    // Preencher todos os períodos
    while (cursor <= maxEnd) {
      const periodStart = getFirstDayOfPeriod(cursor);
      const key = `${periodStart.getFullYear()}-${
        periodStart.getMonth() + 1
      }-${periodStart.getDate()} 00:00:00`;

      if (!mapDuration[key]) {
        mapDuration[key] = 0;
      }

      // Avançar o cursor
      switch (filterType) {
        case "Day":
          cursor.setDate(cursor.getDate() + 1);
          break;
        case "Week":
          cursor.setDate(cursor.getDate() + 7);
          break;
        case "Month":
          cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
          break;
        case "Year":
          cursor = new Date(cursor.getFullYear() + 1, 0, 1);
          break;
      }
    }

    // Calcular durações
    validTasks.forEach(task => {
      let current = new Date(task.start);

      while (current <= task.end) {
        const periodStart = getFirstDayOfPeriod(current);
        const nextPeriod = new Date(periodStart);

        switch (filterType) {
          case "Day":
            nextPeriod.setDate(periodStart.getDate() + 1);
            break;
          case "Week":
            nextPeriod.setDate(periodStart.getDate() + 7);
            break;
          case "Month":
            nextPeriod.setMonth(periodStart.getMonth() + 1);
            break;
          case "Year":
            nextPeriod.setFullYear(periodStart.getFullYear() + 1);
            break;
        }

        const overlapStart = Math.max(current.getTime(), periodStart.getTime());
        const overlapEnd = Math.min(task.end.getTime(), nextPeriod.getTime());
        const durationTimes = overlapEnd - overlapStart;

        if (durationTimes > 0) {
          const key = `${periodStart.getFullYear()}-${
            periodStart.getMonth() + 1
          }-${periodStart.getDate()} 00:00:00`;
          mapDuration[key] += durationTimes;
        }

        current = new Date(nextPeriod);
      }
    });

    // Formatar resultado
    return Object.entries(mapDuration)
      .sort(
        ([a], [b]) =>
          new Date(a.split(" ")[0]).getTime() -
          new Date(b.split(" ")[0]).getTime()
      )
      .map(([key, value]) => ({
        date: new Date(key),
        value: Number(value),
        name: "h",
      }))
      .filter(item => item.value > 0);
  };
  useEffect(() => {
    const newCapacityChartValues = calculateTimeByPeriod(tasks, view);
    console.log("chart", newCapacityChartValues);
    setCapacityChartValues(newCapacityChartValues);
  }, [view, tasks]);

  return (
    <div className="Wrapper">
      <ViewSwitcher
        onViewModeChange={viewMode => setView(viewMode)}
        onViewListChange={setIsChecked}
        isChecked={isChecked}
      />
      <h3>Gantt With Unlimited Height</h3>
      <Gantt
        tasks={tasks}
        viewMode={view}
        onDateChange={handleTaskChange}
        onDelete={handleTaskDelete}
        onProgressChange={handleProgressChange}
        onDoubleClick={handleDblClick}
        onClick={handleClick}
        onSelect={handleSelect}
        onExpanderClick={handleExpanderClick}
        // listCellWidth={isChecked ? "155px" : ""}
        columnWidth={columnWidth}
        // barBackgroundColor="#ff0000"
        // arrowIndent={10}
        ganttHeight={320}
        TooltipContent={() => <></>}
        onScrollCloseToBottom={e => {
          console.log("final task in view");
          console.log(e);
        }}
        /////////////////////////////////////////////////////////////
        //example using capacity chart
        capacityChart={capacityChartValues}
        capacityChartHeigth={160}
      />
      {/* <h3>Gantt With Limited Height</h3>
      <Gantt
        tasks={tasks}
        viewMode={view}
        onDateChange={handleTaskChange}
        onDelete={handleTaskDelete}
        onProgressChange={handleProgressChange}
        onDoubleClick={handleDblClick}
        onClick={handleClick}
        onSelect={handleSelect}
        onExpanderClick={handleExpanderClick}
        listCellWidth={isChecked ? "155px" : ""}
        ganttHeight={300}
        columnWidth={columnWidth}
      /> */}
    </div>
  );
};

// const Teste =(props: {
//     rowHeight: number;
//     rowWidth: string;
//     fontFamily: string;
//     fontSize: string;
//     locale: string;
//     tasks: Task[];
//     selectedTaskId: string;
//     setSelectedTask: (taskId: string) => void;
//     onExpanderClick: (task: Task) => void;
// }) => {

//   console.log(props,'teste')
//   return (
//     <div>
//       <h1>{props.locale}</h1>
//     </div>
//   )
// }

// const Header =(props: {
//     headerHeight: number;
//     rowWidth: string;
//     fontFamily: string;
//     fontSize: string;
// }) => {

// console.log(props,'Header')
// return (
//   <div>
//     <h1>{'Header'}</h1>
//   </div>
// )
// }

export default App;
