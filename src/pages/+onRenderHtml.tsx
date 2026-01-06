export { onRenderHtml };

import React from "react";
import ReactDOMServer from "react-dom/server";
import { escapeInject, dangerouslySkipEscape } from "vike/server";
import type { OnRenderHtmlAsync } from "vike/types";
import { metaTags } from "../config/seo";

const onRenderHtml: OnRenderHtmlAsync = async (
  pageContext
): ReturnType<OnRenderHtmlAsync> => {
  const { Page } = pageContext;

  const pageHtml = ReactDOMServer.renderToString(
    React.createElement(Page as React.ComponentType)
  );

  const documentHtml = escapeInject`<!DOCTYPE html>
    <html lang="en">
      <head>
        ${dangerouslySkipEscape(metaTags)}
      </head>
      <body>
        <div id="root">${dangerouslySkipEscape(pageHtml)}</div>
        <script type="module" src="https://cdn.jsdelivr.net/npm/ionicons@7.4.0/dist/ionicons/ionicons.esm.js"></script>
        <script nomodule src="https://cdn.jsdelivr.net/npm/ionicons@7.4.0/dist/ionicons/ionicons.js"></script>
      </body>
    </html>`;

  return {
    documentHtml,
    pageContext: {},
  };
};
