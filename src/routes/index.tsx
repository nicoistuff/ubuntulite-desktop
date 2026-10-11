import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Desktop } from '@/components/desktop/desktop';
export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: 'Ubuntu 26.04 LTS — Browser Desktop' },
    { name: 'description', content: 'An interactive, browser-based recreation of the Ubuntu 26.04 LTS desktop.' },
    { property: 'og:title', content: 'Ubuntu 26.04 LTS — Browser Desktop' },
    { property: 'og:description', content: 'Explore an Ubuntu desktop with movable windows, a dock and application overview, entirely in your browser.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: Index,
});
function Index() {
  return <Desktop />;
}
