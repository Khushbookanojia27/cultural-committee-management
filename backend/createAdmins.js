require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
    console.log("✅ MongoDB Connected");

    const admins = [
        {
            name: "Sanjeeevni Rai",
            email: "SanjeeevniRai@college.com",
            phone: "9000000001",
            password: "Sanjeeevni@123",
            role: "admin",
        },
        {
    name: "Priya Shah",
    email: "PriyaShah@college.com",
    phone: "9000000001",
    password: "Priya@123",
    role: "admin",
  },
  {
    name: "Khushboo Kanojia",
    email: "KhushbooKanojia@college.com",
    phone: "9000000002",
    password: "Khushboo@123",
    role: "admin",
  },
];

    for (const admin of admins) {

        const exists = await User.findOne({ email: admin.email });

        if (exists) {
            console.log(`${admin.email} already exists`);
            continue;
        }

        const hashedPassword = await bcrypt.hash(admin.password, 12);

        await User.create({
            name: admin.name,
            email: admin.email,
            phone: admin.phone,
            password: hashedPassword,
            role: admin.role,
        });

        console.log(`${admin.email} created`);
    }

    console.log("🎉 All Admin Accounts Created");
    process.exit();

})
.catch(err => {
    console.log(err);
    process.exit();
});