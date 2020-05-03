"use strict";

// Module dependencies
const prismic = require("prismic-javascript");
const prismicDom = require("prismic-dom");
const app = require("./config");
const prismicConfig = require("./prismic-configuration");
const port = app.get("port");
const asyncHandler = require("./utils/async-handler");
const defaultLang = "en-us";
const isoLangs = require("./utils/iso-langs");

// Listen to application port.
app.listen(port, () => {
  process.stdout.write(`Point your browser to: http://localhost:${port}\n`);
});

// Root path redirects to default language
app.get("/", (req, res) => {
  res.redirect(defaultLang);
});

// Middleware to fetch Prismic api object
app.get(
  "*",
  asyncHandler(async (req, res, next) => {
    const api = await prismic.api(prismicConfig.apiEndpoint, {
      req,
      accessToken: prismicConfig.accessToken,
    });

    if (api) {
      req.prismic = { api };
    } else {
      res.status(404).render("error-handlers/404");
    }
    next();
  })
);

// Prismic preview route
app.get(
  "/preview",
  asyncHandler(async (req, res) => {
    const token = req.query.token;
    if (token) {
      const url = await req.prismic.api.previewSession(
        token,
        prismicConfig.linkResolver,
        "/"
      );
      res.redirect(302, url);
    } else {
      throw new Error("Missing token from preview querystring");
    }
  })
);

// Middleware to set local variables & fetch menu content from Prismic
app.get(
  ["/:lang", "/:lang/*"],
  asyncHandler(async (req, res, next) => {
    const lang = req.params.lang;

    // Set locals variables in res to be used in view templates
    res.locals.ctx = {
      apiEndpoint: prismicConfig.apiEndpoint,
      linkResolver: prismicConfig.linkResolver,
    };
    res.locals.prismicDom = prismicDom;

    // Fetch menu content from Prismic and add it to local variables
    let menuContent = await req.prismic.api.getSingle("navigation", { lang });
    if (!menuContent) {
      menuContent = await req.prismic.api.getSingle("navigation", {
        lang: defaultLang,
      });
    }

    let global = await req.prismic.api.getSingle("global", { lang });
    if (!global) {
      global = await req.prismic.api.getSingle("global", {
        lang: defaultLang,
      });
    }

    res.locals.menuContent = menuContent;
    res.locals.global = global;
    res.locals.currentUrl = req.originalUrl;
    res.locals.isoLangs = isoLangs;
    next();
  })
);

// Homepage route
app.get(
  "/:lang/",
  asyncHandler(async (req, res) => {
    const lang = req.params.lang;
    const document = await req.prismic.api.getByUID("page", "home", { lang });
    if (document) {
      res.render("page", { document });
    } else {
      res.status(404).render("error-handlers/error");
    }
  })
);

// Page router
app.get(
  "/:lang/:uid",
  asyncHandler(async (req, res) => {
    const lang = req.params.lang;
    const uid = req.params.uid;

    const document = await req.prismic.api.getByUID("page", uid, {
      lang: lang,
      fetchLinks: [
        "download_group.title",
        "download_group.preview_images",
        "download_group.download_link_text",
        "download_group.download_files",
      ],
    });

    if (document) {
      res.render("page", { document });
      // console.log(document);
    } else {
      res.status(404).render("error-handlers/notfound");
    }
  })
);

// 404 route for anything else
app.get("*", (req, res) => {
  res.status(404).render("error-handlers/notfound");
});

module.exports = app;
