import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";

const router = express.Router();

//collection till date

router.get("/collection", async (req, res) => {
  const collection = await db.collection("invoices");
  const query = { status: 'paid' };
  const results = await collection.aggregate([
    { $match: query },
    { $group: { _id: null, fee_total: { $sum: '$fee_total' }, fine_amount: { $sum: '$fine_amount' } } }
  ]).toArray();

  const total = results[0].fee_total + results[0].fine_amount

  res.send({total: total}).status(200);
});


//balance 


  router.get("/balance", async (req, res) => {
  const collection = await db.collection("invoices");
  const result = await collection.aggregate([
    { $match: { status: { $ne: 'paid' } } }, 
    { $group: { _id: null, fee_total: { $sum: '$fee_total' } } }
  ]).toArray()
      const balance = result.length > 0 ? result[0].fee_total : 0;
      res.send({balance: balance}).status(200);
      
});

//student

router.get("/students", async (req, res) => {
  const collection = await db.collection("students");
  collection.countDocuments((err, count) => {
    if (err) {
    res.status(500).json({ error: 'Failed to retrieve the count' });
  } else {
    res.json({ count: count });
  }
});
});

//sections

router.get("/sections", async (req, res) => {
const collection = await db.collection("sections");
  collection.distinct('section').then(sections => {
    const count = sections.length;
    res.json({ count: count });
  }).catch(err => {
    
    res.status(500).json({ error: 'Failed to retrieve the sections' });
  });
});

//finecollectedtilldate

router.get("/fine", async (req, res) => {
  const collection = await db.collection("invoices");
  const results = await collection.aggregate([
    { $group: { _id: null,  fine_amount: { $sum: '$fine_amount' } } }
  ]).toArray();

  const total = results[0].fine_amount

  res.send({total: total}).status(200);
});  



//admin
    
router.get('/admin', async (req, res) => {
    const collection = db.collection('schooladmins');
    const collectionInfo = await collection.findOne({}, { projection: { _id: 0, name: 1, access: 1 } });
      res.send(collectionInfo);
});


//disbursals
router.get('/disbursals', async (req, res) => {
  
    const collection = db.collection('transactions');
    const collectionInfo = await collection.findOne({}, { projection: { _id: 0, amount: 1, status: 1 ,createdAt:1 } });
      res.send(collectionInfo);
  
});

//payment-mode

router.get('/payment-modes', async (req, res) => {
    const collection = db.collection('transactions');
    const paymentModesCount = await collection.aggregate([
      {
        $group: {
          _id: '$payment_mode',
          count: { $sum: 1 }
        }
      },
    {
          $project: {
            _id: 0,
            paymentMode: '$_id',
            count: 1
          }
        }
      
    ]).toArray();

    res.send(paymentModesCount).status(200);
  } 
);

//defaulters

router.get('/defaulters', async (req, res) => { 
      const collection = db.collection('dues');
      const defaulterCount = await collection.aggregate([
        {
          $match: {
            due_date: { $lt: new Date() } 
          }
        },
        {
          $count: 'defaulterCount' 
        }
      ]).toArray();

      res.send(defaulterCount[0]); 
});
    //this-month
  router.get('this-month',async (req, res) => {
    const paymentsCollection = await db.collection('payments');
    const invoicesCollection = await db.collection('invoices');
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
      const result = await paymentsCollection.aggregate([
        { $match: { timestamp: { $gte: startOfMonth, $lte: endOfMonth } } },
        {
          $lookup: {
            from: 'invoices',
            localField: 'invoiceId',
            foreignField: '_id',
            as: 'invoiceData'
          }
        },
        { $unwind: '$invoiceData' },
        { $group: { _id: null, fee_total: { $sum: '$invoiceData.fee_total' } } }
      ]).toArray();
      
          const totalFee =  result[0].fee_total;
          res.send({ totalFee: totalFee }).status(200);
        
      });


    export default router;

