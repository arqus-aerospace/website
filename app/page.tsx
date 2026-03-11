"use client";

import HeroDemo from "@/components/demo";
import InfiniteGallery from "@/components/ui/3d-gallery-photography";
import GalleryOverlay from "@/components/ui/gallery-overlay";
import Footer from "@/components/footer";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const galleryImages = [
  { src: `${BASE}/photos/01_Orbital_Datacenters_Starcloud_Space_AI_Compute.jpg`, alt: "Orbital Datacenters", label: "Orbital Datacenters" },
  { src: `${BASE}/photos/05_Commercial_Space_Station_ISS_Predecessor.jpg`, alt: "Commercial Space Station", label: "Space Domain Awareness" },
  { src: `${BASE}/photos/05_Commercial_Space_Station_Starlab_Voyager_Airbus.jpg`, alt: "Starlab Space Station", label: "Software-Defined EW" },
  { src: `${BASE}/photos/05_Commercial_Space_Station_Lunar_Base_Concept.jpg`, alt: "Lunar Base Concept", label: "Robotic Servicing" },
  { src: `${BASE}/photos/07_Space_Defense_Satellite_Laser_Network.jpeg`, alt: "Space Defense Satellite Laser Network", label: "Directed Energy" },
  { src: `${BASE}/photos/08_Reusable_Launch_SpaceX_Starship_Orbital_Refueling.jpg`, alt: "Reusable Launch", label: "Reusable Launch Systems" },
  { src: `${BASE}/photos/09_Satellite_Broadband_Global_Constellation_Map.jpg`, alt: "Satellite Broadband Constellation", label: "Global Broadband Constellations" },
  { src: `${BASE}/photos/10_On_Orbit_Servicing_ClearSpace_Debris_Capture.jpg`, alt: "On-Orbit Servicing", label: "Orbital Debris Capture" },
  { src: `${BASE}/photos/10_On_Orbit_Servicing_Space_Assembly_Concept.jpg`, alt: "Space Assembly Concept", label: "On-Orbit Assembly" },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroDemo />
      <section className="relative h-screen w-full bg-black">
        <InfiniteGallery
          images={galleryImages}
          speed={3}
          visibleCount={12}
          className="h-full w-full"
          onEscapeTop={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          onEscapeBottom={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
        />
        <GalleryOverlay />
      </section>
      <Footer />
    </main>
  );
}
