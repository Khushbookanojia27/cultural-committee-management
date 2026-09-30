function GalleryLightbox({ image, onClose, onPrevious, onNext }) {
  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#071323]/95 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Expanded gallery image"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close enlarged image"
        className="absolute right-5 top-5 rounded-full border border-white/40 px-4 py-2 text-2xl leading-none text-white hover:bg-white/10"
      >
        x
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onPrevious();
        }}
        aria-label="Previous gallery image"
        className="absolute left-4 rounded-full border border-white/40 px-4 py-3 text-2xl text-white hover:bg-white/10 sm:left-8"
      >
        &#8592;
      </button>
      <figure className="max-h-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
        <img src={image.src} alt={image.alt} className="max-h-[85vh] w-auto rounded-xl object-contain shadow-2xl" />
        <figcaption className="mt-3 text-center text-sm font-semibold text-white">{image.caption}</figcaption>
      </figure>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onNext();
        }}
        aria-label="Next gallery image"
        className="absolute right-4 rounded-full border border-white/40 px-4 py-3 text-2xl text-white hover:bg-white/10 sm:right-8"
      >
        &#8594;
      </button>
    </div>
  );
}

export default GalleryLightbox;
