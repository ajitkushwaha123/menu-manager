const axios = require('axios');
axios.get('http://localhost:3000/api/images/search?q=dose&page=1&limit=12&platform=swiggy')
  .then(res => {
    console.log("Success:", res.data.success);
    console.log("Data length:", res.data.data ? res.data.data.length : 'undefined');
  })
  .catch(err => console.error(err.message));
