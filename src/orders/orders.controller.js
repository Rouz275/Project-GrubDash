const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res) {
    res.json({ data: orders });
}

function bodyDataHas(propertyName) {
    return function(req, res, next) {
        const { data = {} } = req.body;
        if(data[propertyName]) {
            return next();
        }
        next({
            status: 400,
            message: `Must include a ${propertyName}`
        })
    }
}

function dishesExists(req, res, next) {
    const { data: { dishes } } = req.body;
    if (Array.isArray(dishes) && dishes.length > 0) {
        res.locals.dishes = dishes;
        return next();
    }
    next({
        status: 400,
        message: "Order must include at least one dish"
    });
}

function dishQuantityIsValid(req, res, next) {
    const dishes = res.locals.dishes;
    const index = dishes.findIndex(dish => dish.quantity <= 0 || !dish.quantity || !Number.isInteger(dish.quantity))
    if (index != -1)
        return next({
            status: 400,
            message: `Dish ${index} must have a quantity that is an integer greater than 0`
        });
    next();
}

function create(req, res) {
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status: "pending",
        dishes,
    }

    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `Order ${orderId} does not exist.`
    });
}

function orderIdMatches(req, res, next) {
    const { orderId } = req.params;
    const { data: { id } } = req.body;
    if (!id) return next();
    if (id && orderId !== id){
        return next({
            status: 400,
            message: `Order id does not match id. Order ${id}, Route: ${orderId}.`,
        });
    }
    return next();
}

function orderStatus(req, res, next) {
    const {status} = res.locals.order;
    if(status === "pending"){
       return next();
    }
    next({
        status:400,
        message:`An order cannot be deleted unless it is pending`,
    });
}

function statusIsValid(req, res, next) {
    const { data: { status } = {} } = req.body;
    const validStatus = [
        "pending",
        "preparing",
        "out-for-delivery",
        "delivered",
    ];
    if(validStatus.includes(status)) {
        return next();
    }
    next({
        status: 400,
        message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    })
}

function read(req, res) {
    res.json({ data: res.locals.order });
}

function update(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes } } = req.body;
    const order = res.locals.order;

    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;

    res.json({ data: order });
}

function destroy(req, res) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    const deletedOrders = orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
    list,
    create: [bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        dishesExists,
        dishQuantityIsValid,
        create],
    read: [orderExists, orderStatus, read],
    update: [orderExists,
        orderIdMatches,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        bodyDataHas("status"),
        dishesExists,
        dishQuantityIsValid,
        statusIsValid,
        update],
    delete: [orderExists, orderStatus, destroy],
}