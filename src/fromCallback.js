// Usage:
//
//     fromCallback(cb => fs.readFile('foo.txt', cb))
//       .then(content => {
//         console.log(content)
//       })
const fromCallback = fn =>
  new Promise((resolve, reject) =>
    fn((error, result) => (error != null ? reject(error) : resolve(result)))
  );
module.exports = fromCallback;
