const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res, next) {
    res.json({ data: dishes });
}

function namePropertyIsValid(req, res, next) {
    const { data: { name } = {} } = req.body;
    if (name) {
        return next();
    }
    next({
        status: 400,
        message: "Dish must include a name.",
    });
}

function descriptionPropertyIsValid(req, res, next) {
    const { data: { description } = {} } = req.body;
    if (description) {
        return next();
    }
    next({
        status: 400,
        message: "Dish must include a description.",
    });
}

function imageUrlIsValid(req, res, next) {
    const { data: { image_url } = {} } = req.body;
    if (image_url) {
        return next();
    }
    next({
        status: 400,
        message: "An image_url is required.",
    });
}

function priceIsValid(req, res, next) {
    const { data: { price } = {} } = req.body;
    if (price && price > 0 && Number.isInteger(price)) {
        return next();
    }
    next({
        status: 400,
        message: "Dish must have a valid price.",
    });
}

function create(req, res, next) {
    const { data: { name, price, description, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(),
        name,
        price,
        description,
        image_url,
    }

    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundId = dishes.find((dish) => dish.id === dishId);

    if (dishId && foundId) {
        res.locals.dish = foundId;
        return next();
    }
    next({
        status: 404,
        message: `Dish id does not exist ${dishId}`,
    });
}

function dishIdMatches(req, res, next) {
    const { dishId } = req.params;
    const { data: { id } = {} } = req.body;
    if (id && id !== dishId) {
        return next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
        });
    }
    next();
}

function read(req, res) {
    res.json({ data: res.locals.dish });
}

function update(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const dish = res.locals.dish;

    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;

    res.json({ data: dish });
}

module.exports = {
    list,
    create: [
        namePropertyIsValid,
        descriptionPropertyIsValid,
        imageUrlIsValid,
        priceIsValid,
        create
    ],
    read: [dishExists, read],
    update: [dishExists,
        dishIdMatches,
        namePropertyIsValid,
        descriptionPropertyIsValid,
        imageUrlIsValid,
        priceIsValid,
        update],
}
