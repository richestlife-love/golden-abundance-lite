import { createRoute } from "@tanstack/react-router";
import HomeScreen from "../screens/HomeScreen";
import { authedRoute } from "./_authed";

export const homeRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: "/home",
  component: HomeScreen,
});
