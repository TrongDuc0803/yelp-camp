if (process.env.NODE_ENV !== "production"){
  require('dotenv').config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require('ejs-mate');
const flash = require("connect-flash")
const session = require('express-session');
const ExpressError = require("./utils/ExpressError") 
const methodOverRide = require("method-override");
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet')

const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');

const MongoDBStore = require('connect-mongo')(session); 
const mongoSanitize = require('express-mongo-sanitize');

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp'
const app = express();

const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
const cloudinaryUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/`;

app.use(express.urlencoded({ extended : true }))
app.use(methodOverRide('_method'));
app.use(express.static( path.join(__dirname, 'public')));
app.use(mongoSanitize({
  replaceWith: '_',
}));

mongoose.connect(dbUrl)

const db = mongoose.connection;
db.once('connected', () => {
    console.log('Mongoose connected to MongoDB');
  });

db.on('error', err => {
    console.error('Mongoose connection error:', err);
  });

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); 
app.engine('ejs',ejsMate);  

const secret = process.env.SECRET || "thisshouldbebetter"  

const store = new MongoDBStore({
  url: dbUrl,
  secret,
  touchAfter: 24 * 3600, 
});

store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e)
})

const sessionConfig = {
  store,
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly:true,
    // secure:true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7
  } 
}

app.use(session(sessionConfig))
app.use(flash());
app.use(helmet());


const scriptSrcUrls = [
  "https://stackpath.bootstrapcdn.com/",
  "https://kit.fontawesome.com/",
  "https://cdnjs.cloudflare.com/",
  "https://cdn.jsdelivr.net",
  "https://cdn.maptiler.com/", 
];
const styleSrcUrls = [
  "https://kit-free.fontawesome.com/",
  "https://stackpath.bootstrapcdn.com/",
  "https://fonts.googleapis.com/",
  "https://use.fontawesome.com/",
  "https://cdn.jsdelivr.net",
  "https://cdn.maptiler.com/", 
];
const connectSrcUrls = [
  "https://api.maptiler.com/", 
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                cloudinaryUrl, 
                "https://images.unsplash.com/",
                "https://api.maptiler.com/" 
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
})

app.use('/', userRoutes)
app.use('/campgrounds', campgroundRoutes)
app.use('/campgrounds/:id/reviews', reviewRoutes)

app.get('/', (req,res) =>{
    res.render("home")
})

app.all("*", ( req, res, next) =>{
  next(new ExpressError('Page not found',404));
})

app.use((err , req, res, next) =>{
  const {statusCode = 500} = err;
  if (!err.message) err.message = "Oh no,Something went wrong"
  res.status(statusCode).render('error',{err});
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});