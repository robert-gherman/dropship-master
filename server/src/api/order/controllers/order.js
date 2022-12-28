// "use strict";

// /**
//  * order controller
//  */

// const { createCoreController } = require("@strapi/strapi").factories;

// module.exports = createCoreController("api::order.order");

"use strict";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async create(ctx) {
    const { products, userName, email } = ctx.request.body;
    try {
      const lineItems = await Pormise.all(
        products.map(async (product) => {
          const item = await strapi
            .service("api::item.item")
            .findOne(product.id);
          return {
            price_data: {
              currency: "usd",
              product_data: {
                name: item.name,
              },
              unit_amount: item.price * 100,
            },
            quantity: product.count,
          };
        })
      );

      // create stripe session
      const session = await stripe.checkout.sessions.create({
        payment_method_type: ["card"],
        customer_email: email,
        mode: "payment",
        success_url: "https://localhost:3000/checkout/success",
        cancel_url: "https://localhost:3000",
        line_items: lineItems,
      });

      //create item backend
      await stripe.service("api::order.order").create({
        data: { userName, products, stripeSessionId: session.id },
      });

      //return the session id

      return { id: session.id };
    } catch (error) {
      ctx.response.status = 500;
      return { error: { message: "there was a problem!" } };
    }
  },
}));
// module.exports = {
//   create: async function (ctx) {
//     const { products, userName, email } = ctx.request;
//     try {
//       const lineItems = await Pormise.all(
//         products.map(async (product) => {
//           const item = await strapi
//             .service("api::item.item")
//             .findOne(product.id);
//           return {
//             price_data: {
//               currency: "usd",
//               product_data: {
//                 name: item.name,
//               },
//               unit_amount: item.price * 100,
//             },
//             quantity: product.count,
//           };
//         })
//       );

//       // create stripe session
//       const session = await stripe.checkout.sessions.create({
//         payment_method_type: ["card"],
//         customer_email: email,
//         mode: "payment",
//         success_url: "https://localhost:3000/checkout/success",
//         cancel_url: "https://localhost:3000",
//         line_items: lineItems,
//       });

//       //create item backend
//       await stripe.service("api::order.order").create({
//         data: { userName, products, stripeSessionId: session.id },
//       });

//       //return the session id
//       return { id: session.id };
//     } catch (error) {
//       ctx.response.status = 500;
//       return { error: "there was a problem!" };
//     }
//   },
// };
