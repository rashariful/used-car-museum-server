const express = require('express');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId, } = require('mongodb');
const app = express();
require("dotenv").config()

const stripe = require("stripe")('sk_test_51M8WntKhkwZTuCQFitjSFyKhkTyOUmPQQJEByceC6Xfs6Tycg0Dx505t0385lJWcBMee8gy3deGjq2CuUOk6Sdnv00kynOsLUd');


const cors = require('cors');
const port = process.env.PORT || 5000


// Middle ware
app.use(cors())
app.use(express.json())
app.use(express.static("public"));

// JWT verify Token function 
function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}


// verify admin function
async function verifyAdmin(req, res, next) {
    const requester = req.decoded?.email;
    // console.log('your crush mail', requester);
    // console.log(`requester `, requester);
    const requesterInfo = await usersCollection.findOne({ email: requester })
    // console.log(`requesterInfo `, requesterInfo);
    const requesterRole = requesterInfo?.role;
    console.log(`requesterRole `, requesterRole);
    // if (requesterInfo?.role === 'admin') {
    //     return next();
    // }
    if (!requesterInfo?.role === 'admin') {
        return res.status(401).send({
            message: `You are not admin`,
            status: 401
        })
    }
    return next();
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@used-car-museum.jf287ra.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri)

const productsCollection = client.db('usedCarMuseum').collection('products')
const bookingsCollection = client.db('usedCarMuseum').collection('bookings')
const usersCollection = client.db('usedCarMuseum').collection('users')
const paymentsCollection = client.db('usedCarMuseum').collection('payments');


async function dbConnect() {
    try {
        await client.connect()
        console.log('mongodb connected with server');
    } catch (error) {

        console.log(error);
    }
}
dbConnect()


app.post('/products', async (req, res) =>{
   try {
       const product = req.body;
       const result = await productsCollection.insertOne(product)
       res.send(result)
   } catch (error) {
    console.log(error.message);
    
   }
})

app.get('/products', async (req, res) => {
    try {
        const email = req.query.email;
        const query = { email: email }
        const result = await productsCollection.find(query).toArray()
        res.send(result)
    } catch (error) {
        console.log(error);
    }
})

app.get('/products/:brand', async (req, res) => {
   
    try {
        const brand = req.params.brand;
        const query = { brand: brand }
        const result = await productsCollection.find(query).toArray()
        res.send(result)
    } catch (error) {
        console.log(error);
    }
})


app.delete('/products/:id', async (req, res) =>{
  try {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const result = await productsCollection.deleteOne(query)
      res.send(result)
  } catch (error) {
    console.log(error.message);
  }
})


app.get('/bookings', async (req, res) => {
  try {
      const email = req.query.email;
      const query = { email: email }
      const bookins = await bookingsCollection.find(query).toArray()
      res.send(bookins)
  } catch (error) {
    console.log(error);
  }
})

app.post('/bookings', async (req, res) => {
  try {
      const booking = req.body;
      const result = await bookingsCollection.insertOne(booking)
      res.send(result)
  } catch (error) {
    console.log(error);
  }

})

app.delete('/bookings/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectId(id) }
    console.log(query);
    const result = await bookingsCollection.deleteOne(query)
    res.send(result)
})

app.get('/bookings/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectId(id) }
    console.log(query);
    const result = await bookingsCollection.findOne(query)
    res.send(result)
})



app.post('/users', async (req, res) => {
    try {
        const user = req.body;
            const result = await usersCollection.insertOne(user)
            res.send(result)
       
    } catch (error) {
        console.log(error);
    }
})

app.get('/users', async (req, res) => {
    const query = {}
    const result = await usersCollection.find(query).toArray()
    res.send(result)
})

// get admin api 
app.get('/user/admin/:email', async (req, res) => {
    try {

        const email = req.params.email;
        const user = await usersCollection.findOne({ email: email });
        const isAdmin = user?.role === 'admin';
        res.send({
            isAdmin: isAdmin
        })

    } catch (error) {
        console.log(error);
    }
})
// get seller api 
app.get('/user/seller/:email', async (req, res) => {
    try {

        const email = req.params.email;
        const user = await usersCollection.findOne({ email: email });
        const isSeller = user?.role === 'seller';
        res.send({
            isSeller: isSeller
        })

    } catch (error) {
        console.log(error);
    }
})
// get Buyer api 
app.get('/user/buyer/:email', async (req, res) => {
    try {

        const email = req.params.email;
        const user = await usersCollection.findOne({ email: email });
        const isBuyer = user?.role === 'buyer';
        res.send({
            isBuyer: isBuyer
        })

    } catch (error) {
        console.log(error);
    }
})




app.delete('/users/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectId(id) }
    const result = await usersCollection.deleteOne(query)
    res.send(result)
})


app.put('/users/verify/:id', async (req, res) => {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) }
    const options = { upsert: true }
    const updatedDoc = {
        $set: {
            sellerStatus: 'verifySeller'
        }
    }
    const result = await usersCollection.updateOne(filter, updatedDoc, options)
    res.send(result)

})



const calculateOrderAmount = (items) => {

    return 1400;
};

app.post("/create-payment-intent", async (req, res) => {
    try {
        const { booking } = req.body;
        const price = booking.price;
        const amount = price * 100;

        // Create a PaymentIntent with the order amount and currency
        const paymentIntent = await stripe.paymentIntents.create({
            amount: calculateOrderAmount(items),
            currency: "usd",
            amount: amount,
            payment_methods_types: [
                "card"
            ]
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.log(error.message);
    }
});

app.post('/payments', async (req, res) => {
    try {
        const payment = req.body;
        const result = await paymentsCollection.insertOne(payment);
        const id = payment.bookingId
        const filter = { _id: ObjectId(id) }
        const updatedDoc = {
            $set: {
                paid: true,
                transactionId: payment.transactionId
            }
        }
        const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc)
        res.send(result);
    } catch (error) {
        console.log(error.message);
    }
})



app.get('/', (req, res) => {
    res.send('assingment server is running')
})
app.listen(port, () => {
    console.log(`assingment server is running on: ${port}`);
})