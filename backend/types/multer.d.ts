// types/multer.d.ts
declare namespace Express {
    interface Request {
        file?: Express.Multer.File;
        files?: Express.Multer.File[];
    }
}