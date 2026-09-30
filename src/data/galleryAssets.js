const galleryFiles = import.meta.glob(
  "../assets/gallery/*.{png,jpg,jpeg,webp}",
  { eager: true, query: "?url", import: "default" }
);

const galleryCaptions = {
  "cultural-event-group.jpg": {
    caption: "Expressions in Motion",
    alt: "Students performing a traditional cultural dance",
  },
  "cultural-event-group2.jpg": {
    caption: "Tradition Takes the Stage",
    alt: "Cultural committee members in traditional attire",
  },
  "cultural-event-group3.jpg": {
    caption: "Together We Celebrate",
    alt: "Students gathered together during a cultural event",
  },
  "cultural-event-group4.jpg": {
    caption: "A Portrait of Cultural Spirit",
    alt: "Cultural committee group photograph",
  },
  "fashion-show.jpg": {
    caption: "Style, Tradition, and Confidence Take the Spotlight",
    alt: "Students posing in colorful outfits at a cultural fashion show",
  },
  "fashion-show-group.jpg": {
    caption: "Tradition on the Runway, Confidence in Every Step",
    alt: "Students in vibrant traditional and contemporary outfits at a fashion show",
  },
};

const galleryAssets = Object.entries(galleryFiles).map(([path, src]) => {
  const filename = path.split("/").pop();
  const content = galleryCaptions[filename] || {
    caption: "Celebrating Campus Culture",
    alt: "Cultural committee event photograph",
  };

  return {
    src,
    ...content,
  };
});

export default galleryAssets;
