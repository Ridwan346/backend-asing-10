const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const app = express()
const port = 5000

// CUSTOM CORS MIDDLEWARE - Must be FIRST
app.use((req, res, next) => {
  // Set CORS headers on every response
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Max-Age', '86400');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(cors())
app.use(express.json())

const uri = "mongodb+srv://Social-Development:xg3GiMwIckyrSuqi@cluster0.gkum75l.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let EventColl, EventParticipate;
let isConnected = false;

async function connectDB() {
  try {
    if (!isConnected) {
      await client.connect();
      const myDB = client.db("userEvent");
      EventColl = myDB.collection("Event");
      EventParticipate = myDB.collection('participate');
      isConnected = true;
      await client.db("admin").command({ ping: 1 });
      console.log("Connected to MongoDB!");
    }
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

// Root route
app.get("/", (req, res) => {
  res.send("API is running");
});

// Events routes
app.post('/events', async (req, res) => {
  try {
    if (!EventColl) await connectDB();
    let user = req.body;
    console.log('new event', user);
    let result = await EventColl.insertOne(user);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get('/events', async (req, res) => {
  try {
    if (!EventColl) await connectDB();
    const result = await EventColl.find().toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get('/events/:id', async (req, res) => {
  try {
    if (!EventColl) await connectDB();
    const id = req.params.id;
    const result = await EventColl.findOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.delete("/deleteEvent/:id", async (req, res) => {
  try {
    if (!EventColl) await connectDB();
    const id = req.params.id;
    const userEmail = req.body.email;
    const event = await EventColl.findOne({ _id: new ObjectId(id) });
    if (!event) return res.status(404).send({ message: "Event not found" });

    if (event.email !== userEmail) {
      return res.status(403).send({ message: "Not authorized" });
    }

    const result = await EventColl.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/myEvents/:email", async (req, res) => {
  try {
    if (!EventColl) await connectDB();
    const email = req.params.email;
    const events = await EventColl.find({ email }).toArray();
    res.send(events);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.put("/updateEvent/:id", async (req, res) => {
  try {
    if (!EventColl) await connectDB();
    const { id } = req.params;
    const { _id, email, ...updatedData } = req.body;
    const result = await EventColl.updateOne({ _id: new ObjectId(id) }, { $set: updatedData });
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/events/search", async (req, res) => {
  try {
    if (!EventColl) await connectDB();
    const search = req.query.search || "";
    if (!search) {
      return res.send([]);
    }
    const query = {
      title: { $regex: search, $options: "i" }
    };
    const result = await EventColl.find(query).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Event participation routes
app.post('/events/participate', async (req, res) => {
  try {
    if (!EventParticipate) await connectDB();
    let user = req.body;
    console.log('new participation', user);
    let result = await EventParticipate.insertOne(user);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.get("/joinedEvents/:email", async (req, res) => {
  try {
    if (!EventParticipate) await connectDB();
    const email = req.params.email;
    const result = await EventParticipate
      .find({ email: email })
      .sort({ date: 1 })
      .toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Initialize database connection
connectDB().catch(console.error);

module.exports = app;
