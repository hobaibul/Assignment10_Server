const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// ---- MongoDB Connection (BEST PRACTICE for Vercel) ----
let client = null;
let db = null;

async function initDB() {
  if (db) return db;

  if (!client) {
    client = new MongoClient(
      `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jnrtdky.mongodb.net/?retryWrites=true&w=majority`,
      {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
      }
    );
  }

  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }

  db = client.db("hobbyDB");
  return db;
}

// ---------------------------------------

app.get("/", async (req, res) => {
  res.send("Vercel Express Server Running!");
});

app.get("/hobby", async (req, res) => {
  try {
    const db = await initDB();
    const hobbyCollection = db.collection("hobby");

    const data = await hobbyCollection.find().toArray();
    res.send(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

app.get("/hobby/:id", async (req, res) => {
  try {
    const db = await initDB();
    const hobbyCollection = db.collection("hobby");

    const id = req.params.id;
    const item = await hobbyCollection.findOne({ _id: new ObjectId(id) });
    res.send(item);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// 🔥 Vercel requires exporting app instead of listen()
module.exports = app;
