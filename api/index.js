const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();

// CORS MIDDLEWARE - MUST BE ABSOLUTELY FIRST
app.use((req, res, next) => {
    console.log('CORS Middleware triggered for:', req.method, req.path);

    // Set CORS headers immediately
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.setHeader('Vary', 'Origin');

    // Respond to preflight immediately
    if (req.method === 'OPTIONS') {
        console.log('Responding to OPTIONS preflight');
        return res.status(200).end();
    }

    next();
});

app.use(express.json());

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
        throw error;
    }
}

// Simple test route
app.get("/test", (req, res) => {
    console.log('Test endpoint called');
    res.json({ message: "API is working", timestamp: new Date() });
});

// Root route
app.get("/", (req, res) => {
    console.log('Root endpoint called');
    res.json({ message: "API is running" });
});

// Events routes
app.post('/events', async (req, res) => {
    try {
        console.log('POST /events called');
        if (!EventColl) await connectDB();
        let user = req.body;
        console.log('new event:', user);
        let result = await EventColl.insertOne(user);
        res.json(result);
    } catch (error) {
        console.error('Error in POST /events:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/events', async (req, res) => {
    try {
        console.log('GET /events called');
        if (!EventColl) await connectDB();
        const result = await EventColl.find().toArray();
        console.log('Found', result.length, 'events');
        res.json(result);
    } catch (error) {
        console.error('Error in GET /events:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/events/:id', async (req, res) => {
    try {
        console.log('GET /events/:id called with id:', req.params.id);
        if (!EventColl) await connectDB();
        const id = req.params.id;
        const result = await EventColl.findOne({ _id: new ObjectId(id) });
        res.json(result);
    } catch (error) {
        console.error('Error in GET /events/:id:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete("/deleteEvent/:id", async (req, res) => {
    try {
        console.log('DELETE /deleteEvent/:id called with id:', req.params.id);
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
        console.error('Error in DELETE:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/myEvents/:email", async (req, res) => {
    try {
        console.log('GET /myEvents/:email called with email:', req.params.email);
        if (!EventColl) await connectDB();
        const email = req.params.email;
        const events = await EventColl.find({ email }).toArray();
        res.json(events);
    } catch (error) {
        console.error('Error in GET /myEvents:', error);
        res.status(500).json({ error: error.message });
    }
});

app.put("/updateEvent/:id", async (req, res) => {
    try {
        console.log('PUT /updateEvent/:id called with id:', req.params.id);
        if (!EventColl) await connectDB();
        const { id } = req.params;
        const { _id, email, ...updatedData } = req.body;
        const result = await EventColl.updateOne({ _id: new ObjectId(id) }, { $set: updatedData });
        res.json(result);
    } catch (error) {
        console.error('Error in PUT /updateEvent:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/events/search", async (req, res) => {
    try {
        console.log('GET /events/search called with search:', req.query.search);
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
        console.error('Error in search:', error);
        res.status(500).json({ error: error.message });
    }
});

// Event participation routes
app.post('/events/participate', async (req, res) => {
    try {
        console.log('POST /events/participate called');
        if (!EventParticipate) await connectDB();
        let user = req.body;
        console.log('new participation:', user);
        let result = await EventParticipate.insertOne(user);
        res.json(result);
    } catch (error) {
        console.error('Error in POST /events/participate:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/joinedEvents/:email", async (req, res) => {
    try {
        console.log('GET /joinedEvents/:email called with email:', req.params.email);
        if (!EventParticipate) await connectDB();
        const email = req.params.email;
        const result = await EventParticipate
            .find({ email: email })
            .sort({ date: 1 })
            .toArray();
        res.json(result);
    } catch (error) {
        console.error('Error in GET /joinedEvents:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Initialize DB connection on startup
connectDB().catch(err => console.error('Failed to connect to database:', err));

// Export for Vercel
module.exports = app;
