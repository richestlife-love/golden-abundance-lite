import { createRoute } from "@tanstack/react-router";
import MyScreen from "../screens/MyScreen";
import { authedRoute } from "./_authed";

export const meRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/me",
  component: MyScreen,
});
