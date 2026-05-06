const querystring = require('querystring');

const sortObject = (obj) => {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
};

const params = { a: 'hello world', b: 'foo/bar' };
const sorted = sortObject(params);
console.log('Sorted params:', sorted);

const signDataBuggy = querystring.stringify(sorted, { encode: false });
console.log('Buggy stringify (passing object as sep):', signDataBuggy);

const signDataCustom = querystring.stringify(sorted, '&', '=', { encodeURIComponent: (s) => s });
console.log('Custom stringify (no double encode):', signDataCustom);
