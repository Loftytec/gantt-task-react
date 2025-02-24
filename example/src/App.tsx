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

  //example using capacity chart
  const calculateHoursByPeriod = useCallback(
    (tasks: Task[], filterType: ViewMode): CapacityChartValue[]=> {
      if (tasks.length === 0) return [];

      // Filtra apenas as tarefas do tipo "task"
      const tasksForReal = tasks.filter(task => task.type === "task");

      // Encontra a menor data de início e a maior data de término
      const minStart = new Date(Math.min(...tasksForReal.map(task => task.start.getTime())));
      const maxEnd = new Date(Math.max(...tasksForReal.map(task => task.end.getTime())));

      // Criar mapa baseado no filtro escolhido
      const mapDuration: { [key: string]: number } = {};
      let cursor = new Date(minStart);

      while (cursor <= maxEnd) {
        let key: string;

        switch (filterType) {
          case "Day":
            key = cursor.toISOString().split("T")[0] + " 00:00:00";
            cursor.setDate(cursor.getDate() + 1);
            break;
          case "Week":
            cursor.setDate(cursor.getDate() - cursor.getDay() + 1); // Ajusta para segunda-feira
            key = cursor.toISOString().split("T")[0] + " 00:00:00";
            cursor.setDate(cursor.getDate() + 7);
            break;
          case "Month":
            cursor.setDate(1); // Primeiro dia do mês
            key = cursor.toISOString().split("T")[0] + " 00:00:00";
            cursor.setMonth(cursor.getMonth() + 1);
            break;
          case "Year":
            cursor.setMonth(0, 1); // Primeiro dia do ano
            key = cursor.toISOString().split("T")[0] + " 00:00:00";
            cursor.setFullYear(cursor.getFullYear() + 1);
            break;
        }

        mapDuration[key] = 0;
      }

      // Percorre todas as tarefas e adiciona o tempo correto por período
      tasksForReal.forEach(task => {
        let current = new Date(task.start);

        while (current <= task.end) {
          let key: string;

          switch (filterType) {
            case "Day":
              key = current.toISOString().split("T")[0] + " 00:00:00";
              current.setDate(current.getDate() + 1);
              break;
            case "Week":
              current.setDate(current.getDate() - current.getDay() + 1);
              key = current.toISOString().split("T")[0] + " 00:00:00";
              current.setDate(current.getDate() + 7);
              break;
            case "Month":
              current.setDate(1);
              key = current.toISOString().split("T")[0] + " 00:00:00";
              current.setMonth(current.getMonth() + 1);
              break;
            case "Year":
              current.setMonth(0, 1);
              key = current.toISOString().split("T")[0] + " 00:00:00";
              current.setFullYear(current.getFullYear() + 1);
              break;
          }

          const periodStart = new Date(key);
          const periodEnd = new Date(periodStart);

          // Define o fim do período baseado no filtro
          if (filterType === "Day") periodEnd.setHours(23, 59, 59, 999);
          else if (filterType === "Week") periodEnd.setDate(periodStart.getDate() + 6);
          else if (filterType === "Month") periodEnd.setMonth(periodStart.getMonth() + 1, 0);
          else if (filterType === "Year") periodEnd.setFullYear(periodStart.getFullYear() + 1, 0, 0);

          const overlapStart = Math.max(task.start.getTime(), periodStart.getTime());
          const overlapEnd = Math.min(task.end.getTime(), periodEnd.getTime());
          const overlapDuration = (overlapEnd - overlapStart)

          if (overlapDuration > 0) {
            mapDuration[key] += overlapDuration;
          }
        }
      });
      return Object.keys(mapDuration)
      .sort()
      .map((key) => ({
        date: new Date(key),
        value: mapDuration[key],
        name: mapDuration[key] === 0 ? "" : "h",
      }));
    }, []
  );


  useEffect(() => {
    const newCapacityChartValues = calculateHoursByPeriod(tasks, view);
    console.log("chart", newCapacityChartValues);
    setCapacityChartValues(newCapacityChartValues);
  }, [view, tasks, calculateHoursByPeriod]);

  // useEffect(() => {
  //   const newCapacityChartValues = calcularHorasPorPeriodo(tasks, view);
  //   console.log("chart", newCapacityChartValues);
  //   setCapacityChartValues(newCapacityChartValues);
  // }, [view, tasks, calcularHorasPorPeriodo]);

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
