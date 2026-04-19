import { createRoute } from "@tanstack/react-router";
import TasksScreen from "../screens/TasksScreen";
import { authedRoute } from "./_authed";

export const tasksRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/tasks",
  component: TasksScreen,
});
