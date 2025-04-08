const { getBrowserAndPage, _wait } = require('../helper/scraper');
const path = require('path');
const fs = require('fs');
const axios = require('axios'); // For direct downloads
const { uploadIfNotExists, fileExists } = require('../helper/s3');
// const { memberExists, addMember, uploadImage, getPartyByAbbreviation } = require('../../helper/supabase');

const BASE_URL = 'https://pakistancode.gov.pk/english/';
const MAIN_PAGE = 'LGu0xBD.php';
// Define download directory relative to the script's location
const DOWNLOAD_DIR = path.resolve(__dirname, '..', '..', 'downloads', 'bills');

// Ensure download directory exists
fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
console.log(`Downloads will be saved to: ${DOWNLOAD_DIR}`);

const getBills = async() => {
    const { browser, page } = await getBrowserAndPage();

    try {
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
        // console.log('Year URLs:', uniqueYearUrls); // Optional: log URLs

        // Limit years for testing if needed
        // const testYearUrls = uniqueYearUrls.filter(url => url.includes('year=2024')); // Example: Test with 2024 only
        const testYearUrls = uniqueYearUrls; // Process all years

        for (const yearUrl of testYearUrls) {
            let year = 'UnknownYear';
            try {
                year = new URL(yearUrl).searchParams.get('year') || 'UnknownYear';
            } catch (urlError) {
                console.warn(`Could not parse year from URL: ${yearUrl}`, urlError.message);
                continue; // Skip if URL is invalid
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

                for (const billInfo of billInfos) {
                    // Sanitize title for filename
                    const safeTitle = billInfo.title.replace(/[^a-z0-9\s-]/gi, '').replace(/[\s]+/g, '_');
                    const pdfFilename = `${year}_${safeTitle}.pdf`;
                    const pdfPath = path.join(DOWNLOAD_DIR, pdfFilename);
                    const s3Key = `bills/${year}/${pdfFilename}`;

                    // Check if file already exists in S3
                    try {
                        const existsInS3 = await fileExists(s3Key);
                        if (existsInS3) {
                            console.log(`  Skipping "${billInfo.title}" (already exists in S3: ${s3Key})`);
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
                            } else {
                                console.log(`  File already exists in S3, skipped upload: ${s3Key}`);
                            }
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

                                    // Check response status
                                    if (response.status !== 200) {
                                        throw new Error(`Download failed with status: ${response.status}`);
                                    }


                                    const writer = fs.createWriteStream(pdfPath);
                                    response.data.pipe(writer);

                                    await new Promise((resolve, reject) => {
                                        writer.on('finish', resolve);
                                        writer.on('error', (err) => {
                                            console.error(`    Error writing file ${pdfFilename}:`, err);
                                            // Clean up incomplete file on error
                                            fs.unlink(pdfPath, () => reject(err));
                                        });
                                        response.data.on('error', (err) => {
                                            console.error(`    Error during download stream for ${pdfFilename}:`, err);
                                            // Clean up incomplete file on error
                                            fs.unlink(pdfPath, () => reject(err));
                                        });
                                    });
                                    console.log(`    Successfully downloaded ${pdfFilename}`);

                                    // Upload to S3 after successful download
                                    try {
                                        const s3Key = `bills/${year}/${pdfFilename}`;
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
                                            console.log(`    Successfully uploaded to S3: ${s3Key}`);
                                        } else {
                                            console.log(`    File already exists in S3, skipped upload: ${s3Key}`);
                                        }
                                    } catch (s3Error) {
                                        console.error(`    Error uploading to S3: ${s3Error.message}`);
                                    }
                                } catch (downloadError) {
                                    console.error(`    Error downloading ${pdfUrl} using axios:`, downloadError.message);
                                    // Attempt to remove potentially corrupt partial file
                                    if (fs.existsSync(pdfPath)) {
                                        fs.unlink(pdfPath, (unlinkErr) => {
                                            if (unlinkErr) console.error(`    Error removing partial file ${pdfPath}:`, unlinkErr);
                                        });
                                    }
                                }

                            } else {
                                console.log(`    Could not extract PDF URL from link found with selector: ${pdfLinkSelector}`);
                            }

                        } catch (tabOrLinkError) {
                            console.error(`    Error finding/clicking download tab or PDF link for bill "${billInfo.title}" (${billInfo.href}):`, tabOrLinkError.message);
                        }

                    } catch (billNavError) {
                        console.error(`  Error navigating to or processing bill page ${billInfo.href}:`, billNavError.message);
                    }
                    await _wait(1500); // Small delay before next bill
                }

            } catch (yearNavError) {
                console.error(`Error navigating to or processing year page ${yearUrl}:`, yearNavError.message);
            }
            await _wait(2500); // Small delay before next year
        }

        console.log('\n--- Scraping finished ---');

    } catch (error) {
        console.error('An unexpected error occurred during scraping:', error);
    } finally {
        if (browser) {
            await browser.close();
            console.log('Browser closed.');
        }
    }
}

module.exports = {
    getBills
}