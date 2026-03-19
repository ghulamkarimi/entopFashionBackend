// import multer from "multer";
// import path from "path";
// import sharp from "sharp";

// // Speicherort und Dateiname definieren
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/"); // Ordner "uploads" im Projektverzeichnis
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname)); // z. B. 1684241234.jpg
//   },
// });

// // Dateifilter (z. B. nur Bilder erlauben)
// const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
//   if (file.mimetype.startsWith("image/") ||
//       file.mimetype === "application/pdf" || // Optional: PDF-Dateien erlauben
//       file.mimetype === "application/msword" || // Optional: Word-Dokumente erlauben
//       file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") { // Optional: Word-Dokumente (docx) erlauben
//     // Hier können weitere Dateitypen hinzugefügt werden, falls erforderlich

//     cb(null, true);
//   } else {
//     cb(new Error("Nur Bilddateien sind erlaubt!"));
//   }
// };

// const upload = multer({ storage, fileFilter });

// export default upload;


import multer from "multer";

// Wir nutzen MemoryStorage, um das Bild im RAM zu puffern
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Nur Bilddateien sind erlaubt!") as any, false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Optional: Limit 5MB
});

export default upload;