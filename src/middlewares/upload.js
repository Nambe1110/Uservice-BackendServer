// eslint-disable-next-line import/no-extraneous-dependencies
import multer from "multer";
// import path from "path";
// import fs from "fs";

// const dir = "./uploads";
// const upload = multer({
//   storage: multer.diskStorage({
//     destination: (req, file, callback) => {
//       if (!fs.existsSync(dir)) {
//         fs.mkdirSync(dir);
//       }
//       callback(null, "./uploads");
//     },
//     filename: (req, file, callback) => {
//       callback(
//         null,
//         `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
//       );
//     },
//   }),
//   fileFilter: (req, file, callback) => {
//     const ext = path.extname(file.originalname);
//     if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
//       return callback(/* res.end('Only images are allowed') */ null, false);
//     }
//     return callback(null, true);
//   },
// });

const upload = multer({ storage: multer.memoryStorage() });

export default upload;
