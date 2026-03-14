import multer from "multer";
import path from "path";

// Speicherort und Dateiname definieren
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ordner "uploads" im Projektverzeichnis
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // z. B. 1684241234.jpg
  },
});

// Dateifilter (z. B. nur Bilder erlauben)
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf" || // Optional: PDF-Dateien erlauben
      file.mimetype === "application/msword" || // Optional: Word-Dokumente erlauben
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") { // Optional: Word-Dokumente (docx) erlauben
    // Hier können weitere Dateitypen hinzugefügt werden, falls erforderlich

    cb(null, true);
  } else {
    cb(new Error("Nur Bilddateien sind erlaubt!"));
  }
};

const upload = multer({ storage, fileFilter });

export default upload;
