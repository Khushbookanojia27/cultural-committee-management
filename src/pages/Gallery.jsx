import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import GalleryLightbox from "../components/GalleryLightbox";
import galleryAssets from "../data/galleryAssets";

function Gallery() {
  const [activeIndex, setActiveIndex] = useState(null);
  const activeImage = activeIndex === null ? null : galleryAssets[activeIndex];

  const showPrevious = () => {
    setActiveIndex((current) => (current - 1 + galleryAssets.length) % galleryAssets.length);
  };

  const showNext = () => {
    setActiveIndex((current) => (current + 1) % galleryAssets.length);
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#10162E] px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <header className="mb-12 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#F5B800]">Cultural Committee</p>
            <h1 className="mt-3 text-5xl font-bold text-white">Event Gallery</h1>
            <p className="mx-auto mt-4 max-w-2xl text-gray-300">Moments from our performances, celebrations, and campus events.</p>
          </header>

          {galleryAssets.length === 0 ? (
            <div className="rounded-2xl border border-[#F5B800]/50 bg-[#08162E] p-12 text-center text-gray-300">
              <h2 className="text-2xl font-bold text-white">Gallery photos are ready to be added</h2>
              <p className="mx-auto mt-3 max-w-xl">Add the provided event photographs to the local gallery asset folder and they will appear here automatically with captions and lightbox viewing.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {galleryAssets.map((image, index) => (
                <button
                  type="button"
                  key={image.src}
                  onClick={() => setActiveIndex(index)}
                  className="group overflow-hidden rounded-2xl border-2 border-[#F5B800]/60 bg-[#08162E] text-left shadow-xl"
                >
                  <img src={image.src} alt={image.alt} className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" />
                  <span className="block px-5 py-4 text-sm font-semibold text-white">{image.caption}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <GalleryLightbox image={activeImage} onClose={() => setActiveIndex(null)} onPrevious={showPrevious} onNext={showNext} />
    </>
  );
}

export default Gallery;
