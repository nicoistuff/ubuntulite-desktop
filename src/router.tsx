import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { createHashHistory, createMemoryHistory } from "@tanstack/history";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const isServer = typeof window === "undefined";
  const history = isServer ? createMemoryHistory({ initialEntries: ["/"] }) : createHashHistory();

  const router = createRouter({
    routeTree,
    history,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
