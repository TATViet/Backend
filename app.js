const express = require("express"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    bodyParser = require("body-parser"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose");

const User = require("./model/User");
const Product = require("./model/Payment"); // Bạn cần tạo model Product

let app = express();

mongoose.connect("mongodb://localhost/27017");

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true })); 

app.use(require("express-session")({ 
    secret: "Rusty is a dog",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//=====================
// ROUTES
//=====================

// Showing home page
app.get("/", function (req, res) {
    res.render("home");
});

// Showing secret page
app.get("/secret", function (req, res) {
  Product.find().then((Product) => {
    res.render("secret", { cart: cart, Product: Product });
  });
});

app.get("/verysecret", function (req, res) {
  res.render("verysecret", {cart: cart});
  });
  

// Showing register form
app.get("/register", function (req, res) {
    res.render("register");
});

// Handling user signup
app.post("/register", async (req, res) => {
    const user = await User.create({
      username: req.body.username,
      password: req.body.password,
      IsAD:     req.body.IsAD == 'on',
      // cart: [{ productId: 'test', quantity: 1 }] //test
    });
    
    return res.redirect('/login');
});

// Showing login form
app.get("/login", function (req, res) {
    res.render("login");
});

// //Handling user login
// app.post("/login", async function(req, res){
//     try {
//         // check if the user exists
//         const user = await User.findOne({ username: req.body.username });
//         if (user) {
//           //check if password matches
//           const result = req.body.password === user.password;
//           if (result) {
//             res.redirect("/login"); 
//           } else {
//             res.status(400).json({ error: "password doesn't match" });
//           }
//         } else {
//           res.status(400).json({ error: "User doesn't exist" });
//         }
//       } catch (error) {
//         res.status(400).json({ error });
//       }
// });

// function isLoggedIn(req, res, next) {
// if (req.isAuthenticated()) {
//   if(req.user.IsAD) {
    
//     res.redirect("/verysecret");
//   } else {
    
//     res.redirect("/secret");
//   }
// } else {
//   res.redirect("/login");
// }
// }

app.post("/login", async function(req, res) {
  try {
    // check if the user exists
    const user = await User.findOne({ username: req.body.username });
    if (user) {
      //check if password matches
      const result = req.body.password === user.password;
      if (result) {
        req.login(user, function(err) {
          if (err) {
            return res.status(400).json({ error: "Error logging in" });
          }
            res.redirect(user.IsAD ? "/verysecret" : "/secret");
        });
      } else {
        res.status(400).json({ error: "password doesn't match" });
      }
    } else {
      res.status(400).json({ error: "User doesn't exist" });
    }
  } catch (error) {
    res.status(400).json({ error });
  }
});


// Handling user logout 
app.get("/logout", function (req, res) {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});


//=====================
// Cart
let cart = [
  { id: 1, name: 'My goi', price: '5000' },
  { id: 2, name: 'So da', price: '12000' },
  { id: 3, name: 'snack', price: '8000' },
  { id: 4, name: 'nuoc suoi', price: '10000' },
  { id: 5, name: 'da me', price: '20000' },
];

// Add new items
app.post('/cart', (req, res) => {
  const newitems = req.body;
  newitems.id = cart.length + 1;
  cart.push(newitems);
  res.redirect('/verysecret');
});

// Delete items
app.get('/cart/:id', (req, res) => {
  const itemId = parseInt(req.params.id);

  cart = cart.filter(cart => cart.id !== itemId);
 
  res.redirect('/verysecret');
});

// Customers cart
app.get('/cart_customer/:id', async (req, res) => {
  const itemId = parseInt(req.params.id);
  const item = cart.find(product => product.id === itemId);

  if (item) {
    try {
      // Kiểm tra xem sản phẩm đã tồn tại hay chưa
      let existingProduct = await Product.findOne({ Product_name: item.name });

      if (existingProduct) {
        // Nếu sản phẩm đã tồn tại, tăng quantity lên 1
        await Product.updateOne(
          { _id: existingProduct._id },
          { $inc: { Product_quantity: 1 } }
        );
        
      } else {
        // Nếu sản phẩm chưa tồn tại, tạo sản phẩm mới với quantity là 1
        const newProduct = new Product({
          Product_name: item.name,
          Product_price: item.price,
          //Product_picture: 'default_picture_url', // Bạn có thể thay đổi URL này
          Product_quantity: 1
        });
        await newProduct.save();
      }
      res.redirect('/secret');
    }  catch (error) {
      res.status(500).send('Error adding product: '+ item.name+'   ' + error.message);
    }
  } else {
    res.status(404).send('Product not found in cart' + itemId);
  }
});
// delete cart (all)
app.get('/cart_customer_deletall', async (req, res) => {
  try {
    await Product.deleteMany({});
    console.log('All data in the product collection has been deleted.');
    res.redirect('/secret');
  } catch (error) {
    console.error('Error deleting data:', error);
}
});
// delete cart (item)
// app.get('/cart_customer_delet/:Product_name', async (req, res) => {
//   try {
//     const tess = await Product.findOne({ Product_name: req.params.Product_name });
//     await tess.deleteOne();
//     res.redirect('/secret');
//   } catch (error) {
//     console.error('Error deleting data:', error);
//     res.status(500).send({ message: 'Internal Server Error' });
//   }
// });
app.get('/cart_customer_delet/:Product_name', async (req, res) => {
  try {
    const tess = await Product.findOne({ Product_name: req.params.Product_name });
    if (tess.Product_quantity > 1) {
      await Product.updateOne({ Product_name: req.params.Product_name }, { $inc: { Product_quantity: -1 } });
    } else {
      await Product.deleteOne({ Product_name: req.params.Product_name });
    }
    res.redirect('/secret');
  } catch (error) {
    console.error('Error deleting data:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});


// check payment
let check = [
  { id: 1, check: false },
  { id: 2, check: false }
];
app.get('/check_payment_costumer', async (req, res) => {
  check.forEach((element) => {
    if (element.id === 1) {
      element.check = true;
    } else if (element.id === 2) {
      element.check = false;
    }
  });
  
  res.set('Expires', '0');
  //res.redirect('/secret');
});

//=====================


let port = process.env.PORT || 3000;
app.listen(port, function () {
    console.log("Server Has Started!");
    console.log("http://localhost:3000");
});