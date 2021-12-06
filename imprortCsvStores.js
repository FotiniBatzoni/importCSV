require("dotenv").config();
require("../../startup/db")();
const { User } = require("../../models/user");
const {Store} = require("../../models/store");
const { Role } = require("../../models/role");
const storesToInsert = require("../../utilities/importCSV/storeFromCSVjosned");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const paymentMethods = require("../paymentMethods");
const shippingMethods = require("../shippingMethods");


/*
address:{
    formatted_address: ""

}
lng: 37.97832523871151
lat: 23.7682218113526
 */

async function getPassword(){
    let password = "mydeliveryuser!";
    let hash = await bcrypt.genSalt(10);
    return await bcrypt.hash(password,hash);

}


async function importFromCsv(){
    let role = await Role.findOne({"priority":2});

    let stores = storesToInsert;
    for(let client of stores){
        let input = {
            firstname: (client.contact_name.split(" ").length === 1) ? client.contact_name.split(" ")[0] : client.contact_name,
            lastname: (client.contact_name.split(" ").length === 1) ? client.contact_name.split(" ")[0] : client.contact_name.split(" ")[1],
            phone: client.contact_phone,
            email: (!client.contact_email.includes('@') ) ? client.contact_email.concat('@mydelivery.gr') : client.contact_email,
            password: await getPassword(),
            isActive: true,
            role: role
        }

        const user = new User(input);
        await user.save();

        const shipping_methods = shippingMethods.map((sm) => {
            return {
                name:sm.name,
                type:sm.type,
                isActive:true
            }
        });

        const payment_methods = paymentMethods.map((sm,i) => {
            return {
                name:sm.name,
                type:sm.type,
                isActive:i === 0 ? true : false
            }
        });

        let general = {
            store_name:client.restaurant_name,
            store_email:(!client.contact_email.includes('@') ) ? client.contact_email.concat('@mydelivery.gr') : client.contact_email,
            isActive: true,
            percentage_keep:client.percent_commision,
            store_phone: client.contact_phone,
            address: setAddress(client)
        };

        let settings = {
            featured_image:"",
            logo:"",
            minimum_amount:0,
            estimation_time:0,
            description:"",
            shipping_methods:shipping_methods,
            payment_methods: payment_methods,
            service_points:[],
            hasDeliveryService:false,
            priority:0,
            //orderRejectMinutes:5,
        }

        let card_payment_settings = {
            seller_id:null,
            "email": "",
            "contact_phone": "",
            "description": "",
            "business_name": "",
            "business_title": "",
            "business_tax_number": "",
            "business_address": "",
            "bank_account_iban": "",
            "bank_account_beneficiary": ""
        }

        const working_hours = [];
        for(let i = 0; i < 7; i++){
            working_hours.push({
                first:{
                    from:"10:00",
                    to:"12:00"
                },second:{
                    from:"12:00",
                    to:"22:00"
                }})
        }

        const store = new Store({
            general: general,
            settings: settings,
            card_payment_settings:card_payment_settings,
            working_hours:working_hours,
            merchant: user._id
        });

        await store.save();
        user.stores = [store._id];

        await user.save();

    }

}

importFromCsv().then(() => {
    process.exit();
})


function setAddress(store){
    let address = {
        formatted_address:`${store.street}, ${store.city}, ${store.state}`,
        geometry:{
            location:{
                lng: store.lontitude,
                lat: store.latitude
            }
        }
    }
    return address;
}