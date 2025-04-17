const colors = require("colors");

const logger = (req, _res, next) => {
  const methodColors = {
    GET: "green",
    POST: "blue",
    PUT: "yellow",
    DELETE: "red",
  };

  const color = methodColors[req.method] || "white";
  console.log(
    colors[color](
      `${req.method} ${req.protocol}://${req.get("host")}${req.originalUrl}`
    )
  );
  next();
};

module.exports = logger;
