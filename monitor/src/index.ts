import express, { Request, Response } from 'express';
import axios from 'axios';
import client from 'prom-client';

const app = express();
const port = 3000;

app.get('/monitor/scrap', async (req: Request, res: Response) => {
  try {
    const userMetric = await axios.get('http://user-srv:9000/metrics');
    const productMetric = await axios.get('http://product-srv:9000/metrics');
    const paymentMetric = await axios.get('http://payment-srv:9000/metrics'); 
    const orderMetric = await axios.get('http://order-srv:9000/metrics'); 
    // console.log(userMetric)
    const allMetrics = { 
    'user-service': userMetric.data,
    'payment-service': paymentMetric.data,
    'order-service': orderMetric.data,
    'product-service':productMetric.data  
  };
    // console.log(allMetrics);
    res.status(200).send(allMetrics);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: 'Something went wrong',
    });
  }
});
app.listen(port,()=>{
console.log("Monitoring service started on port " + port);
});