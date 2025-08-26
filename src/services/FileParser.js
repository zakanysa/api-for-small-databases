const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

class FileParser {
  constructor() {
    this.parsedFiles = new Map();
    this.fileCounter = 0;
  }

  generateFileId() {
    return `file_${++this.fileCounter}_${Date.now()}`;
  }

  async parseFile(filePath, options = {}) {
    const fileId = this.generateFileId();
    const ext = path.extname(filePath).toLowerCase();
    
    try {
      let result;
      
      switch (ext) {
        case '.csv':
          result = await this.parseCSV(filePath, options);
          break;
        case '.xlsx':
        case '.xls':
          result = await this.parseExcel(filePath, options);
          break;
        case '.json':
          result = await this.parseJSON(filePath);
          break;
        default:
          throw new Error(`Unsupported file type: ${ext}`);
      }

      this.parsedFiles.set(fileId, {
        ...result,
        originalPath: filePath,
        fileId,
        parsedAt: new Date()
      });

      return {
        fileId,
        ...result
      };
    } catch (error) {
      throw new Error(`Failed to parse file: ${error.message}`);
    }
  }

  async parseCSV(filePath, options = {}) {
    return new Promise((resolve, reject) => {
      const results = [];
      let headers = [];
      let rowCount = 0;

      fs.createReadStream(filePath)
        .pipe(csv({
          separator: options.delimiter || ',',
          skipEmptyLines: options.skipEmpty !== false,
          headers: options.headers !== false
        }))
        .on('headers', (headerList) => {
          headers = headerList;
        })
        .on('data', (data) => {
          results.push(data);
          rowCount++;
        })
        .on('end', () => {
          resolve({
            type: 'csv',
            data: results,
            headers: headers.length > 0 ? headers : Object.keys(results[0] || {}),
            rowCount,
            metadata: {
              delimiter: options.delimiter || ',',
              hasHeaders: options.headers !== false
            }
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  async parseExcel(filePath, options = {}) {
    const workbook = XLSX.readFile(filePath);
    const sheets = {};
    const sheetNames = workbook.SheetNames;
    
    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: options.headers !== false ? 1 : undefined,
        defval: options.defaultValue || '',
        blankrows: options.includeBlankRows || false
      });
      
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
      const headers = [];
      
      if (options.headers !== false) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
          const cellValue = worksheet[cellAddress];
          headers.push(cellValue ? cellValue.v : `Column${col + 1}`);
        }
      }

      sheets[sheetName] = {
        data: jsonData,
        headers: headers.length > 0 ? headers : Object.keys(jsonData[0] || {}),
        rowCount: jsonData.length,
        range: worksheet['!ref']
      };
    }

    return {
      type: 'excel',
      sheets,
      sheetNames,
      activeSheet: sheetNames[0],
      metadata: {
        totalSheets: sheetNames.length
      }
    };
  }

  async parseJSON(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    let processedData;
    let headers = [];
    let rowCount = 0;

    if (Array.isArray(data)) {
      processedData = data;
      rowCount = data.length;
      if (data.length > 0 && typeof data[0] === 'object') {
        headers = Object.keys(data[0]);
      }
    } else if (typeof data === 'object') {
      processedData = [data];
      rowCount = 1;
      headers = Object.keys(data);
    } else {
      throw new Error('JSON file must contain an object or array of objects');
    }

    return {
      type: 'json',
      data: processedData,
      headers,
      rowCount,
      metadata: {
        isArray: Array.isArray(data),
        originalType: typeof data
      }
    };
  }

  getParsedFile(fileId) {
    const file = this.parsedFiles.get(fileId);
    if (!file) {
      throw new Error(`File ${fileId} not found`);
    }
    return file;
  }

  getFileData(fileId, sheetName = null) {
    const file = this.getParsedFile(fileId);
    
    if (file.type === 'excel') {
      const sheet = sheetName || file.activeSheet;
      if (!file.sheets[sheet]) {
        throw new Error(`Sheet ${sheet} not found`);
      }
      return file.sheets[sheet];
    } else {
      return {
        data: file.data,
        headers: file.headers,
        rowCount: file.rowCount
      };
    }
  }

  getFileSchema(fileId, sheetName = null) {
    const fileData = this.getFileData(fileId, sheetName);
    const schema = {};
    
    if (fileData.data.length > 0) {
      const sampleRow = fileData.data[0];
      
      fileData.headers.forEach(header => {
        const value = sampleRow[header];
        let type = 'string';
        
        if (value !== null && value !== undefined) {
          if (!isNaN(value) && !isNaN(parseFloat(value))) {
            type = Number.isInteger(Number(value)) ? 'integer' : 'float';
          } else if (typeof value === 'boolean') {
            type = 'boolean';
          } else if (value instanceof Date || !isNaN(Date.parse(value))) {
            type = 'date';
          }
        }
        
        schema[header] = {
          type,
          nullable: value === null || value === undefined || value === ''
        };
      });
    }
    
    return schema;
  }

  listParsedFiles() {
    const files = [];
    for (const [id, file] of this.parsedFiles) {
      files.push({
        fileId: id,
        type: file.type,
        originalPath: file.originalPath,
        parsedAt: file.parsedAt,
        rowCount: file.type === 'excel' 
          ? Object.values(file.sheets).reduce((total, sheet) => total + sheet.rowCount, 0)
          : file.rowCount
      });
    }
    return files;
  }

  removeFile(fileId) {
    return this.parsedFiles.delete(fileId);
  }

  static validateFileType(filename) {
    const allowedExtensions = ['.csv', '.xlsx', '.xls', '.json'];
    const ext = path.extname(filename).toLowerCase();
    return allowedExtensions.includes(ext);
  }

  static getFileInfo(filePath) {
    const stats = fs.statSync(filePath);
    return {
      name: path.basename(filePath),
      extension: path.extname(filePath),
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  }
}

module.exports = new FileParser();