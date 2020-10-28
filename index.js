var express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
require('dotenv').config()
const admin = require('firebase-admin');
const fileUpload = require('express-fileupload');
const ObjectId = require('mongodb').ObjectId;
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs-extra');

var app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('services'));
app.use(fileUpload());
const port = 5000;

// var admin = require("firebase-admin");

var serviceAccount = require("./creative-agency-36dbf-firebase-adminsdk-g4ic4-408e0b414d.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://creative-agency-36dbf.firebaseio.com"
});




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cf5dp.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const addOrder = client.db("CreativeAgency").collection("orders");
    const addReview = client.db("CreativeAgency").collection("reviews");
    const addServices = client.db("CreativeAgency").collection("addServices");
    const addAdmin = client.db("CreativeAgency").collection("admin");



    app.get('/service', (req, res) => {
        addServices.find({})
            .toArray((err, documents) => {
                res.send(documents)
            })
    })
    app.get('/service/:id', (req, res) => {
        addServices.find({ _id: req.params._id })
            .toArray((err, documents) => {
                console.log(documents);
                res.send(documents[0])
            })
    })

    app.post('/addAService', (req, res) => {
        const file = req.files.file;
        const title = req.body.title;
        const description = req.body.description;
        const newImg = file.data;
        const encImg = newImg.toString('base64')
        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        addServices.insertOne({ title, description, image })
            .then(result => {
                res.send(result.insertedCount > 0);
            })

    })

// app.post('/addOrders', (req, res) => {
//     const review = req.body;
//     addOrder.insertOne(review)
//         .then(result => {
//             // console.log(result);
//             console.log(result.insertedCount);
//             res.send(result.insertedCount > 0);
//         })
// })

app.post('/addOrders', (req, res) => {
    const file = req.files.file;
    const title = req.body.title;
    const description = req.body.description;
    const name = req.body.name;
    const price = req.body.price;
    const email = req.body.email;

    const newImg = file.data;
    const encImg = newImg.toString('base64')
    var image = {
        contentType: file.mimetype,
        size: file.size,
        img: Buffer.from(encImg, 'base64')
    };

    addOrder.insertOne({ title, description, name, email, price, image })
        .then(result => {

            res.send(result.insertedCount > 0);

        });
})
        

app.get('/orders', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
        const idToken = bearer.split(' ')[1];
        admin.auth().verifyIdToken(idToken)
            .then(function (decodedToken) {
                const tokenEmail = decodedToken.email;
                const queryEmail = req.query.email;
                if (tokenEmail == queryEmail) {
                    addOrder.find({ email: req.query.email })
                        .toArray((err, documents) => {
                            res.send(documents)
                        })
                }

            }).catch(function (error) {
            });
    }
    // console.log(req.query.email);

})

app.get('/orderList', (req, res) => {
    addOrder.find({})
        .toArray((err, documents) => {
            // console.log(documents);
            res.send(documents)
        })
})

app.post('/addReview', (req, res) => {
    const order = req.body;
    addReview.insertOne(order)
        .then(result => {
            // console.log(result);
            console.log(result.insertedCount);
            res.send(result.insertedCount > 0);
        })
})

app.get('/reviews', (req, res) => {
    addReview.find({})
        .toArray((err, documents) => {
            res.send(documents)
        })
})

app.post('/addAdmin', (req, res) => {
    const task = req.body;
    addAdmin.insertOne(task)
        .then(result => {
            //  console.log(result.insertedCount);
            res.send(result.insertedCount > 0);
        })
})

app.post('/isAdmin', (req, res) => {
    const email = req.body.email;
    addAdmin.find({ email: email })
        .toArray((err, admins) => {
            res.send(admins.length > 0)
        })
})
    

});



app.get('/', function (req, res) {
    res.send('hello Network Volunteer');
});

app.listen(process.env.PORT || port)