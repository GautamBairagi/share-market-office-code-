const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TOTAL_USERS = 1000000;
const CSV_FILE = path.join(__dirname, 'users_1m.csv').replace(/\\/g, '/');

const firstNames = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
    'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Advaith', 'Aaryan', 'Dhruv', 'Kabir', 'Ritvik', 'Darsh',
    'Ananya', 'Diya', 'Gauri', 'Isha', 'Kavya', 'Khushi', 'Navya', 'Pooja', 'Priya', 'Riya',
    'Saanvi', 'Sara', 'Sneha', 'Tanvi', 'Vanshika', 'Aarohi', 'Myra', 'Aditi', 'Kiara', 'Anushka',
    'Rahul', 'Amit', 'Rohit', 'Vikas', 'Suresh', 'Ankit', 'Deepak', 'Sunil', 'Manoj', 'Ravi',
    'Neeraj', 'Kunal', 'Sachin', 'Rajesh', 'Alok', 'Ajay', 'Vijay', 'Sanjay', 'Manish', 'Pankaj'
];

const lastNames = [
    'Sharma', 'Verma', 'Singh', 'Gupta', 'Patel', 'Yadav', 'Jain', 'Mishra', 'Kumar', 'Chauhan',
    'Mehta', 'Shah', 'Aggarwal', 'Pandey', 'Tiwari', 'Rathore', 'Saxena', 'Bansal', 'Dubey', 'Joshi',
    'Bhatia', 'Malhotra', 'Kapoor', 'Reddy', 'Nair', 'Iyer', 'Menon', 'Pillai', 'Rao', 'Deshmukh'
];

const cities = [
    'Mumbai', 'Delhi', 'Ahmedabad', 'Indore', 'Jaipur', 'Surat', 'Pune', 'Kolkata', 'Bangalore', 'Hyderabad',
    'Bhopal', 'Nagpur', 'Lucknow', 'Kanpur', 'Patna', 'Vadodara', 'Ludhiana', 'Agra', 'Nashik', 'Rajkot'
];

const BCRYPT_PASS = '$2b$10$bPnx8qums9S.D/U1khV1h.SvRrAlVJI7.6RrY0kJSPLkxAcNVX//i';
const BCRYPT_TX_PASS = '$2b$10$ixFZedbQ7mbMPhxwbVIT5Oo4GWrZDSg6bpfVGWDymyxv6EcfwaozO';

console.log(`[1/3] Generating CSV for ${TOTAL_USERS.toLocaleString()} users at: ${CSV_FILE}`);
const startTime = Date.now();

const writeStream = fs.createWriteStream(CSV_FILE, { encoding: 'utf8', highWaterMark: 1024 * 1024 });

let i = 1;
function writeBatch() {
    let ok = true;
    while (i <= TOTAL_USERS && ok) {
        const fn = firstNames[i % firstNames.length];
        const ln = lastNames[Math.floor(i / 13) % lastNames.length];
        const fullName = `${fn} ${ln}`;
        const username = `CL${String(1000000 + i).padStart(7, '0')}`;
        const email = `client${1000000 + i}@trading.local`;
        const mobile = `98${String(10000000 + (i % 90000000)).slice(-8)}`;
        const city = cities[i % cities.length];
        const status = (i % 25 === 0) ? 'Inactive' : 'Active';
        const isDemo = (i % 30 === 0) ? 1 : 0;
        const balance = ((i * 137) % 500000 + 1000).toFixed(4);
        const creditLimit = ((i * 59) % 50000).toFixed(4);

        // CSV line:
        // username,password,transaction_password,full_name,email,mobile,role,status,parent_id,balance,credit_limit,exposure_multiplier,city,is_demo
        const line = `${username},${BCRYPT_PASS},${BCRYPT_TX_PASS},${fullName},${email},${mobile},TRADER,${status},1,${balance},${creditLimit},1,${city},${isDemo}\n`;

        i++;
        if (i > TOTAL_USERS) {
            writeStream.write(line, onFinishWriting);
            return;
        } else {
            ok = writeStream.write(line);
        }
    }

    if (i <= TOTAL_USERS) {
        writeStream.once('drain', writeBatch);
    }
}

function onFinishWriting() {
    writeStream.end();
}

writeStream.on('finish', () => {
    const csvTime = ((Date.now() - startTime) / 1000).toFixed(2);
    const stats = fs.statSync(CSV_FILE);
    console.log(`[2/3] CSV generation complete in ${csvTime}s! File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

    console.log(`[3/3] Importing CSV into MySQL database 'trading_new' using LOAD DATA INFILE...`);
    const importStart = Date.now();

    const sqlCommand = `
        LOAD DATA INFILE '${CSV_FILE}'
        INTO TABLE users
        FIELDS TERMINATED BY ','
        LINES TERMINATED BY '\\n'
        (username, password, transaction_password, full_name, email, mobile, role, status, parent_id, balance, credit_limit, exposure_multiplier, city, is_demo);
    `.replace(/\s+/g, ' ').trim();

    try {
        const cmd = `"C:\\xampp\\mysql\\bin\\mysql.exe" -u root trading_new -e "${sqlCommand}"`;
        execSync(cmd, { stdio: 'inherit' });
        const importTime = ((Date.now() - importStart) / 1000).toFixed(2);
        console.log(`[SUCCESS] 1,000,000 users successfully imported in ${importTime}s!`);

        // Clean up CSV file to free disk space
        try {
            fs.unlinkSync(CSV_FILE);
            console.log(`Cleaned up temporary CSV file.`);
        } catch (_) {}
    } catch (err) {
        console.error(`[ERROR] MySQL import failed:`, err.message);
        process.exit(1);
    }
});

writeBatch();
