const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AI Model Inventory Manager Server");
});

const uri =
  "mongodb+srv://ai-model-inventory-manager-db:5HaN8ztFHznoN2t1@simple-crud-server.63zgbdx.mongodb.net/?appName=simple-crud-server";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("ai-model-db");
    const aiModelCollection = db.collection("ai-models");
    const purchasedCollection = db.collection("purchased-models");

    // latest models
    app.get("/latest-models", async (req, res) => {
      const cursor = aiModelCollection
        .find()
        .sort({ createdAt: "desc" })
        .limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    // all models
    app.get("/models", async (req, res) => {
      const cursor = aiModelCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // single model
    app.get("/models/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await aiModelCollection.findOne(query);
      res.send(result);
    });

    // add model
    app.post("/add-model", async (req, res) => {
      const newModel = req.body;
      const result = await aiModelCollection.insertOne(newModel);
      res.send(result);
    });

    // my model
    app.get("/my-models", async (req, res) => {
      const email = req.query.email;
      const cursor = aiModelCollection.find({
        createdBy: email,
      });
      const result = await cursor.toArray();
      res.send(result);
    });

    
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`AI Model Inventory Manager Server is listening on port ${port}`);
});
