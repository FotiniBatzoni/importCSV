require("dotenv").config();
require("../../startup/db")();
const { Product } = require("../../models/product");
const _ = require("lodash");



async function toInteger(){
    const products = await Product.find();

    for(let product of products){
            //const intValue = parseInt(product.price, 10);
            await Product.updateOne(
                {_id:product._id},
                {price: product.price,priority:product.priority},

            );
    }
    console.log("Parse OK")
}
toInteger().then(()=>{
    process.exit();
});