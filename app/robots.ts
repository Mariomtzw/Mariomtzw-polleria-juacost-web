import type { MetadataRoute } from "next";

// El sitio público se puede indexar; el panel privado y las APIs no.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
  };
}
