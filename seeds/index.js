const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');

mongoose.connect('mongodb://localhost:27017/yelp-camp', {});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];


const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 20; i++) {
        const random1000 = Math.floor(Math.random() * 50);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author: '66d05033682464ce3177f35d',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            price,
            geometry: {
              type: 'Point',
              coordinates: [ 
                cities[random1000].longitude,
                cities[random1000].latitude 
              ]
            },
            description : "    Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus sapiente hic nemo delectus officiis perferendis id fugiat deleniti nostrum. Animi suscipit dolores, repudiandae provident laudantium facilis rerum saepe dolorum possimus!",
            images:  [
                {
                  url: 'https://res.cloudinary.com/dlr4bkgxd/image/upload/v1725208056/YelpCamp/ebnhnatb8n7wo11l58pk.jpg',
                  filename: 'YelpCamp/ebnhnatb8n7wo11l58pk',
                },
                {
                  url: 'https://res.cloudinary.com/dlr4bkgxd/image/upload/v1725208056/YelpCamp/k3jttehusmlzqciwpuyc.jpg',
                  filename: 'YelpCamp/k3jttehusmlzqciwpuyc',
                }
              ]
        })
        await camp.save();
    }
}

seedDB();