export { onRenderClient };

import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import type { OnRenderClientAsync } from "vike/types";
import "../utils/analytics";

Sentry.init({
  dsn: "https://3510aa762c1f3e6a5a15f960cc8ae234@o464504.ingest.us.sentry.io/4510668124061696",
  sendDefaultPii: true,
});

const onRenderClient: OnRenderClientAsync = async (
  pageContext
): ReturnType<OnRenderClientAsync> => {
  const { Page } = pageContext;

  const container = document.getElementById("root")!;

  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(Page as React.ComponentType));
};
