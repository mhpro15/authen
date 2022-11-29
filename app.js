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
  password: String
});

userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req,res) =>{
  res.render("home");
})

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
  if (req.isAuthenticated()){
    res.render("secrets")
  }
  else{
    res.redirect("/login")
  }
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
