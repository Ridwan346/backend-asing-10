const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const app = express()
const port = 5000

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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const myDB = client.db("userEvent");
    const EventColl = myDB.collection("Event");
    const EventParticipate = myDB.collection('participate')

    //add or wright databse releted api or code here 
    app.post('/events', async (req, res) => {
      let user = req.body
      console.log('new user', user)
      let result = await EventColl.insertOne(user)
      res.send(result)
    })

    app.get('/events', async (req, res) => {
      const cursor = EventColl.find()
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/events/:id', async (req, res) => {
      const id = req.params.id;
      const result = await EventColl.findOne({ _id: new ObjectId(id) });
      res.send(result)
    })

    // DELETE /deleteEvent/:id
    app.delete("/deleteEvent/:id", async (req, res) => {
      const id = req.params.id;
      const userEmail = req.body.email; // sender email
      const event = await EventColl.findOne({ _id: new ObjectId(id) });
      if (!event) return res.status(404).send({ message: "Event not found" });

      if (event.email !== userEmail) {
        return res.status(403).send({ message: "Not authorized" });
      }

      const result = await EventColl.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get("/myEvents/:email", async (req, res) => {
      const email = req.params.email;
      const events = await EventColl.find({ email }).toArray();
      res.send(events);
    });

    app.put("/updateEvent/:id", (req, res) => {
      const { id } = req.params;
      const { _id, email, ...updatedData } = req.body; // email included in body

      EventColl.updateOne({ _id: new ObjectId(id) }, { $set: updatedData })
        .then((result) => res.send(result));
    });

    //event participate
    app.post('/events/participate', async (req, res) => {
      let user = req.body
      console.log('new user', user)
      let result = await EventParticipate.insertOne(user)
      res.send(result)
    })

    app.get("/joinedEvents/:email", async (req, res) => {
      const email = req.params.email;

      const query = { email: email };

      const result = await EventParticipate
        .find(query)
        .sort({ date: 1 })   // date অনুযায়ী sort
        .toArray();

      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
//xg3GiMwIckyrSuqi