//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser =  require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

// level 2
// const encrypt = require("mongoose-encryption");
// level 3 security
// const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 8;

const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const port =process.env.PORT || 3000
const app = express();

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded(
	{extended:true}));


app.use(session({
	secret:"Aomadwdasdqqd",
	resave:false,
	saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/secretsDB",{useNewUrlParser:true, useUnifiedTopology: true})
mongoose.set("useCreateIndex",true)

const userSchema = new mongoose.Schema(
		{email:String,
		password:String,
		secret:String});
// environment variable
// const secret = process.env.SECRET


// Level 2 Security
// userSchema.plugin(encrypt,{secret:secret, encryptedFields:["password"]});

// Passport cookies level 5 security
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/",function(req,res){
	res.render("home");
});

app.get("/login",function(req,res){
	res.render("login");
});

app.get("/register",function(req,res){
	res.render("register");
});


app.get("/secrets",function(req,res){

	// if request is authenticated render secrets.ejs
	// if(req.isAuthenticated()){
	// 	res.render("secrets");
	// }
	// else{

	// 	res.redirect("/login")
	// }

	User.find({"secret":{$ne:null}}, function(err,foundUsers){
		if(err){}
			else{
				if(foundUsers){
					res.render("secrets",{usersWithSecrets:foundUsers})
				}
			}
	})
});

app.get("/submit",function(req,res){
	if(req.isAuthenticated()){
		res.render("submit");
	}
	else{

		res.redirect("/login")
	}
})


app.get("/logout",function(req,res){
	req.logout();
	res.redirect("/");
});



// Dont use this route because we want user to see route if they are logged in or registered
// app.get("/secrets",function(req,res){
// 	res.render("secrets");
// });

app.post("/submit",function(req,res){
	const submittedSecret = req.body.secret;

	// console.log(req.user);

	User.findById(req.user.id,function(err,foundUser){
		if(err){
			console.log(err)
		}else{
			if(foundUser){foundUser.secret = submittedSecret;
				foundUser.save(function(){
					console.log(foundUser.secret)
					res.redirect("/secrets")
				})}
		}
	})
})

app.post("/register",function(req,res){

User.register({username:req.body.username},req.body.password,function(err,user){
	if(err){
		console.log(err);
		res.redirect("/register");
	}else{
		passport.authenticate("local")(req,res,function(){
			res.redirect("secrets");
		});
	}
});
	// bcrypt.hash(req.body.password,saltRounds,function(err,hash){

	
	// const user = new User({
	// 	email:req.body.username,
	// 	// level 3 md5 security
	// 	// password:md5(req.body.password)
	// 	password:hash
	// });

	// user.save(function(err){
	// 	if(err){console.log(err);}
	// 	else{res.render("secrets");}
	// 	});
	// });
});

app.post("/login",function(req,res){


const user = new User({
username:req.body.username,
password:req.body.password
});

req.login(user,function(err,user){
	if(err){
		console.log(err);
	}
	else{
		passport.authenticate("local")(req,res,function(){
			res.redirect("/secrets")
		});
	}
})

// level 4 hashing and salts
// const username = req.body.username;
// const password = req.body.password;

// level 3 security
// const password = md5(req.body.password);
// User.findOne({email:username},function(err,foundUser){
// 	if(err){console.log(err)}
// 		else{if(foundUser)
// 			{
// 			// generating a hash of entered login password and stored hash
// 			bcrypt.compare(password,foundUser.password,function(err,result)
// 			{
// 				if(result===true)
// 				{
// 					res.render("secrets")
// 				}

// 			});
// 		}}
// })

});


app.listen(port, () => console.log(`Secrets listening at http://localhost:${port}`))