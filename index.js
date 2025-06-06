require( 'dotenv' ).config()
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require( 'mongodb' );

const app = express()
const port = process.env.PORT || 5000;

// Middelware
app.use( cors() );
app.use( express.json() );

const uri = `mongodb+srv://${ process.env.DB_USER }:${ process.env.DB_USER_PASS }@assignments.vbbuj.mongodb.net/?retryWrites=true&w=majority&appName=assignments`

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // await client.connect();

        const database = client.db( 'mcmsbd' );
        const userCollection = database.collection( 'user' );
        const productCollection = database.collection( 'camp' );

        // Get all users (organaizer only)
        app.get('/api/users', async ( req, res ) =>{
            const users = userCollection.find();
            const result = await users.toArray();
            // console.log(result);
            res.send( result )
        })

        // create a new user
        app.post('/api/user', async ( req, res ) => {
            const user = req.body;
            // console.log( user );
            const result = await userCollection.insertOne( user );
            res.send( result );
        })

        // Get a single user by email
        app.get('/api/user/:email', async ( req, res ) =>{
            const email = req.params.email;
            const result = await userCollection.findOne({ email: email });
            // console.log(result);
            res.send( result )
        })

        // Get a single user by id (organaizer only)
        app.get('/api/user/:id', async ( req, res ) => {
            const id = req.params.id;
            const result = await userCollection.findOne({ _id: new ObjectId( id ) });
            // console.log(result);
            res.send( result )
        })

        // Update a user
        app.put('/api/user/:id', async ( req, res ) => {
            const id = req.params.id;
            const user = req.body;
            // console.log( user );
            const filter = { _id: new ObjectId( id ) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
            };
            const result = await userCollection.updateOne( filter, updateDoc, options );
            res.send( result );
        })

        // Delete a user
        app.delete('/api/user/:id', async ( req, res ) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId( id ) };
            const result = await userCollection.deleteOne( filter );
            res.send( result );
        })



        // create a new product (organaizer only) 
        app.post('/api/camp', async ( req, res ) => {
            const product = req.body;
            // console.log( product );
            const result = await productCollection.insertOne( product );
            res.send( result );
        })

        // Get all products
        app.get('/api/camps', async ( req, res ) => {
            const products = productCollection.find();
            const result = await products.toArray();
            // console.log(result);
            res.send( result );
        })
            
        // Get a single product by id
        app.get('/api/camp/:id', async ( req, res ) => {
            const id = req.params.id;
            const result = await productCollection.findOne({ _id: new ObjectId( id ) });
            // console.log(result);
            res.send( result );
        })

        // top products by participants
        app.get('/api/camps/popular', async ( req, res ) => {
            const now = new Date();
            const pipeline = [
                {
                    $addFields: {     //date might not be date type
                        registrationStart: { $toDate: "$campaignRegistration.start" },
                        registrationEnd: { $toDate: "$campaignRegistration.end" }
                    }
                },
                {
                    $match: {
                        registrationStart: { $lte: now },
                        registrationEnd: { $gte: now }
                    }
                },
                { $sort: { CampaignParticipants: -1 }},
                { $limit: 6 }
            ];
            const products = productCollection.aggregate( pipeline );
            const result = await products.toArray();
            // console.log(result);
            res.send( result );
        })

        // upcomming products
        app.get('/api/camps/upcomming', async ( req, res ) => {
            const products = productCollection.find().sort({ date: 1 }).limit();
            const result = await products.toArray();
            // console.log(result);
            res.send( result );
        })

        // Update a product (organaizer only)
        app.put('/api/camp/:id', async ( req, res ) => {
            const id = req.params.id;
            const product = req.body;
            // console.log( product );
            const filter = { _id: new ObjectId( id ) };
            const options = { upsert: true };
            const updateDoc = { $set: product, };
            const result = await productCollection.updateOne( filter, updateDoc, options );
            res.send( result );
        })

        // Delete a product (organaizer only)
        app.delete('/api/camp/:id', async ( req, res ) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId( id ) };
            const result = await productCollection.deleteOne( filter );
            res.send( result );
        })


        // Send a ping to confirm a successful connection
        // await client.db( "admin" ).command({ ping: 1 });
        // console.log( "Pinged your deployment. You successfully connected to MongoDB!" );
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}

run().catch( console.dir );

app.get('/', ( req, res ) => {
    res.send( 'the server is running' );
})

app.listen( port, () => {
    console.log( port );
})