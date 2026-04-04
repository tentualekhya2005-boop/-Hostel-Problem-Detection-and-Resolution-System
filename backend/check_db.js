const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin19122005:password19122005@cluster0.pldc8.mongodb.net/hostel-management?retryWrites=true&w=majority')
.then(async () => {
    const db = mongoose.connection.db;
    const c = await db.collection('complaints').find({imageUrl: {$ne: null}}).toArray();
    console.log(c.map(x => x.imageUrl));
    process.exit(0);
});
