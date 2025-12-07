// index.js (for Vercel)
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const cors = require("cors");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// --- Mongo URI (from env) ---
const MONGO_URI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jnrtdky.mongodb.net/?retryWrites=true&w=majority`;

// Reuse client across invocations (important for serverless)
async function getDb() {
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(MONGO_URI, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
    await global._mongoClient.connect();
    console.log("🟢 Mongo connected (new client)");
  } else if (!global._mongoClient.topology || !global._mongoClient.topology.isConnected()) {
    // safety reconnect if needed
    await global._mongoClient.connect();
    console.log("🟢 Mongo reconnected");
  } else {
    // reuse
    // console.log("🟡 Reusing existing Mongo client");
  }

  return global._mongoClient.db("hobbyDB");
}

// ---------- ROUTES ----------

// health
app.get("/", (req, res) => {
  res.send("Hobby Server (Vercel) — OK");
});

// get all hobbies
app.get("/hobby", async (req, res) => {
  try {
    const db = await getDb();
    const hobbyCollection = db.collection("hobby");
    const data = await hobbyCollection.find().toArray();
    res.json(data);
  } catch (err) {
    console.error("/hobby error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// create hobby
app.post("/hobby", async (req, res) => {
  try {
    const db = await getDb();
    const hobbyCollection = db.collection("hobby");
    const result = await hobbyCollection.insertOne(req.body);
    res.json(result);
  } catch (err) {
    console.error("/hobby POST error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// get by id
app.get("/hobby/:id", async (req, res) => {
  try {
    const db = await getDb();
    const hobbyCollection = db.collection("hobby");
    const id = req.params.id;
    const item = await hobbyCollection.findOne({ _id: new ObjectId(id) });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    console.error("/hobby/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// update
app.put("/hobby/:id", async (req, res) => {
  try {
    const db = await getDb();
    const hobbyCollection = db.collection("hobby");
    const id = req.params.id;
    const result = await hobbyCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: req.body },
      { upsert: true }
    );
    res.json(result);
  } catch (err) {
    console.error("/hobby PUT error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// delete hobby
app.delete("/hobby/:id", async (req, res) => {
  try {
    const db = await getDb();
    const hobbyCollection = db.collection("hobby");
    const id = req.params.id;
    const result = await hobbyCollection.deleteOne({ _id: new ObjectId(id) });
    res.json(result);
  } catch (err) {
    console.error("/hobby DELETE error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --------------- join / my-groups logic ---------------

app.post("/join-group", async (req, res) => {
  try {
    const { groupId, email } = req.body;
    if (!groupId || !email) return res.status(400).json({ error: "groupId and email required" });

    const db = await getDb();
    const myGroupCollection = db.collection("myGroups");

    const already = await myGroupCollection.findOne({ groupId, userEmail: email });
    if (already) {
      return res.json({ acknowledged: true, message: "Already joined" });
    }

    const result = await myGroupCollection.insertOne({ groupId, userEmail: email });
    res.json(result);
  } catch (err) {
    console.error("/join-group error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/my-groups", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.json([]);

    const db = await getDb();
    const myGroupCollection = db.collection("myGroups");
    const hobbyCollection = db.collection("hobby");

    const joined = await myGroupCollection.find({ userEmail: email }).toArray();
    if (!joined.length) return res.json([]);

    const groupIds = joined.map((item) => new ObjectId(item.groupId));
    const groups = await hobbyCollection.find({ _id: { $in: groupIds } }).toArray();
    res.json(groups);
  } catch (err) {
    console.error("/my-groups error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/check-join", async (req, res) => {
  try {
    const { groupId, email } = req.query;
    if (!groupId || !email) return res.json({ joined: false });

    const db = await getDb();
    const myGroupCollection = db.collection("myGroups");
    const joined = await myGroupCollection.findOne({ groupId, userEmail: email });
    res.json({ joined: !!joined });
  } catch (err) {
    console.error("/check-join error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/leave-group/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const email = req.query.email;
    if (!id || !email) return res.status(400).json({ error: "id and email required" });

    const db = await getDb();
    const myGroupCollection = db.collection("myGroups");
    const result = await myGroupCollection.deleteOne({ groupId: id, userEmail: email });
    res.json(result);
  } catch (err) {
    console.error("/leave-group error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Export the app for Vercel (NO app.listen)
module.exports = app;
