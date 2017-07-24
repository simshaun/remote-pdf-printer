/*
 * If you throw an Error in an async route handler function, Express will hang indefinitely.
 * This is because Express does not handle promise rejections for you.
 *
 * This simple wrapper function allows you to wrap an async route handler function and allow errors to kill
 * the program instead of hanging it.
 */

exports.wrap = function (fn) {
  return function (req, res, next) {
    // Make sure to `.catch()` any errors and pass them along to the `next()`
    // middleware in the chain, in this case the error handler.
    fn(req, res).then(returnVal => res.send(returnVal)).catch(next);
  };
};
