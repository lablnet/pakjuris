const { getBills } = require('./scrapers/bills');

(async() => {
    await getBills();
})();