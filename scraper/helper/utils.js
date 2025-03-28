const { _wait } = require('./scraper');

/**
 * Find duplicates in an array of objects by a specific property
 * 
 * @param {Array} array - The array of objects to search for duplicates
 * @param {string} property - The property to search for duplicates by
 * 
 * @since v1.0.0
 * @author Muhammad Umer Farooq <umer@lablnet.com>
 * @returns {Array} - The array of duplicate objects
 */
function findDuplicatesByProperty(array, property) {
    const seenValues = {};
    const duplicates = [];

    array.forEach((item) => {
        const value = item[property];
        if (seenValues[value]) {
            duplicates.push(item);
        } else {
            seenValues[value] = true;
        }
    });

    return duplicates;
}

async function infiniteScroll(page) {
    let lastHeight = 0;
    let currentHeight = 0;

    while (true) {
        lastHeight = currentHeight;
        currentHeight = await page.evaluate('document.body.scrollHeight');

        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        await _wait(7000);

        if (currentHeight === lastHeight) {
            break;
        }
    }
}

module.exports = {
    findDuplicatesByProperty,
    infiniteScroll
}