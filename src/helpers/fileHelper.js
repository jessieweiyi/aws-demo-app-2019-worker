import fs from 'fs';
import path from 'path';

export default class FileHelper {
  static createFolderRecursivelyIfNotExist(targetDir) {
    targetDir.split('/').forEach((dir, index, splits) => {
      const parent = splits.slice(0, index).join('/');
      const dirPath = path.resolve(parent, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
      }
    });
  }

  static deleteFolderRecursively(fileFolder) {
    if (fs.existsSync(fileFolder)) {
      fs.readdirSync(fileFolder).forEach((file) => {
        const curPath = path.join(fileFolder, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          FileHelper.deleteFolderRecursive(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });

      fs.rmdirSync(fileFolder);
    }
  }
}
