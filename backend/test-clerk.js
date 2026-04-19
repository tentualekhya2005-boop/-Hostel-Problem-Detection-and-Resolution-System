const { createClerkClient } = require('@clerk/clerk-sdk-node');
console.log(Object.keys(createClerkClient({ secretKey: 'foo', publishableKey: 'bar' })));
