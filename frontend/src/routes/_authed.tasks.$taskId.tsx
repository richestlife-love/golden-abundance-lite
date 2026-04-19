import { createRoute } from "@tanstack/react-router";
import TaskDetailScreen from "../screens/TaskDetailScreen";
import { tasksRoute } from "./_authed.tasks";

export const taskDetailRoute = createRoute({
  getParentRoute: () => tasksRoute,
  path: "/$taskId",
  component: TaskDetailScreen,
});
