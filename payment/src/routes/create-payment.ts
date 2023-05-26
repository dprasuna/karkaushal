import express,{Request,Response} from 'express';
import {body} from 'express-validator';
import { stripe } from '../stripe';
import { Payment } from '../models/payment';
import {
  requireAuth,
  validateRequest,
  BadRequestError,
  NotFoundError,
  NotAuthorizedError,
  OrderStatus
} from '@karkaushal/common'
import {Order} from '../models/order'
import { PaymentCreatedPublisher } from '../events/publishers/payment-created-publisher';
import { natsWrapper } from '../../NatsWrapper';
const router=express.Router();

router.post('/api/payments',
requireAuth,
[
  body('orderId')
  .not()
  .isEmpty()
  .withMessage("Order Id is required"),
  body("token")
  .not()
  .isEmpty()
  .withMessage("token is required")
],validateRequest,
async (req:Request, res:Response)=>{
    const {orderId,token}=req.body;
    const order=await Order.findById(orderId);
    
    if(!order){throw new NotFoundError()};
    if(order.userId!==req.currentUser!.id)
    {
        throw new NotAuthorizedError();
    }
    if(order.status===OrderStatus.Cancelled){
      throw new BadRequestError('Can not pay for an cancelled order');
    }
    
    const charge = await stripe.charges.create({
      amount: order.totalPrice*100,
      currency: 'INR',
      source:token.id
    });
    if(!charge.id) throw new Error("Payment Failed");
    const payment=Payment.build({
      orderId,
      stripeId:charge.id
    })
    await payment.save();
    new PaymentCreatedPublisher(natsWrapper.client).publish({
      id:payment.id,
      orderId:payment.orderId,
      stripeId:payment.stripeId
    });
    res.status(201).send({id:payment.id});
});

export {router as CreateChargeRouter }