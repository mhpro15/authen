//jshint esversion:6
require('dotenv').config();
const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs");
const mongoose = require("mongoose")
        // const bcrypt = require("bcrypt")
        // const saltRounds = 10
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const FacebookStrategy = require("passport-facebook").Strategy;


const findOrCreate = require("mongoose-findorcreate")
const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));


app.use(session({
  secret : "A little secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://127.0.0.1/userDB",{useNewUrlParser: true})

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId:String,
  secret:String
  // facebookId:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username, name: user.name });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
  },
  function(accessToken, refreshToken, profile, cb) {

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


// passport.use(new FacebookStrategy({
//     clientID: process.env.FACEBOOK_ID,
//     clientSecret: process.env.FACEBOOK_SECRET,
//     callbackURL: "http://localhost:3000/auth/facebook/secrets"
//   },
//   function(accessToken, refreshToken, profile, cb) {
//     console.log(profile);
//     User.findOrCreate({ facebookId: profile.id }, function (err, user) {
//       return cb(err, user);
//     });
//   }
// ));

app.get("/", (req,res) =>{
  res.render("home");
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));
// app.get('/auth/facebook',
//   passport.authenticate('facebook'));


  app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/secrets');
    });


    // app.get('/auth/facebook/secrets',
    //   passport.authenticate('facebook', { failureRedirect: '/login' }),
    //   function(req, res) {
    //     // Successful authentication, redirect home.
    //     res.redirect('/secrets');
    //   });


app.get("/login", (req,res) =>{
  if (req.isAuthenticated()){
    res.redirect("/secrets")
  }
  else{
    res.render("login")
  }
})

app.get("/register", (req,res) =>{
  res.render("register");
})

app.get("/secrets" ,(req, res) =>{
  User.find({"secret":{$ne:null}}, (err, foundSecret) =>{
    if (err){
      console.log(err);
    }else{
      if(foundSecret){
        res.render("secrets", {secrets : foundSecret})
      }
    }
  })
})
app.post("/register", (req, res) =>{

  User.register({username: req.body.username}, req.body.password, (err, user) =>{
    if(err){
      console.log(err);
      res.redirect("/register");
    }
    else{
      passport.authenticate("local")(req,res, ()=>{
        res.redirect("/secrets")
      });
    }
  })


                //   bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
                //     const newUser = new User({
                //       email: req.body.username,
                //       password: hash
                //     })
                //     newUser.save((err) => {
                //       if (err){
                //         console.log(err)
                //       }
                //       else{
                //         res.render("secrets")
                //       }
                //     })
                // });

})

app.post("/login", (req,res) =>{

  const user = new User({
    username: req.body.username,
    password: req.body.password
  })
  req.login(user, (err) =>{
    if(err){
      console.log(user)
    }
    else{
      passport.authenticate("local")(req,res, ()=>{
        res.redirect("/secrets")
    });
    }
  })









                // const username = req.body.username;
                // const password = req.body.password;
                //
                // User.findOne({email:username}, (err, foundUser) =>{
                //   if (err){
                //     console.log(err);
                //   }
                //   else{
                //     if (foundUser){
                //       bcrypt.compare(password, foundUser.password, function(err, result) {
                //         if(err){
                //           console.log(err);
                //         }
                //         else{
                //           res.render("secrets")
                //         }
                //       });
                //     }
                //   }
                // })

                // using bcrypt



})
app.get("/submit", (req, res) =>{
  if (req.isAuthenticated()){
    res.render("submit")
  }else{
    res.redirect("/login")
  }
})
app.post("/submit", (req, res) =>{
  const submittedSecret = req.body.secret
  console.log(req.user);

  User.findById(req.user.id, (err, foundUser) => {
    if(err){
      console.log(err);
    }else{
      if (foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save(() =>{
          res.redirect("/secrets")
        })
      }
    }
  })
})


app.get("/logout", (req,res) =>{
  req.logout((err) =>{
    if (err){
      console.log(err)
    }else{
      res.redirect("/")
    }
  });
})




app.listen(3000, () =>{
  console.log("Server running on port 3000.")
})
