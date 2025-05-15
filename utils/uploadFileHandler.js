import multer from "multer"


const storage = multer.memoryStorage()

export const upload = multer({ storage: storage })


// import path from "path"


// const FILE_TYPE = {
//     'image/png' : 'png',
//     'image/jpeg' : 'jpeg',
//     'image/jpg' : 'jpg'
// }

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         const isValidFormat = FILE_TYPE[file.mimetype]
//         let uploadError = new Error("Invalid Image Type")

//         if(isValidFormat){
//             uploadError = null
//         }

//       cb(uploadError, 'public/uploads')
//     },
//     filename: function (req, file, cb) {
//     //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)

//         const uniqueFile = `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
  
//       cb(null, uniqueFile)
//     }
//   })
  
  // export const upload = multer({ storage: storage })