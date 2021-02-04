import net from "net";

import doApiCall from "./api.js";

const port = 5001;

const server = net.createServer();

server.on("connection", (socket) => {
  logger.info(`CONNECTED: ${socket.remoteAddress}:${socket.remotePort}`);

  socket.on("data", async (data) => {
    try {
      socket.end();

      logger.debug("Received data", data.toString());

      data_arr = data.toString().split(/[ ,]+/);
      if (data_arr[3] === "root" || data_arr[3] === "root") {
        user = data_arr[3];
        ip = data_arr[5];
        port = data_arr.reverse()[1];
      } else {
        user = data_arr[5];
        ip = data_arr[7];
        port = data_arr.reverse()[1];
      }

      logger.debug(`Parsed ${username} ${ip} ${port}`);

      const ipLocation = await doApiCall(ip);

      if (!ipLocation) {
        logger.error("No data retrieved, cannot continue");
        return;
      }

      logger.debug(
        `Geohashing with lat: ${ipLocation.lat}, lon: ${ipLocation.lon}`
      );

      // Remove lon and lat from tags
      const { lon, lat, ...others } = ipLocation;

      influx.writePoints([
        {
          measurement: "geossh",
          fields: {
            value: 1,
          },
          tags: {
            geohash: geohashed,
            username,
            port,
            ip,
            location: `${ipLocation.regionName}, ${ipLocation.city}`,
            ...others,
          },
        },
      ]);
    } catch (e) {
      logger.error(
        "An error has occurred processing one connection:",
        e.message
      );
    }
  });

  socket.on("close", () => {
    logger.info(`CLOSED: ${socket.remoteAddress}:${socket.remotePort}`);
  });
});

server.listen(port, () => {
  logger.info(`TCP Server is running on port ${port}.`);
});
