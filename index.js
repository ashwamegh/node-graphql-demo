const express = require("express");
const { graphql, buildSchema } = require("graphql");
const ExpressGraphQL = require("express-graphql");
const sqlite3 = require("sqlite3").verbose();
const cors = require('cors');

const app = express();

//  Initialize SQLite DB
const database = new sqlite3.Database("./my.db");

database.runAsync = (sql, params=[]) => {
  return new Promise( (resolve, reject) => {
    database.run(sql,params,(err) => {
          if (err)
              reject(err);
          else
              resolve();
      });
  })
};

database.getAsync = (sql) => {
  return new Promise((resolve, reject) => {
    database.get(sql, (err, row) =>{
      resolve(row["id"])
    })
  })
}

database.allAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    database.all(sql, params, (err, rows) => {
      if (err) {
          reject([]);
      }
      resolve(rows);
    })
  })
}

(async () => {
  const createQuery = `
  CREATE TABLE IF NOT EXISTS contacts (
  id integer PRIMARY KEY,
  firstName text,
  lastName text,
  email text UNIQUE)`;
  return await database.run(createQuery);
})();

const schema = buildSchema(`
  type Contact{
    id: ID,
    firstName: String,
    lastName: String,
    email: String
  }

  type Query{
    contacts: [Contact],
    contact(id: ID!): Contact
  }

  type Mutation{
    createContact(firstName: String!, lastName: String!, email: String!): Contact,
    updateContact(id: ID!, firstName: String, lastName: String, email: String): String,
    deleteContact(id: ID!): String
  }
`);

const root = {
  contacts: async () => {
    return await database.allAsync("Select * from contacts;");
  },

  contact: async ({ id }) => {
    const output = await database.allAsync("SELECT * FROM contacts WHERE id = (?);", [id]);
    return output[0];
  },

  createContact: async ({ firstName, lastName, email }) => {
    const output = await database.runAsync(
      "INSERT INTO contacts (firstName, lastName, email) VALUES (?,?,?);",
      [firstName, lastName, email]
    );
    const id = await database.getAsync("SELECT last_insert_rowid() as id");
    return {
      id,
      firstName,
      lastName,
      email
    };
  },

  updateContact: async ({ id, firstName, lastName, email }) => {
    await database.run(
      "UPDATE contacts SET firstName = (?), lastName = (?), email = (?) WHERE id = (?);",
      [firstName, lastName, email, id]
    );
    return `Contact #${id} updated`;
  },

  deleteContact: async ({ id }) => {
    await database.run("DELETE from contacts WHERE id =(?);", [id]);
    return `Contact #${id} deleted`;
  }
};

app.use(cors());

app.use(
  "/graphql",
  ExpressGraphQL({
    schema,
    rootValue: root
  })
);


app.listen(3000);
console.log("Server is running onto http://localhost:3000");
