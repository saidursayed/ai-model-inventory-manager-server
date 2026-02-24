const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");
require("dotenv").config()
const serviceAccount = require("./ai-model-inventory-manager-ai-firebase-adminsdk-key.json");
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri =
  `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@simple-crud-server.63zgbdx.mongodb.net/?appName=simple-crud-server`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("AI Model Inventory Manager Server");
});

const verifyToken = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.decoded = decoded;

    next();
  } catch (error) {
    return res.status(401).send({ message: "unauthorized access" });
  }
};

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
        .sort({ createdAt: -1})
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
    app.get("/models/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await aiModelCollection.findOne(query);
      res.send(result);
    });

    // add model
    app.post("/add-model", verifyToken, async (req, res) => {
      const newModel = req.body;
      const result = await aiModelCollection.insertOne(newModel);
      res.send(result);
    });

    // my model
    app.get("/my-models", verifyToken, async (req, res) => {
      const email = req.query.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const cursor = aiModelCollection.find({
        createdBy: email,
      });
      const result = await cursor.toArray();
      res.send(result);
    });

    // purchased model 
    app.post("/purchased-models/:id", verifyToken, async (req, res) => {
      const data = req.body;
      const id = req.params.id;
      const result = await purchasedCollection.insertOne(data);

      // Purchased Count
      const filter = { _id: new ObjectId(id) };
      const update = {
        $inc: {
          purchased: 1,
        },
      };
      const purchasedCount = await aiModelCollection.updateOne(filter, update);
      res.send({ result, purchasedCount });
    });

    // my purchased model 
    app.get("/my-purchased-models", verifyToken, async (req, res) => {
      const email = req.query.email;
      if(email !== req.decoded.email){
        return res.status(403).send({ message: "forbidden access" });
      }
      const cursor = purchasedCollection.find({ purchasedBy: email });
      const result = await cursor.toArray();
      res.send(result);
    });

    // update model
    app.put("/models/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const updatedModel = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: updatedModel,
      };
      const result = await aiModelCollection.updateOne(query, update);
      res.send(result);
    });

    // delete model
    app.delete("/models/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await aiModelCollection.deleteOne(query);
      res.send(result);
    });

    // search model
    app.get("/search", async (req, res) => {
      const search = req.query.search;
      const result = await aiModelCollection
        .find({ name: { $regex: search, $options: "i" } })
        .toArray();
      res.send(result);
    });

    // filter model
    app.get("/filter-models", async (req, res) => {
      const framework = req.query.framework;
      const query = {};
      if (framework) {
        query.framework = framework;
      }
      const result = await aiModelCollection.find(query).toArray();

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
