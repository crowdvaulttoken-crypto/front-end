// Import Dependencies
import { Navigate } from "react-router";

// Local Imports
import { AppLayout } from "app/layouts/AppLayout";
import { DynamicLayout } from "app/layouts/DynamicLayout";
import AuthGuard from "middleware/AuthGuard";

// ----------------------------------------------------------------------

const protectedRoutes = {
  id: "protected",
  Component: AuthGuard,
  children: [
    // The dynamic layout supports both the main layout and the sideblock.
    {
      Component: DynamicLayout,
      children: [
        {
          index: true,
          element: <Navigate to="/dashboards" />,
        },
        {
          path: "dashboards",
          children: [
            {
              index: true,
              element: <Navigate to="/dashboards/home" />,
            },
            {
              path: "home",
              lazy: async () => ({
                Component: (await import("app/pages/dashboards/home")).Home2,
              }),
            },
            {
              path: "tree",
              lazy: async () => ({
                Component: (await import("app/pages/dashboards/tree")).default,
              }),
            },
            {
              path: "activate",
              lazy: async () => ({
                Component: (await import("app/pages/dashboards/activate")).default,
              }),
            },
            {
              path: "broker",
              lazy: async () => ({
                Component: (await import("app/pages/dashboards/activate")).Broker,
              }),
            },
          ],
        },       
        {
          path: "wallets",
          children: [
            {
              index: true,
              element: <Navigate to="/wallets/withdraw" />,
            },
            {
              path: "withdraw",
              lazy: async () => ({
                Component: (await import("app/pages/wallets/withdraw")).default,
              }),
            },
            {
              path: "deposit",
              lazy: async () => ({
                Component: (await import("app/pages/wallets/deposit")).default,
              }),
            },
          ],
        },
        {
          path: "rewards",
          children: [
            {
              index: true,
              element: <Navigate to="/rewards/referral" />,
            },
            {
              path: "referral",
              lazy: async () => ({
                Component: (await import("app/pages/rewards")).default,
              }),
            },
            {
              path: "leadership",
              lazy: async () => ({
                Component: (await import("app/pages/rewards")).Leadership,
              }),
            },
            {
              path: "passive",
              lazy: async () => ({
                Component: (await import("app/pages/rewards")).Passive,
              }),
            },
          ],
        },        
      ],
    },
    // The app layout supports only the main layout. Avoid using it for other layouts.
    {
      Component: AppLayout,
      children: [
        {
          path: "settings",
          lazy: async () => ({
            Component: (await import("app/pages/settings/Layout")).default,
          }),
          children: [
            {
              index: true,
              element: <Navigate to="/settings/general" />,
            },
            {
              path: "general",
              lazy: async () => ({
                Component: (await import("app/pages/settings/sections/General"))
                  .default,
              }),
            },
            {
              path: "appearance",
              lazy: async () => ({
                Component: (
                  await import("app/pages/settings/sections/Appearance")
                ).default,
              }),
            },
          ],
        },
      ],
    },
  ],
};

export { protectedRoutes };
