const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();

// Middleware
app.use(express.json());

// CORS headers - must be set before any routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Max-Age', '86400');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

const uri = "mongodb+srv://Social-Development:xg3GiMwIckyrSuqi@cluster0.gkum75l.mongodb.net/?appName=Cluster0";

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
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/events', async (req, res) => {
    try {
        if (!EventColl) await connectDB();
        const result = await EventColl.find().toArray();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/events/:id', async (req, res) => {
    try {
        if (!EventColl) await connectDB();
        const id = req.params.id;
        const result = await EventColl.findOne({ _id: new ObjectId(id) });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete("/deleteEvent/:id", async (req, res) => {
    try {
        if (!EventColl) await connectDB();
        const id = req.params.id;
        const userEmail = req.body.email;
        const event = await EventColl.findOne({ _id: new ObjectId(id) });
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (event.email !== userEmail) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const result = await EventColl.deleteOne({ _id: new ObjectId(id) });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/myEvents/:email", async (req, res) => {
    try {
        if (!EventColl) await connectDB();
        const email = req.params.email;
        const events = await EventColl.find({ email }).toArray();
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put("/updateEvent/:id", async (req, res) => {
    try {
        if (!EventColl) await connectDB();
        const { id } = req.params;
        const { _id, email, ...updatedData } = req.body;
        const result = await EventColl.updateOne({ _id: new ObjectId(id) }, { $set: updatedData });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/events/search", async (req, res) => {
    try {
        if (!EventColl) await connectDB();
        const search = req.query.search || "";
        if (!search) {
            return res.json([]);
        }
        const query = {
            title: { $regex: search, $options: "i" }
        };
        const result = await EventColl.find(query).toArray();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Event participation routes
app.post('/events/participate', async (req, res) => {
    try {
        if (!EventParticipate) await connectDB();
        let user = req.body;
        console.log('new participation', user);
        let result = await EventParticipate.insertOne(user);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Initialize database connection
connectDB().catch(console.error);

module.exports = app;
