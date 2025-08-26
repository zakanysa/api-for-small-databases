const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const { Client: PgClient } = require('pg');
const { MongoClient } = require('mongodb');
const path = require('path');

class DatabaseManager {
  constructor() {
    this.connections = new Map();
    this.connectionCounter = 0;
  }

  generateConnectionId() {
    return `conn_${++this.connectionCounter}_${Date.now()}`;
  }

  async connect(type, config) {
    const connectionId = this.generateConnectionId();
    
    try {
      let connection;
      
      switch (type.toLowerCase()) {
        case 'sqlite':
          connection = await this.connectSQLite(config);
          break;
        case 'mysql':
          connection = await this.connectMySQL(config);
          break;
        case 'postgresql':
        case 'postgres':
          connection = await this.connectPostgreSQL(config);
          break;
        case 'mongodb':
        case 'mongo':
          connection = await this.connectMongoDB(config);
          break;
        default:
          throw new Error(`Unsupported database type: ${type}`);
      }

      this.connections.set(connectionId, {
        type: type.toLowerCase(),
        connection,
        config,
        createdAt: new Date()
      });

      return {
        connectionId,
        type: type.toLowerCase(),
        message: 'Connected successfully'
      };
    } catch (error) {
      throw new Error(`Failed to connect to ${type}: ${error.message}`);
    }
  }

  async connectSQLite(config) {
    return new Promise((resolve, reject) => {
      const dbPath = config.path || './database.db';
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(db);
        }
      });
    });
  }

  async connectMySQL(config) {
    const connection = await mysql.createConnection({
      host: config.host || 'localhost',
      user: config.user || 'root',
      password: config.password || '',
      database: config.database
    });
    
    await connection.ping();
    return connection;
  }

  async connectPostgreSQL(config) {
    const client = new PgClient({
      host: config.host || 'localhost',
      user: config.user || 'postgres',
      password: config.password || '',
      database: config.database,
      port: config.port || 5432
    });
    
    await client.connect();
    return client;
  }

  async connectMongoDB(config) {
    const uri = config.uri || `mongodb://${config.host || 'localhost'}:${config.port || 27017}/${config.database}`;
    const client = new MongoClient(uri);
    await client.connect();
    return client;
  }

  getConnection(connectionId) {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      throw new Error(`Connection ${connectionId} not found`);
    }
    return conn;
  }

  async getTables(connectionId) {
    const { type, connection } = this.getConnection(connectionId);
    
    switch (type) {
      case 'sqlite':
        return this.getSQLiteTables(connection);
      case 'mysql':
        return this.getMySQLTables(connection);
      case 'postgresql':
      case 'postgres':
        return this.getPostgreSQLTables(connection);
      case 'mongodb':
      case 'mongo':
        return this.getMongoDBCollections(connection);
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }

  async getSQLiteTables(db) {
    return new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.name));
      });
    });
  }

  async getMySQLTables(connection) {
    const [rows] = await connection.execute('SHOW TABLES');
    return rows.map(row => Object.values(row)[0]);
  }

  async getPostgreSQLTables(client) {
    const result = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
    );
    return result.rows.map(row => row.table_name);
  }

  async getMongoDBCollections(client) {
    const db = client.db();
    const collections = await db.listCollections().toArray();
    return collections.map(col => col.name);
  }

  async executeQuery(connectionId, query, params = []) {
    const { type, connection } = this.getConnection(connectionId);
    
    switch (type) {
      case 'sqlite':
        return this.executeSQLiteQuery(connection, query, params);
      case 'mysql':
        return this.executeMySQLQuery(connection, query, params);
      case 'postgresql':
      case 'postgres':
        return this.executePostgreSQLQuery(connection, query, params);
      case 'mongodb':
      case 'mongo':
        throw new Error('Use MongoDB-specific methods for document operations');
      default:
        throw new Error(`Unsupported database type: ${type}`);
    }
  }

  async executeSQLiteQuery(db, query, params) {
    return new Promise((resolve, reject) => {
      if (query.trim().toUpperCase().startsWith('SELECT')) {
        db.all(query, params, (err, rows) => {
          if (err) reject(err);
          else resolve({ rows, rowCount: rows.length });
        });
      } else {
        db.run(query, params, function(err) {
          if (err) reject(err);
          else resolve({ 
            rows: [], 
            rowCount: this.changes,
            lastID: this.lastID 
          });
        });
      }
    });
  }

  async executeMySQLQuery(connection, query, params) {
    const [rows, fields] = await connection.execute(query, params);
    return { 
      rows: Array.isArray(rows) ? rows : [], 
      rowCount: Array.isArray(rows) ? rows.length : rows.affectedRows || 0
    };
  }

  async executePostgreSQLQuery(client, query, params) {
    const result = await client.query(query, params);
    return { 
      rows: result.rows, 
      rowCount: result.rowCount 
    };
  }

  async disconnect(connectionId) {
    const conn = this.connections.get(connectionId);
    if (!conn) return false;

    try {
      switch (conn.type) {
        case 'sqlite':
          conn.connection.close();
          break;
        case 'mysql':
          await conn.connection.end();
          break;
        case 'postgresql':
        case 'postgres':
          await conn.connection.end();
          break;
        case 'mongodb':
        case 'mongo':
          await conn.connection.close();
          break;
      }
      
      this.connections.delete(connectionId);
      return true;
    } catch (error) {
      console.error(`Error disconnecting ${connectionId}:`, error);
      return false;
    }
  }

  listConnections() {
    const connections = [];
    for (const [id, conn] of this.connections) {
      connections.push({
        id,
        type: conn.type,
        createdAt: conn.createdAt
      });
    }
    return connections;
  }
}

module.exports = new DatabaseManager();