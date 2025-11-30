const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

console.log(process.env.DB_USER);
console.log(process.env.DB_PASS);

//HobbyHub
//zMmSihaJbA9vGPDx

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jnrtdky.mongodb.net/?appName=Cluster0`;

// const uri = "mongodb+srv://HobbyHub:zMmSihaJbA9vGPDx@cluster0.jnrtdky.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const database = client.db("hobbyDB");
    const hobbyCollection = database.collection("hobby");

    app.get("/hobby", async (req, res) => {
      const cursor = hobbyCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/hobby", async (req, res) => {
      const newHobby = req.body;
      console.log(newHobby);
      const result = await hobbyCollection.insertOne(newHobby);
      res.send(result);
    });

     app.get('/hobby/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id:  new ObjectId(id)}
      const result = await hobbyCollection.findOne(query);
      res.send(result);
    })


       app.put('/hobby/:id', async(req,res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const option = {upsert:true};
      const updatedHobby = req.body;
      const updatedDoc = {
        $set: updatedCoffee
      } 
        const result = await hobbyCollection.updateOne(filter,updatedDoc,option);

      res.send(result);
    })

  

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hobby Server");
});

app.listen(port, () => {
  console.log(`Hobby server is running  ${port}`);
});
