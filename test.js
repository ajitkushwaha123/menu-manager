const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

// ─── CONFIG ───────────────────────────────────────────────────────────
const IMAGE_PATH = "C:/Users/RentoBees/Downloads/Chicken Korma Masala Fry.jpg";   // ← change this
const DISH_NAME = 'Chicken Korma';      // ← change this
const BEARER_TOKEN = 'b2193b65-bbf3-49c8-9616-d7a31bc481a4';
const PROD_CAT_ID = 'cat_Ujt0kuFxF';
// ─────────────────────────────────────────────────────────────────────

async function uploadImage(imagePath, dishName) {
    const imageBuffer = fs.readFileSync(imagePath);
    const uuid = uuidv4();
    const imageName = `web-sdk/food/${uuid}/${dishName}.jpg`;

    // ── STEP 1: Get pre-signed URL ──────────────────────────────────
    console.log('/cln[1/2] Requesting pre-signed URL from Clippr...');

    const form = new FormData();
    form.append('image_name', imageName);
    form.append('project_details', 'true');
    form.append('prod_cat_id', PROD_CAT_ID);
    form.append('source', 'web_sdk');
    form.append('project_name', 'Swiggy');
    form.append('sku_name', dishName);

    const clipprRes = await fetch('https://www.clippr.ai/api/fv1/upload/image', {
        method: 'PUT',
        headers: {
            authorization: `Bearer ${BEARER_TOKEN}`,
            origin: 'https://partner.swiggy.com',
            referer: 'https://partner.swiggy.com/',
            ...form.getHeaders(),
        },
        body: form,
    });

    if (!clipprRes.ok) {
        const txt = await clipprRes.text();
        throw new Error(`Clippr failed [${clipprRes.status}]: ${txt}`);
    }

    const { data } = await clipprRes.json();
    const { presigned_url, file_url, project_id, sku_id, request_id } = data;

    console.log('   ✅ Pre-signed URL received');
    console.log('   project_id :', project_id);
    console.log('   sku_id     :', sku_id);
    console.log('   request_id :', request_id);

    // ── STEP 2: Upload raw binary to S3 ────────────────────────────
    console.log('/cln[2/2] Uploading image binary to S3...');

    const s3Res = await fetch(presigned_url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'image/jpeg',
            'Content-Length': String(imageBuffer.length),
            'Origin': 'https://partner.swiggy.com',
            'Referer': 'https://partner.swiggy.com/',
        },
        body: imageBuffer,
    });

    if (!s3Res.ok) {
        const txt = await s3Res.text();
        throw new Error(`S3 upload failed [${s3Res.status}]: ${txt}`);
    }

    console.log('   ✅ S3 upload successful');

    return { file_url, project_id, sku_id, request_id };
}

// ─── MAIN ─────────────────────────────────────────────────────────────
(async () => {
    try {
        if (!fs.existsSync(IMAGE_PATH)) {
            throw new Error(`Image not found at: ${IMAGE_PATH}`);
        }

        console.log(`Uploading: ${IMAGE_PATH} → "${DISH_NAME}"`);
        const result = await uploadImage(IMAGE_PATH, DISH_NAME);

        console.log('/cln🎉 Upload complete!');
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('/cln❌', err.message);
        process.exit(1);
    }
})();