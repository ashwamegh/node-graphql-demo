const express = require('express');
const { graphql, buildSchema } = require('graphql');
const ExpressGraphQL = require('express-graphql');
const sqlite3 = require('sqlite3').verbose();


const app = express();

//  Initialize SQLite DB
const database = new sqlite3.Database('./my.db');
const createContactTable = () => {
  const query = `
      CREATE TABLE IF NOT EXISTS contacts (
      id integer PRIMARY KEY,
      firstName text,
      lastName text,
      email text UNIQUE)`;
  return database.run(query);
}
createContactTable();


