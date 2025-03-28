const { getBrowserAndPage, _wait } = require('../../helper/scraper');
const { memberExists, addMember, uploadImage, getPartyByAbbreviation } = require('../../helper/supabase');

const parties = {
    "PPPP": "ppp",
    "PML": "-"
}

/**
 * Transforms member data to match the database schema.
 *
 * @param {Object} memberData - The original member data object.
 * @returns {Object} - The transformed member data object.
 */
function transformMemberData(memberData) {
    // Create a shallow copy to avoid mutating the original object
    const transformedData = {...memberData };

    // 1. Rename keys as per the database schema
    if (transformedData.contact_number) {
        transformedData.phone = transformedData.contact_number;
        delete transformedData.contact_number;
    }

    if (transformedData.party) {
        // Transform the party string by replacing space and parentheses with a dash
        // Example: "PML (N)" -> "PML-N"
        transformedData.party_abbreviation = transformedData.party.replace(/\s*\(([^)]+)\)/, '-$1');
        delete transformedData.party;
    }

    // 2. Handle potential renaming of father_s_name to father_name
    if (transformedData.father_s_name) {
        transformedData.father_name = transformedData.father_s_name;
        delete transformedData.father_s_name;
    }

    // 3. Ensure oath_taken_date is a Date object
    if (transformedData.oath_taken_date && typeof transformedData.oath_taken_date === 'string') {
        transformedData.oath_taken_date = new Date(transformedData.oath_taken_date);
    }

    // 4. Add missing fields with default values or handle accordingly
    if (!transformedData.bio) {
        transformedData.bio = ''; // Set a default bio or handle as needed
    }

    if (!transformedData.email) {
        transformedData.email = ''; // Set a default email or handle as needed
    }

    // 5. Ensure all keys match the database schema and remove any extras
    const dbFields = [
        'name',
        'father_name',
        'bio',
        'email',
        'phone',
        'permanent_address',
        'local_address',
        'province',
        'constituency',
        'oath_taken_date',
        'image_url',
        'party_abbreviation'
    ];

    Object.keys(transformedData).forEach(key => {
        if (!dbFields.includes(key)) {
            delete transformedData[key];
        }
    });

    return transformedData;
}

async function getMemberDetails(page, url) {
    await page.goto(url);
    await _wait(1000);
    const memberData = await page.evaluate(() => {
        const tableRows = Array.from(document.querySelectorAll('.profile_tbl tr'));

        const data = {};
        for (const row of tableRows) {
            const th = row.querySelector('th');
            const td = row.querySelector('td');

            if (th && td) {
                const key = th.innerText.trim().toLowerCase().replace(/[^a-z0-9]+/gi, '_'); // Convert to snake_case
                data[key] = td.innerText.trim();
            }
        }


        const imageUrl = document.querySelector('.profile_tbl td img').src; // Image URL
        data.image_url = imageUrl;

        // Data cleaning and formatting where necessary
        if (data.oath_taking_date) {
            const parts = data.oath_taking_date.split('-'); // Assuming DD-MM-YYYY format
            if (parts.length === 3) {
                data.oath_taken_date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); // Convert to YYYY-MM-DD for Supabase
            }
        }

        return data;
    });
    // update father_s_name to father_name
    memberData.father_name = memberData.father_s_name;
    delete memberData.father_s_name;
    return memberData;
}

async function getMembers() {
    const { browser, page } = await getBrowserAndPage();
    await page.goto('https://www.na.gov.pk/en/all-members.php');

    const memberUrls = await page.evaluate(() => {
        const urls = [];
        const memberLinks = document.querySelectorAll('td#mna a');
        for (const link of memberLinks) {
            urls.push(link.href);
        }
        return urls;
    });

    console.log(memberUrls);
    for (const url of memberUrls) {
        let memberData = await getMemberDetails(page, url);
        memberData = transformMemberData(memberData);
        console.log(memberData);
        if (await memberExists(memberData.name, memberData.father_name, memberData.constituency)) {
            console.log(`Member ${memberData.name} already exists`);
            continue;
        }
        let abbr = memberData.party_abbreviation
            // if that abbr exists in parties than get form there otherwise keep it.
        if (parties[abbr]) {
            abbr = parties[abbr];
        }

        const party = await getPartyByAbbreviation(abbr);
        if (!party) {
            console.log(`Party ${memberData.party_abbreviation} not found`);
            continue;
        }
        console.log("party", party);
        memberData.party_abbreviation = party[0].abbreviation;

        // fetch image and upload to supabase
        const imageResponse = await fetch(memberData.image_url);

        // ***KEY CHANGE HERE***:  Get the image as an ArrayBuffer first.
        const arrayBuffer = await imageResponse.arrayBuffer();

        // THEN, convert the ArrayBuffer to a Buffer:
        const imageBuffer = Buffer.from(arrayBuffer);
        const imageUrl = await uploadImage('members', imageBuffer, `${memberData.name}-${memberData.father_name}-${memberData.constituency}.jpg`);
        memberData.image_url = imageUrl;
        let errorMembers = [];
        try {
            await addMember(memberData);
            // remove the link from the list
            memberUrls.splice(memberUrls.indexOf(url), 1);
        } catch (e) {
            console.log("Error", e);
            errorMembers.push(memberData);
        }
        console.log(`Added member ${memberData.name}`);
        //break;
    }
    // store remaining links in a JSON file.
    fs.writeFileSync('remaining_links.json', JSON.stringify(memberUrls, null, 2));
    await browser.close();
}

module.exports = {
    getMembers
}