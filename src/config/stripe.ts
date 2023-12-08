export const PLANS = [{
    name: "Free",
    slug: 'free',
    quota: 10,
    pagesPerPDF: 5,
    price: {
        amount: 0,
        priceIds: {
            test: '',
            production: ''
        }
    }
},
{
    name: "Pro",
    slug: 'pro',
    quota: 50,
    pagesPerPDF: 25,
    price: {
        amount: 999,
        priceIds: {
            test: 'price_1OL0T0SGDCND70da44iQKtdS',
            production: ''  // when not in test mode -> stripe
        }
    }
}]