const { getBrowserAndPage, _wait } = require('../helper/scraper');
const path = require('path');
const fs = require('fs');
const axios = require('axios'); // For direct downloads
const { uploadIfNotExists, fileExists } = require('../helper/s3');
const { MongoClient } = require('mongodb');
// const { memberExists, addMember, uploadImage, getPartyByAbbreviation } = require('../../helper/supabase');

// MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB;
const COLLECTION_NAME = process.env.MONGODB_COLLECTION;
const SCRAPER_STATE_COLLECTION = 'scraper_state'; // Collection to store scraper state

// Base URLs and storage configuration
const BASE_URL = 'https://pakistancode.gov.pk/english/';
const MAIN_PAGE = 'LGu0xBD.php';
// Define download directory relative to the script's location
const DOWNLOAD_DIR = path.resolve(__dirname, '..', '..', 'downloads', 'bills');

// Ensure download directory exists
fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
console.log(`Downloads will be saved to: ${DOWNLOAD_DIR}`);

// MongoDB client
let mongoClient;
let billsCollection;
let scraperStateCollection;

// Initialize MongoDB connection
async function initMongoDB() {
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    try {
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        console.log('Connected to MongoDB for bills scraper');
        
        const db = mongoClient.db(DB_NAME);
        billsCollection = db.collection(COLLECTION_NAME);
        scraperStateCollection = db.collection(SCRAPER_STATE_COLLECTION);
        
        return { billsCollection, scraperStateCollection };
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}

// Check if bill already exists in MongoDB
async function billExistsInMongoDB(year, title) {
    if (!billsCollection) {
        throw new Error('MongoDB not initialized');
    }
    
    const normalizedTitle = title.toLowerCase().replace(/[^\w\s]/g, '').trim();
    console.log(`Checking if bill exists in MongoDB: ${year} - ${normalizedTitle}`);
    
    const existingBill = await billsCollection.findOne({
        year: year,
        title: { $regex: new RegExp(`^${normalizedTitle.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
    });
    
    return !!existingBill;
}

// Save bill metadata to MongoDB
async function saveBillToMongoDB(billData) {
    if (!billsCollection) {
        throw new Error('MongoDB not initialized');
    }
    
    try {
        const normalizedTitle = billData.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
        
        // Check if it already exists first
        const existingBill = await billsCollection.findOne({
            year: billData.year,
            title: { $regex: new RegExp(`^${normalizedTitle.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
        });
        
        if (existingBill) {
            console.log(`Bill already exists in MongoDB: ${billData.year} - ${billData.title}`);
            return existingBill._id;
        }
        
        // Set created/updated timestamps
        billData.createdAt = new Date();
        billData.updatedAt = new Date();
        
        const result = await billsCollection.insertOne(billData);
        console.log(`Bill saved to MongoDB with ID: ${result.insertedId}`);
        return result.insertedId;
    } catch (error) {
        console.error(`Error saving bill to MongoDB: ${error.message}`);
        throw error;
    }
}

// Save scraper state to MongoDB for resumability
async function saveScraperState(year, lastProcessedBillIndex) {
    if (!scraperStateCollection) {
        throw new Error('MongoDB not initialized');
    }
    
    try {
        await scraperStateCollection.updateOne(
            { scraper: 'bills' },
            { 
                $set: { 
                    lastProcessedYear: year,
                    lastProcessedBillIndex: lastProcessedBillIndex,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );
        console.log(`Saved scraper state: Year ${year}, Bill Index ${lastProcessedBillIndex}`);
    } catch (error) {
        console.error(`Error saving scraper state: ${error.message}`);
    }
}

// Get scraper state from MongoDB
async function getScraperState() {
    if (!scraperStateCollection) {
        throw new Error('MongoDB not initialized');
    }
    
    try {
        const state = await scraperStateCollection.findOne({ scraper: 'bills' });
        if (state) {
            console.log(`Retrieved scraper state: Year ${state.lastProcessedYear}, Bill Index ${state.lastProcessedBillIndex}`);
        } else {
            console.log('No saved scraper state found, starting from beginning');
        }
        return state;
    } catch (error) {
        console.error(`Error retrieving scraper state: ${error.message}`);
        return null;
    }
}

// Get the current year
function getCurrentYear() {
    return new Date().getFullYear().toString();
}

const getBills = async(onlyCurrentYear = true) => {
    const { browser, page } = await getBrowserAndPage();
    
    try {
        // Initialize MongoDB connection
        await initMongoDB();
        
        // Get the last saved scraper state
        const scraperState = await getScraperState();
        let resumeYear = null;
        let resumeBillIndex = -1;
        
        if (scraperState) {
            resumeYear = scraperState.lastProcessedYear;
            resumeBillIndex = scraperState.lastProcessedBillIndex;
            console.log(`Retrieved previous scraper state: Year ${resumeYear}, Bill Index ${resumeBillIndex}`);
        }
        
        // Get current year for filtering
        const currentYear = getCurrentYear();
        console.log(`Current year is: ${currentYear}`);
        
        // Start scraping process
        await page.goto(BASE_URL + MAIN_PAGE, { waitUntil: 'networkidle', timeout: 60000 });
        console.log('Navigated to main page:', BASE_URL + MAIN_PAGE);
        await _wait(5000); // Wait for initial page load and potential JS execution

        // --- Get Year Links ---
        const yearLinksSelector = '#primary-legislation div[style*="text-align: center"] a[href*="LGu0xBD?year="]';
        try {
            await page.waitForSelector(yearLinksSelector, { timeout: 15000 });
            console.log('Found year links container.');
        } catch (e) {
            console.error("Could not find year links container. Selector:", yearLinksSelector);
            throw e; // Stop if we can't even find the years
        }


        const yearUrls = await page.$$eval(yearLinksSelector, (links) =>
            links
            .map((a) => a.href)
            // Ensure we only get links from the primary-legislation tab initially
            // (The selector is specific, but this adds robustness)
            .filter(href => {
                try {
                    const url = new URL(href);
                    return url.searchParams.get('action') === 'inactive' || !url.searchParams.has('action');
                } catch {
                    return false; // Ignore invalid URLs
                }
            })
        );

        // Filter unique URLs
        const uniqueYearUrls = [...new Set(yearUrls)];
        console.log(`Found ${uniqueYearUrls.length} unique year URLs.`);
        
        // Filter for only the current year if specified
        let yearsToProcess = uniqueYearUrls;
        if (onlyCurrentYear) {
            yearsToProcess = uniqueYearUrls.filter(url => {
                try {
                    const year = new URL(url).searchParams.get('year');
                    return year === currentYear;
                } catch {
                    return false;
                }
            });
            console.log(`Filtered to ${yearsToProcess.length} URLs for current year ${currentYear}.`);
            
            if (yearsToProcess.length === 0) {
                console.log(`⚠️ No URL found for current year ${currentYear}. The website might not have updated yet.`);
                return;
            }
        } else {
            // If processing all years, sort them in descending order (newest first)
            yearsToProcess.sort((a, b) => {
                const yearA = new URL(a).searchParams.get('year') || '0';
                const yearB = new URL(b).searchParams.get('year') || '0';
                return parseInt(yearB) - parseInt(yearA);
            });
        }

        // Process each selected year
        for (const yearUrl of yearsToProcess) {
            let year = 'UnknownYear';
            try {
                year = new URL(yearUrl).searchParams.get('year') || 'UnknownYear';
            } catch (urlError) {
                console.warn(`Could not parse year from URL: ${yearUrl}`, urlError.message);
                continue; // Skip if URL is invalid
            }
            
            // For current year only mode, reset the resume state if it's a new year
            if (onlyCurrentYear && resumeYear !== year) {
                console.log(`New year detected (${year} vs previous ${resumeYear}). Resetting resume index.`);
                resumeBillIndex = -1; // Reset to process all bills in the new year
                // We don't reset resumeYear because we still want to know where we left off
            }

            console.log(`\n--- Processing Year: ${year} ---`);
            console.log(`Navigating to year page: ${yearUrl}`);
            try {
                await page.goto(yearUrl, { waitUntil: 'networkidle', timeout: 60000 });
                await _wait(4000); // Extra wait for content rendering

                // Check for "No Records Found" before trying to find bills
                const noRecordsSelector = '#primary-legislation .accordion p';
                const noRecordsElement = await page.$(noRecordsSelector);
                if (noRecordsElement) {
                    const noRecordsText = await page.evaluate(el => el.textContent.trim(), noRecordsElement);
                    if (noRecordsText && noRecordsText.includes('No Records Found')) {
                        console.log(`No records found for year ${year}. Skipping.`);
                        continue; // Skip to the next year
                    }
                }

                // --- Get Bill Links for the Current Year ---
                const billLinksSelector = '#primary-legislation .accordion .accordion-section .accordion-section-title a';
                try {
                    await page.waitForSelector(billLinksSelector, { timeout: 15000 });
                    console.log(`Found bill links container for year ${year}.`);
                } catch (e) {
                    console.warn(`Could not find bill links for year ${year} using selector: ${billLinksSelector}. Skipping year.`);
                    continue; // Skip to the next year if no bill links found
                }

                const billInfos = await page.$$eval(billLinksSelector, (links) =>
                    links.map((a) => ({
                        href: a.href,
                        // Clean up title: remove numbering, excessive whitespace
                        title: a.textContent.replace(/^\s*\d+\.\s*/, '').trim() || 'UnknownBill'
                    }))
                );
                console.log(`Found ${billInfos.length} bills for year ${year}.`);

                // Process each bill for the current year
                for (let billIndex = 0; billIndex < billInfos.length; billIndex++) {
                    const billInfo = billInfos[billIndex];
                    
                    // Skip bills until we reach the resume point
                    if (resumeYear === year && billIndex <= resumeBillIndex) {
                        console.log(`  Skipping bill ${billIndex} (already processed in previous run)`);
                        continue;
                    }
                    
                    // Sanitize title for filename
                    const safeTitle = billInfo.title.replace(/[^a-z0-9\s-]/gi, '').replace(/[\s]+/g, '_');
                    const pdfFilename = `${year}_${safeTitle}.pdf`;
                    const pdfPath = path.join(DOWNLOAD_DIR, pdfFilename);
                    const s3Key = `bills/${year}/${pdfFilename}`;
                    
                    // Check if bill exists in MongoDB
                    try {
                        const billExists = await billExistsInMongoDB(year, billInfo.title);
                        if (billExists) {
                            console.log(`  Skipping "${billInfo.title}" (already exists in MongoDB)`);
                            // Save state after skipping
                            await saveScraperState(year, billIndex);
                            continue;
                        }
                    } catch (dbError) {
                        console.error(`  Error checking MongoDB: ${dbError.message}`);
                        // Continue with S3 check despite DB error
                    }

                    // Check if file already exists in S3
                    try {
                        const existsInS3 = await fileExists(s3Key);
                        if (existsInS3) {
                            console.log(`  Skipping "${billInfo.title}" (already exists in S3: ${s3Key})`);
                            
                            // If it exists in S3 but not in MongoDB, add it to MongoDB
                            console.log(`  Adding existing S3 file metadata to MongoDB: ${billInfo.title}`);
                            await saveBillToMongoDB({
                                title: billInfo.title,
                                year: year,
                                pdfFilename: pdfFilename,
                                sourceUrl: billInfo.href,
                                s3Key: s3Key,
                                s3Url: `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${s3Key}`
                            });
                            
                            // Save state after processing
                            await saveScraperState(year, billIndex);
                            continue;
                        }
                    } catch (s3CheckError) {
                        console.error(`  Error checking if file exists in S3: ${s3CheckError.message}`);
                        // Continue with local file check and download despite S3 check error
                    }

                    // Check if file already exists locally
                    if (fs.existsSync(pdfPath)) {
                        console.log(`  File exists locally "${billInfo.title}" (${pdfFilename}), uploading to S3 if needed`);

                        try {
                            const fileContent = fs.readFileSync(pdfPath);
                            const uploadResult = await uploadIfNotExists(
                                s3Key,
                                fileContent,
                                'application/pdf', {
                                    Metadata: {
                                        'bill-title': billInfo.title,
                                        'bill-year': year,
                                        'uploaded-date': new Date().toISOString()
                                    }
                                }
                            );

                            if (uploadResult) {
                                console.log(`  Successfully uploaded existing local file to S3: ${s3Key}`);
                                
                                // Save to MongoDB after successful S3 upload
                                await saveBillToMongoDB({
                                    title: billInfo.title,
                                    year: year,
                                    pdfFilename: pdfFilename,
                                    sourceUrl: billInfo.href,
                                    s3Key: s3Key,
                                    s3Url: `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${s3Key}`
                                });
                            } else {
                                console.log(`  File already exists in S3, skipped upload: ${s3Key}`);
                            }
                            
                            // Save state after processing
                            await saveScraperState(year, billIndex);
                            continue; // Skip the download part
                        } catch (s3UploadError) {
                            console.error(`  Error uploading existing local file to S3: ${s3UploadError.message}`);
                            continue; // Skip to next bill since we already have it locally
                        }
                    }

                    console.log(`  Processing Bill: ${billInfo.title}`);
                    console.log(`    Navigating to bill page: ${billInfo.href}`);
                    try {
                        await page.goto(billInfo.href, { waitUntil: 'networkidle', timeout: 60000 });
                        await _wait(5000); // Wait for bill page load and potential JS

                        // --- Find and Click Download Tab ---
                        const downloadTabSelector = 'a#pills-profile-tab[href="#download"]';
                        try {
                            await page.waitForSelector(downloadTabSelector, { timeout: 10000, visible: true });
                            console.log('    Found download tab.');
                            // Click the tab using evaluate to avoid potential issues with element obstruction
                            await page.evaluate(selector => {
                                const element = document.querySelector(selector);
                                if (element) element.click();
                            }, downloadTabSelector);
                            // await page.click(downloadTabSelector); // Alternative click
                            console.log('    Clicked download tab.');
                            await _wait(2500); // Wait for tab content to potentially load/become visible

                            // --- Find the Actual Download Link inside the #download tab ---
                            const pdfLinkSelector = '#download a[href*=".pdf"]'; // Selector for PDF link within the download tab
                            await page.waitForSelector(pdfLinkSelector, { visible: true, timeout: 10000 });
                            console.log('    Found PDF download link.');

                            const pdfUrl = await page.$eval(pdfLinkSelector, (link) => link.href);

                            if (pdfUrl) {
                                console.log(`    PDF URL found: ${pdfUrl}`);
                                console.log(`    Attempting to download to: ${pdfPath}`);

                                // --- Download the PDF using axios ---
                                try {
                                    const response = await axios({
                                        method: 'GET',
                                        url: pdfUrl,
                                        responseType: 'stream',
                                        timeout: 120000, // 2 minutes timeout for download
                                        headers: {
                                            'User-Agent': await page.evaluate(() => navigator.userAgent), // Get browser's user agent
                                            'Referer': page.url(), // Set referer header
                                            'Accept': 'application/pdf,*/*' // Be explicit about accepting PDF
                                        }
                                    });

                                    // Write the PDF file to disk
                                    const writer = fs.createWriteStream(pdfPath);
                                    let completeFlag = false;

                                    writer.on('finish', async () => {
                                        if (completeFlag) return; // Avoid double-processing
                                        completeFlag = true;
                                        console.log(`    ✅ PDF saved successfully: ${pdfPath}`);

                                        try {
                                            // Upload the file to S3
                                            const fileContent = fs.readFileSync(pdfPath);
                                            console.log(`    Uploading to S3: ${s3Key}`);
                                            await uploadIfNotExists(
                                                s3Key,
                                                fileContent,
                                                'application/pdf', {
                                                    Metadata: {
                                                        'bill-title': billInfo.title,
                                                        'bill-year': year,
                                                        'uploaded-date': new Date().toISOString()
                                                    }
                                                }
                                            );
                                            console.log(`    ✅ Successfully uploaded to S3: ${s3Key}`);
                                            
                                            // Save to MongoDB after successful S3 upload
                                            await saveBillToMongoDB({
                                                title: billInfo.title,
                                                year: year,
                                                pdfFilename: pdfFilename,
                                                sourceUrl: billInfo.href,
                                                s3Key: s3Key,
                                                s3Url: `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${s3Key}`
                                            });
                                            
                                            // Update scraper state after successful processing
                                            await saveScraperState(year, billIndex);
                                        } catch (err) {
                                            console.error(`    ❌ Error in upload/save process: ${err.message}`);
                                        }
                                    });

                                    writer.on('error', (err) => {
                                        if (completeFlag) return; // Avoid double-error handling
                                        completeFlag = true;
                                        console.error(`    ❌ Error writing PDF to disk: ${err.message}`);
                                    });

                                    response.data.pipe(writer);
                                    
                                    // Wait for a reasonable amount of time for the write to complete
                                    await new Promise((resolve) => setTimeout(resolve, 5000));
                                } catch (downloadError) {
                                    console.error(`    ❌ Error downloading PDF: ${downloadError.message}`);
                                }
                            } else {
                                console.error(`    ❌ No PDF URL found in link element.`);
                            }
                        } catch (tabError) {
                            console.error(`    ❌ Error with download tab: ${tabError.message}`);
                        }
                    } catch (pageError) {
                        console.error(`    ❌ Error navigating to bill page: ${pageError.message}`);
                    }
                    
                    // Add a delay between bill processing to avoid overloading the server
                    console.log(`    Waiting 3 seconds before processing next bill...`);
                    await _wait(3000);
                }
            } catch (yearError) {
                console.error(`❌ Error processing year ${year}: ${yearError.message}`);
            }
        }

        console.log('✅ Scraping process completed successfully.');
    } catch (error) {
        console.error(`❌ Error in bills scraper: ${error.message}`);
    } finally {
        // Close browser
        if (browser) await browser.close();
        // Close MongoDB connection
        if (mongoClient) await mongoClient.close();
    }
};

// Execute the scraper
// Pass true to only process the current year (default), or false to process all years
getBills(true).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

module.exports = {
    getBills
}