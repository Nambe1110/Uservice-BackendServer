import multer from "multer";
import path from "path";

const upload = multer({
  storage: multer.memoryStorage({}),
  limits: 1024 * 1024 * 2, // file limit: 2MB
  fileFilter: (req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
      return callback("Only png, jpg and jpeg images are allowed", false);
    }
    return callback(null, true);
  },
});

export default upload;
