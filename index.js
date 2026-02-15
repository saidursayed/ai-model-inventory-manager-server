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

    // latest models
    app.get("/latest-models", async (req, res) => {
      const cursor = aiModelCollection
        .find()
        .sort({ createdAt: "desc" })
        .limit(6);
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
