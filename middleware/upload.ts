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
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Nur Bilddateien sind erlaubt!"));
  }
};

const upload = multer({ storage, fileFilter });

export default upload;
