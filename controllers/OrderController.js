import asyncHandler from "../middleware/asyncHandler.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";


export const CreateOrder = asyncHandler(async(req,res) => {

    const {email, firstName, lastName, phone, cartItem} = req.body

    if(!cartItem || cartItem.length < 1){
        res.status(400)
        throw new Error("Cart masih kosong")
    }


    let orderItem = []
    let total = 0

    for (const cart of cartItem){
        const productData = await Product.findOne({_id : cart.product})

        if(!productData){
            res.status(404)
            throw new Error("Id product tidak ditemukan")
        }

        const {name, price, _id} = productData

        const singleProduct = {
            name,
            price,
            quantity : cart.quantity,
            product : _id
        }

        orderItem = [...orderItem, singleProduct]
        total += cart.quantity * price

    }

    const order = await Order.create({
        total,
        itemDetail : orderItem,
        firstName,
        lastName,
        email,
        phone,
        user : req.user.id
    })

    return res.status(201).json({
        message : "Berhasil tambah order",
        orderItem,
        total
    })
})


export const AllOrder = asyncHandler(async (req, res) => {

    const orders = await Order.find()

    return res.status(200).json({
        data : orders,
        message : "Tampil All Order"
    })
})


export const DetailOrder = asyncHandler(async (req, res) => {

    const order = await Order.findById(req.params.id)

    return res.status(200).json({
        data : order,
        message : "Tampil Detail Order"
    })
})


export const CurrentUserOrder = asyncHandler(async (req, res) => {

    const order = await Order.find({user : req.user._id})

    return res.status(200).json({
        data : order,
        message : "Berhasil Tampil CUO"
    })
})